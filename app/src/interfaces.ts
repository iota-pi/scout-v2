export type RegionName = 'low' | 'mid' | 'top';
export type DayAbbrev = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type RoomData = {
  [hour: number]: number,
};

export type DayData = {
  [room: string]: RoomData,
};

export interface FullData {
  mon: DayData,
  tue: DayData,
  wed: DayData,
  thu: DayData,
  fri: DayData,
  sat: DayData,
  sun: DayData,
}

export const initData: FullData = {
  mon: {},
  tue: {},
  wed: {},
  thu: {},
  fri: {},
  sat: {},
  sun: {},
};
