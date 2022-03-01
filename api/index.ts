import { type APIGatewayProxyEvent } from 'aws-lambda';
import AWS, { AWSError } from 'aws-sdk';
import { randomBytes } from 'crypto';
import { type RequestBody, type ResponseBody } from './types';

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  region: 'ap-southeast-2',
});

const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;
const TableName = process.env.TABLE_NAME!;

export async function register(session: string | null | undefined, connection: string) {
  const newSession = session || randomBytes(6).toString('base64');
  const item = await ddb.get({
    TableName,
    Key: { session: newSession },
  }).promise();
  if (item.Item && item.Item.connections.includes(connection)) {
    return newSession;
  }

  await ddb.update({
    TableName,
    Key: {
      session: newSession,
    },
    UpdateExpression: 'SET #c = list_append(if_not_exists(#c, :empty), :new), #ttl = :ttl',
    ExpressionAttributeNames: {
      '#c': 'connections',
      '#ttl': 'ttl',
    },
    ExpressionAttributeValues: {
      ':new': [connection],
      ':ttl': new Date().getTime() + ONE_MONTH,
      ':empty': [],
    },
  }).promise();
  return newSession;
}

export async function deleteConnection(session: string, connection: string, retry = true): Promise<void> {
  const item = await ddb.get({
    TableName,
    Key: { session },
  }).promise();
  try {
    const connections = (item.Item?.connections || []) as string[];
    await ddb.update({
      TableName,
      Key: { session },
      ConditionExpression: 'attribute_exists(#c) AND size(#c) = :expectedSize',
      ExpressionAttributeNames: {
        '#c': 'connections',
      },
      ExpressionAttributeValues: {
        ':c': connections.filter(c => c !== connection),
        ':expectedSize': connections.length,
      },
      UpdateExpression: 'SET #c = :c',
    }).promise();
  } catch (error) {
    console.error(`Failed to delete old connection (${connection}) from session ${session}`, error);
    if (retry) {
      console.info('Retrying deletion');
      return deleteConnection(session, connection, false);
    }
  }
}

export async function getAllConnections(session: string) {
  const result = await ddb.get({
    TableName,
    Key: { session },
    ExpressionAttributeNames: {
      '#connections': 'connections',
    },
    ProjectionExpression: '#connections',
  }).promise();
  const item = result.Item as { connections: string[] };
  return item.connections;
}

export async function getOtherConnections(session: string, connection: string) {
  const allConnections = await getAllConnections(session);
  return allConnections.filter(c => c !== connection);
}

const getHandlers = (event: APIGatewayProxyEvent, body: RequestBody) => {
  const apigw = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage,
  });
  function post(connection: string, data: ResponseBody) {
    return apigw.postToConnection({
      ConnectionId: connection,
      Data: JSON.stringify(data),
    }).promise();
  }

  const { session } = body;
  const connection = event.requestContext.connectionId!;

  const handlers: Record<RequestBody['action'], () => Promise<void>> = {
    register: async () => {
      const newSession = await register(session, connection);
      await post(connection, { type: 'registration-success', session: newSession });
      if (session) {
        await handlers.request();
      }
    },
    broadcast: async () => {
      if (!session) {
        throw new Error('Received broadcast request with no session');
      }
      if (!body.data){
        throw new Error('Received broadcast request but no body to broadcast');
      }
      const connections = await getOtherConnections(session, connection);
      const broadcastPromises = [];
      for (const connection of connections) {
        broadcastPromises.push(
          post(connection, body.data).catch(
            error => {
              console.error(`Failed to push to connection ${connection}`, error);
              if (error.statusCode === 410) {
                return deleteConnection(session, connection);
              }
            },
          ),
        );
      }
      await Promise.all(broadcastPromises);
    },
    request: async () => {
      if (!session) {
        throw new Error('Received broadcast request with no session');
      }
      const connections = await getOtherConnections(session, connection);
      for (const connection of connections) {
        try {
          await post(connection, { type: 'request' });
          break;
        } catch (error: unknown) {
          console.error(`Failed to push to connection ${connection}`, error);
          if ((error as AWSError).statusCode === 410) {
            await deleteConnection(session, connection);
          }
        }
      }
    },
  };
  return handlers;
}


export async function handler(event: APIGatewayProxyEvent) {
  if (!event.body) {
    return { statusCode: 400 };
  }
  const body: RequestBody = JSON.parse(event.body);
  const handlers = getHandlers(event, body);
  const actionFunc = handlers[body.action];
  if (actionFunc) {
    await actionFunc();
    return { statusCode: 200 };
  }
  return { statusCode: 400 };
}

export default handler;
