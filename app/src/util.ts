import { FullData } from './interfaces';

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

export function getDefaultWeeks(data: FullData) {
  const d = new Date();
  const termStart = new Date(data.meta.from);
  const difference = d.getTime() - termStart.getTime();
  const differenceInWeeks = Math.floor(difference / 1000 / 60 / 60 / 24 / 7);
  return 1 << differenceInWeeks;
}
