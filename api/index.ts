import { APIGatewayProxyResult, type APIGatewayProxyEvent } from 'aws-lambda';
import AWS, { AWSError } from 'aws-sdk';
import { ResponseBody, type RequestBody } from './types';

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  region: 'ap-southeast-2',
});

const ONE_DAY = 24 * 60 * 60 * 1000;
const TableName = process.env.TABLE_NAME!;

function getTimeslotId(day: string, hour: number, week: number) {
  return `${day}${hour}w${week}`;
}

export async function occupyRoom(
  room: string,
  day: string,
  hour: number,
  week: number,
  occupied: boolean,
) {
  const timeslot = getTimeslotId(day, hour, week);
  const Key = { timeslot };
  const ttl = new Date().getTime() + ONE_DAY;
  const promise = ddb.update({
    TableName,
    Key,
    UpdateExpression: 'SET rooms.#room = :occupied, #ttl = :ttl',
    ExpressionAttributeNames: {
      '#room': room,
      '#ttl': 'ttl',
    },
    ExpressionAttributeValues: {
      ':ttl': ttl,
      ':occupied': occupied,
    },
  }).promise().catch((error: AWSError) => {
    if (error.code === 'ValidationException') {
      return ddb.update({
        TableName,
        Key,
        UpdateExpression: 'SET rooms = :map, #ttl = :ttl',
        ConditionExpression: 'attribute_not_exists(rooms)',
        ExpressionAttributeNames: {
          '#ttl': 'ttl',
        },
        ExpressionAttributeValues: {
          ':ttl': ttl,
          ':map': { [room]: occupied },
        },
      }).promise();
    }
  });
  await promise;
}

export async function checkRooms(
  rooms: string[],
  day: string,
  start: number,
  duration: number,
  week: number,
) {
  const promises: Promise<Record<string, boolean>>[] = [];
  for (let hour = start; hour < start + duration; ++hour) {
    const timeslot = getTimeslotId(day, start, week);
    const Key = { timeslot };
    promises.push(
      ddb.get({
        TableName,
        Key,
        ProjectionExpression: 'rooms',
      }).promise().then(
        result => (result.Item ? result.Item.rooms : {}),
      ),
    );
  }
  const timeslots = await Promise.all(promises);
  const result: Record<string, boolean> = {};
  for (const room of rooms) {
    result[room] = timeslots.some(timeslot => timeslot[room]);
  }
  return result;
}

const getHandlers = (body: RequestBody) => {
  const { day, duration, occupied, rooms, start, week } = body;

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
          promises.push(occupyRoom(room, day, hour, week, occupied));
        }
      }
      await Promise.all(promises);
      return {
        results: rooms.map(room => ({
          occupied,
          room,
          day,
          start,
          week,
        })),
      };
    },
    check: async () => {
      const results = await checkRooms(rooms, day, start, week, duration);
      return {
        results: rooms.map(room => ({
          occupied: results[room],
          room,
          day,
          start,
          week,
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
  const method = event.httpMethod.toUpperCase();
  if (method === 'OPTIONS') {
    return {
      body: '',
      headers,
      statusCode: 204,
    };
  }

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
