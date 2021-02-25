import React from 'react';
import { Grid, makeStyles, MenuItem, TextField } from '@material-ui/core';
import TimelapseIcon from '@material-ui/icons/Timelapse';

const useStyles = makeStyles(theme => ({
  flexGrow: {
    flexGrow: 1,
  },
  marginTop: {
    marginTop: theme.spacing(2.5),
  },
}));

const durationOptions = [
  { text: '1 hour', duration: 1 },
  { text: '2 hours', duration: 2 },
  { text: '3 hours', duration: 3 },
  { text: '4 hours', duration: 4 },
  { text: '5 hours', duration: 5 },
];

export interface Props {
  duration: number,
  onChange: (duration: number) => void,
}

export default function DurationSelection({ duration, onChange }: Props) {
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
        <TimelapseIcon className={classes.marginTop} />
      </Grid>
      <Grid item className={classes.flexGrow}>
        <TextField
          label="Duration"
          select
          fullWidth
          value={duration}
          onChange={handleChange}
        >
          {durationOptions.map(item => (
            <MenuItem
              value={item.duration}
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
