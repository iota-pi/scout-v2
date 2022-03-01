import { APIGatewayProxyResult, type APIGatewayProxyEvent } from 'aws-lambda';
import AWS from 'aws-sdk';
import { ResponseBody, type RequestBody } from './types';

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  region: 'ap-southeast-2',
});

const ONE_DAY = 24 * 60 * 60 * 1000;
const TableName = process.env.TABLE_NAME!;

export async function occupyRoom(room: string, time: string, occupied: boolean) {
  await ddb.update({
    TableName,
    Key: {
      room,
    },
    UpdateExpression: 'SET #state.#timeKey = :occupied, #ttl = :ttl',
    ExpressionAttributeNames: {
      '#state': 'state',
      '#timeKey': time,
      '#ttl': 'ttl',
    },
    ExpressionAttributeValues: {
      ':ttl': new Date().getTime() + ONE_DAY,
      ':occupied': occupied,
    },
  }).promise();
}

export async function checkRoom(room: string, time: string) {
  const result = await ddb.get({
    TableName,
    Key: { room },
    ExpressionAttributeNames: {
      '#state': 'state',
      '#timeKey': time,
    },
    ProjectionExpression: '#state.#timeKey',
  }).promise();
  const item = result.Item as { state: { [time: string]: boolean } };
  return item.state[time];
}

export async function checkRooms(rooms: string[], time: string) {
  return Promise.all(rooms.map(room => checkRoom(room, time)));
}

const getHandlers = (body: RequestBody) => {
  const { occupied, rooms, time } = body;

  const handlers: Record<RequestBody['action'], () => Promise<ResponseBody>> = {
    occupy: async () => {
      if (occupied === undefined) {
        return {
          error: 'Received action "occupy" with no value given for "occupied" status',
        };
      }

      const promises: Promise<void>[] = [];
      for (const room of rooms) {
        promises.push(occupyRoom(room, time, occupied));
      }
      await Promise.all(promises);
      return {
        results: rooms.map(room => ({
          occupied,
          room,
          time,
        })),
      };
    },
    check: async () => {
      const results = await checkRooms(rooms, time);
      return {
        results: results.map((result, i) => ({
          occupied: result,
          room: rooms[i],
          time,
        })),
      };
    },
  };
  return handlers;
}


export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing body on request' }),
    };
  }
  const body: RequestBody = JSON.parse(event.body);
  const handlers = getHandlers(body);
  const actionFunc = handlers[body.action];
  if (actionFunc) {
    const result = await actionFunc();
    const statusCode = result.error ? 500 : 200;
    return {
      statusCode,
      body: JSON.stringify(result),
    };
  }
  return {
    statusCode: 400,
    body: JSON.stringify({ error: `Could not find action "${body.action}"` }),
  };
}

export default handler;
