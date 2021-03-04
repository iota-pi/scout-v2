import React from 'react';
import { makeStyles, Theme, useMediaQuery } from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { DayAbbrev } from '../interfaces';


const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
  toggleButton: {
    flexGrow: 1,
  },
}));


export const days: DayAbbrev[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export function getToday() {
  const index = (new Date().getDay() - 1) % 6;
  return days[index];
}

const dayTuples: [DayAbbrev, string][] = [
  ['mon', 'Monday'],
  ['tue', 'Tuesday'],
  ['wed', 'Wednesday'],
  ['thu', 'Thursday'],
  ['fri', 'Friday'],
  ['sat', 'Saturday'],
  ['sun', 'Sunday'],
];

export interface Props {
  day: DayAbbrev,
  onChange: (day: DayAbbrev) => void,
}

export default function DaySelection({ day, onChange }: Props) {
  const classes = useStyles();
  const handleChange = React.useCallback(
    (event: React.MouseEvent, newDay: DayAbbrev) => {
      onChange(newDay);
    },
    [onChange],
  );
  const sizeXS = useMediaQuery((theme: Theme) => theme.breakpoints.down('xs'));
  const sizeSM = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  return (
    <ToggleButtonGroup
      className={classes.root}
      exclusive
      value={day}
      onChange={handleChange}
      size={sizeXS ? 'small' : 'large'}
    >
      {dayTuples.map(([abbrev, name]) => (
        <ToggleButton value={abbrev} key={abbrev} className={classes.toggleButton}>
          {sizeSM ? name.substr(0, 3) : name}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
