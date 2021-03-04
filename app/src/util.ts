import { PeriodOption } from './components/WeekSelection';
import { MetaData } from './interfaces';

const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;

export function weeksToArray(weeks: number) {
  const array: number[] = [];
  let i = 1;
  let x = weeks;
  while (x > 0) {
    if (x % 2) {
      array.push(i);
    }
    x = Math.floor(x / 2);
    i += 1;
  }
  return array;
}

export function getCurrentWeek(meta: MetaData) {
  const start = new Date(meta.from);
  const d = new Date();
  const difference = d.getTime() - start.getTime();
  const differenceInWeeks = Math.floor(difference / MS_PER_WEEK);
  const duration = weeksInTerm(meta);
  return Math.min(Math.max(1, differenceInWeeks + 1), duration);
}

export function weekToInt(week: number) {
  return 1 << (week - 1);
}

export function weeksInTerm(meta: MetaData): number {
  const start = new Date(meta.from);
  const end = new Date(meta.to);
  const termDuration = Math.floor((end.getTime() - start.getTime()) / MS_PER_WEEK) + 1;
  return termDuration;
}

export function periodToWeeks(period: PeriodOption, meta: MetaData): number {
  const termDuration = weeksInTerm(meta);
  let currentWeek = getCurrentWeek(meta);
  let endWeek = currentWeek;
  if (period === PeriodOption.next) {
    currentWeek += 1;
    endWeek += 1;
  } else if (period === PeriodOption.term) {
    endWeek = termDuration;
  }

  let weeksNumber = 0;
  for (let w = currentWeek; w <= endWeek; w++) {
    weeksNumber += weekToInt(w);
  }

  return weeksNumber;
}
