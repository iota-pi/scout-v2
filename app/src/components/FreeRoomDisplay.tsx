import React from 'react';
import {
  List,
  ListItem,
} from '@material-ui/core';
import { DayAbbrev, WeekData } from '../interfaces';


export interface Props {
  data: WeekData,
  day: DayAbbrev,
  duration: number,
  start: number,
  weeks: number,
}

export default function FreeRoomDisplay({ data, day, duration, start, weeks }: Props) {
  const rooms = React.useMemo(
    () => {
      const dayData = data[day];
      const result: string[] = [];
      for (const room of Object.keys(dayData)) {
        const roomData = dayData[room];
        let booked = false;
        for (let i = 0; i < duration; i++) {
          const hour = start + i;
          // eslint-disable-next-line no-console
          console.log(roomData[hour], weeks);
          const overlapWeeks = roomData[hour] & weeks;
          if (overlapWeeks > 0) {
            booked = true;
            break;
          }
        }
        if (!booked) {
          result.push(room);
        }
      }
      return result;
    },
    [data, day, duration, start, weeks],
  );

  return (
    <List>
      {rooms.map(room => (
        <ListItem key={room}>
          {room}
        </ListItem>
      ))}
    </List>
  );
}