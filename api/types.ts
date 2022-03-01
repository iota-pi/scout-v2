export interface OccupyRequestBody {
  action: 'occupy',
  rooms: string[],
  time: string,
  occupied: boolean,
}

export interface CheckRequestBody {
  action: 'check',
  rooms: string[],
  time: string,
  occupied?: never,
}

export interface ResponseBody {
  error?: string,
  results?: RoomResult[],
}

export interface RoomResult {
  room: string,
  time: string,
  occupied: boolean,
}

export type RequestBody = OccupyRequestBody | CheckRequestBody;
