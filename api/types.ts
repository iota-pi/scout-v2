export interface RegisterRequestBody {
  action: 'register',
  session: string | null,
  data?: undefined,
}

export interface BroadcastRequestBody {
  action: 'broadcast',
  session: string,
  data: BroadcastResponse,
}

export interface RequestSyncRequestBody {
  action: 'request',
  session: string,
  data?: undefined,
}

export interface BroadcastResponse {
  type: 'fullsync' | 'sync',
  content: any,
  session?: never,
}

export interface RequestSyncResponse {
  type: 'request',
  content?: never,
  session?: never,
}

export interface RegistrationResponse {
  type: 'registration-success',
  content?: never,
  session: string,
}

export type RequestBody = RegisterRequestBody | BroadcastRequestBody | RequestSyncRequestBody;
export type ResponseBody = RegistrationResponse | BroadcastResponse | RequestSyncResponse;
