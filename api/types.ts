export interface OccupyRequestBody {
  action: 'occupy',
  rooms: string[],
  day: string,
  start: number,
  duration: number,
  week: number,
  occupied: boolean,
}

export interface CheckRequestBody {
  action: 'check',
  rooms: string[],
  day: string,
  start: number,
  duration: number,
  week: number,
  occupied?: never,
}

export interface ResponseBody {
  error?: string,
  results?: RoomResult[],
}

export interface RoomResult {
  room: string,
  day: string,
  start: number,
  week: number,
  occupied: boolean,
}

export type RequestBody = OccupyRequestBody | CheckRequestBody;
