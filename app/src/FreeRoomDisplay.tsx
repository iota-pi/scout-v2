import React from 'react';
import {
  List,
  ListItem,
  // makeStyles
} from '@material-ui/core';
import axios from 'axios';
import { DayAbbrev, FullData, initData } from './interfaces';

const DATA_URI_BASE = process.env.REACT_APP_DATA_URI_BASE || '/data';
function getDataURI(region: string) {
  return `${DATA_URI_BASE}/${region}.json`;
}

// const useStyles = makeStyles(theme => ({
//   flexGrow: {
//     flexGrow: 1,
//   },
//   marginTop: {
//     marginTop: theme.spacing(2.5),
//   },
// }));

export interface Props {
  day: DayAbbrev,
  duration: number,
  region: string,
  start: number,
  weeks: number,
}

export default function FreeRoomDisplay({ day, duration, region, start, weeks }: Props) {
  // const classes = useStyles();
  const [data, setData] = React.useState<FullData>(initData);
  React.useEffect(
    () => {
      const uri = getDataURI(region);
      axios.get(uri).then(
        r => setData(r.data),
      ).catch(console.error);
    },
    [region],
  );
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
