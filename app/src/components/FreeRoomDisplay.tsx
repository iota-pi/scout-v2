import React, { useCallback, useEffect, useState } from 'react';
import {
  Checkbox,
  FormControlLabel,
  Grid, makeStyles, useTheme,
} from '@material-ui/core';
import { IndeterminateCheckBox } from '@material-ui/icons';
import { DayAbbrev, WeekData } from '../interfaces';
import { neatRoomName, roomToColour } from '../util';
import { checkRooms, occupyRoom } from '../api';
import { RoomResult } from '../../../api/types';


export interface Props {
  data: WeekData,
  day: DayAbbrev,
  duration: number,
  start: number,
  weeks: number,
  setLoading: (loading: boolean) => void,
}

const useStyles = makeStyles(theme => ({
  room: {
    padding: theme.spacing(1, 2),
    ...theme.typography.body1,
    transition: theme.transitions.create('opacity'),
  },
}));

export default function FreeRoomDisplay(
  { data, day, duration, setLoading, start, weeks }: Props,
) {
  const classes = useStyles();
  const theme = useTheme();
  const [occupied, setOccupied] = useState<Record<string, boolean | undefined>>({});
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

  const handleResults = useCallback(
    (results: RoomResult[] | undefined) => {
      setLoading(false);
      if (results) {
        setOccupied(oldOccupied => {
          const newOccupied = { ...oldOccupied };
          for (const room of results) {
            newOccupied[room.room] = room.occupied;
          }
          return newOccupied;
        });
      }
    },
    [setLoading],
  );

  const toggleRoom = useCallback(
    (room: string) => () => {
      setLoading(true);
      occupyRoom([room], day, start, duration, !occupied[room]).then(handleResults);
    },
    [day, duration, handleResults, occupied, setLoading, start],
  );

  useEffect(
    () => {
      if (rooms.length) {
        setLoading(true);
        checkRooms(rooms, day, start, duration).then(handleResults);
      }
    },
    [day, duration, handleResults, rooms, setLoading, start],
  );

  return (
    <Grid container>
      {rooms.map(room => {
        const roomColor = roomToColour(room);
        const backgroundColor = roomColor ? roomColor[700] : undefined;
        const color = backgroundColor ? theme.palette.getContrastText(backgroundColor) : undefined;
        const dark = color?.toLowerCase().includes('fff');
        const checked = occupied[room] || false;
        const opacity = checked ? 0.6 : undefined;
        return (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            className={classes.room}
            style={{ backgroundColor, color, opacity }}
            key={room}
          >
            <FormControlLabel
              control={(
                <Checkbox
                  checked={checked}
                  onClick={toggleRoom(room)}
                  color={dark ? 'primary' : 'secondary'}
                  checkedIcon={<IndeterminateCheckBox />}
                />
              )}
              label={neatRoomName(room)}
            />
          </Grid>
        );
      })}
    </Grid>
  );
}
