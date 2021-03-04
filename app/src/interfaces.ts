export type RegionName = 'low' | 'mid' | 'top';
export type DayAbbrev = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type RoomData = {
  [hour: number]: number,
};

export type DayData = {
  [room: string]: RoomData,
};

export interface WeekData {
  mon: DayData,
  tue: DayData,
  wed: DayData,
  thu: DayData,
  fri: DayData,
  sat: DayData,
  sun: DayData,
}

export interface MetaData {
  from: string,
  to: string,
  term: string,
}

export interface FullData {
  data: WeekData,
  meta: MetaData,
}

export const initData: FullData = {
  data: {
    mon: {},
    tue: {},
    wed: {},
    thu: {},
    fri: {},
    sat: {},
    sun: {},
  },
  meta: {
    from: '',
    to: '',
    term: '?',
  },
};
