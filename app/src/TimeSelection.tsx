import React from 'react';
import { Grid, makeStyles, MenuItem, TextField } from '@material-ui/core';
import { AccessTime } from '@material-ui/icons';

const useStyles = makeStyles(theme => ({
  flexGrow: {
    flexGrow: 1,
  },
  marginTop: {
    marginTop: theme.spacing(2.5),
  },
}));

export interface TimeOption {
  text: string,
  time: number,
}

const timeOptions: TimeOption[] = [
  { text: '09:00 AM', time: 9 },
  { text: '10:00 AM', time: 10 },
  { text: '11:00 AM', time: 11 },
  { text: '12:00 PM', time: 12 },
  { text: '01:00 PM', time: 13 },
  { text: '02:00 PM', time: 14 },
  { text: '03:00 PM', time: 15 },
  { text: '04:00 PM', time: 16 },
  { text: '05:00 PM', time: 17 },
  { text: '06:00 PM', time: 18 },
];
const earliestHour = Math.min(...timeOptions.map(t => t.time));
const latestHour = Math.max(...timeOptions.map(t => t.time));

export function getLikelyHour() {
  const d = new Date();
  const hour = d.getHours();
  const nearNextHour = +(d.getMinutes() > 40);
  const likelyHour = (hour + nearNextHour) % 24;
  return Math.max(Math.min(likelyHour, latestHour), earliestHour);
}

export interface Props {
  hour: number,
  onChange: (hour: number) => void,
}

export default function TimeSelection({ hour, onChange }: Props) {
  const classes = useStyles();
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      onChange(event.target.value as number);
    },
    [onChange],
  );

  return (
    <Grid container spacing={1}>
      <Grid item>
        <AccessTime className={classes.marginTop} />
      </Grid>
      <Grid item className={classes.flexGrow}>
        <TextField
          label="Start time"
          select
          fullWidth
          value={hour || ''}
          onChange={handleChange}
        >
          {timeOptions.map(item => (
            <MenuItem
              value={item.time}
              key={item.text}
            >
              {item.text}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
    </Grid>
  );
}
