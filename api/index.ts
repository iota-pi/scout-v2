import { APIGatewayProxyResult, type APIGatewayProxyEvent } from 'aws-lambda';
import AWS from 'aws-sdk';
import { ResponseBody, type RequestBody } from './types';

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  region: 'ap-southeast-2',
});

const ONE_DAY = 24 * 60 * 60 * 1000;
const TableName = process.env.TABLE_NAME!;

function getTimeKey(day: string, hour: number) {
  return `${day}${hour}`;
}

export async function occupyRoom(room: string, day: string, hour: number, occupied: boolean) {
  const time = getTimeKey(day, hour);
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

export async function checkRoom(room: string, day: string, start: number, duration: number) {
  const result = await ddb.get({
    TableName,
    Key: { room },
    ExpressionAttributeNames: {
      '#state': 'state',
    },
    ProjectionExpression: '#state',
  }).promise();
  const item = result.Item as { state: { [time: string]: boolean } };
  let occupied = false;
  for (let hour = start; hour < start + duration; ++hour) {
    const time = getTimeKey(day, hour);
    occupied ||= item.state[time];
  }
  return occupied;
}

export async function checkRooms(rooms: string[], day: string, start: number, duration: number) {
  return Promise.all(rooms.map(room => checkRoom(room, day, start, duration)));
}

const getHandlers = (body: RequestBody) => {
  const { occupied, rooms, day, start, duration } = body;

  const handlers: Record<RequestBody['action'], () => Promise<ResponseBody>> = {
    occupy: async () => {
      if (occupied === undefined) {
        return {
          error: 'Received action "occupy" with no value given for "occupied" status',
        };
      }

      const promises: Promise<void>[] = [];
      for (const room of rooms) {
        for (let hour = start; hour < start + duration; ++hour) {
          promises.push(occupyRoom(room, day, hour, occupied));
        }
      }
      await Promise.all(promises);
      return {
        results: rooms.map(room => ({
          occupied,
          room,
          day,
          start,
        })),
      };
    },
    check: async () => {
      const results = await checkRooms(rooms, day, start, duration);
      return {
        results: results.map((result, i) => ({
          occupied: result,
          room: rooms[i],
          day,
          start,
        })),
      };
    },
  };
  return handlers;
}

export function getResponseHeaders(origin: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const originAllowed = (
    /^https?:\/\/([^.]+\.)*scout\.cross-code\.org$/.test(origin)
    || /^http:\/\/localhost:[0-9]+$/.test(origin)
  );
  if (originAllowed) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Headers'] = '*';
    headers['Access-Control-Allow-Methods'] = '*';
  }
  return headers;
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const headers = getResponseHeaders(event.headers.origin || '');
  if (!event.body) {
    return {
      body: JSON.stringify({ error: 'Missing body on request' }),
      headers,
      statusCode: 400,
    };
  }
  const body: RequestBody = JSON.parse(event.body);
  const handlers = getHandlers(body);
  const actionFunc = handlers[body.action];
  if (actionFunc) {
    const result = await actionFunc();
    const statusCode = result.error ? 500 : 200;
    return {
      body: JSON.stringify(result),
      headers,
      statusCode,
    };
  }
  return {
    body: JSON.stringify({ error: `Could not find action "${body.action}"` }),
    headers,
    statusCode: 400,
  };
}

export default handler;
