import React, { useCallback, useEffect } from 'react';
import {
  Checkbox,
  Grid, makeStyles, useTheme,
} from '@material-ui/core';
import { DayAbbrev, WeekData } from '../interfaces';
import { neatRoomName, roomToColour } from '../util';
import { checkRooms } from '../api';


export interface Props {
  data: WeekData,
  day: DayAbbrev,
  duration: number,
  start: number,
  weeks: number,
}

const useStyles = makeStyles(theme => ({
  room: {
    padding: theme.spacing(2),
    ...theme.typography.body1,
  },
}));

export default function FreeRoomDisplay({ data, day, duration, start, weeks }: Props) {
  const classes = useStyles();
  const theme = useTheme();
  // const occupied = useState<Record<string, boolean | undefined>>({});
  const rooms = React.useMemo(
    () => {
      const dayData = data[day];
      const result: string[] = [];
      for (const room of Object.keys(dayData)) {
        const roomData = dayData[room];
        let booked = false;
        for (let i = 0; i < duration; i++) {
          const hour = start + i;
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
      result.sort(
        (_a, _b) => {
          const a = _a
            .replace(/\bLG(\d)/, '000$1')
            .replace(/\bG(\d)/, '00$1')
            .replace(/\bM(\d)/, '0$1');
          const b = _b
            .replace(/\bLG(\d)/, '000$1')
            .replace(/\bG(\d)/, '00$1')
            .replace(/\bM(\d)/, '0$1');
          return +(a > b) - +(a < b);
        },
      );
      return result;
    },
    [data, day, duration, start, weeks],
  );
  const toggleRoom = useCallback(
    (room: string) => () => {
      console.warn(room);
    },
    [],
  );

  useEffect(
    () => {
      checkRooms(rooms, day, start, duration);
    },
    [day, duration, rooms, start],
  );

  return (
    <Grid container>
      {rooms.map(room => {
        const roomColor = roomToColour(room);
        const backgroundColor = roomColor ? roomColor[700] : undefined;
        const color = backgroundColor ? theme.palette.getContrastText(backgroundColor) : undefined;
        return (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            className={classes.room}
            style={{ backgroundColor, color }}
            key={room}
          >
            {neatRoomName(room)}

            <Checkbox
              value={false}
              onClick={toggleRoom(room)}
            />
          </Grid>
        );
      })}
    </Grid>
  );
}
