import React from 'react';
import { Checkbox, Grid, makeStyles, TextField, Typography } from '@material-ui/core';
import { Autocomplete, ToggleButtonGroup } from '@material-ui/lab';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import { weeksToArray } from '../util';

const useStyles = makeStyles(theme => ({
  flexGrow: {
    flexGrow: 1,
  },
  marginTop: {
    marginTop: theme.spacing(2.5),
  },
  marginRight: {
    marginRight: theme.spacing(1),
  },
}));

export interface WeekOption {
  text: string,
  id: number,
}

const weekOptions: WeekOption[] = [
  { text: 'This week', id: 'current' },
  { text: 'Next week', id: 'next' },
  { text: 'Rest of term', id: 'term' },
];

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export interface Props {
  weeks: number,
  onChange: (weeks: number) => void,
}

export default function WeekSelection({ weeks, onChange }: Props) {
  const classes = useStyles();
  const [period, setPeriod] = React.useState();
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<{}>, value: WeekOption[]) => {
      const newWeeks = value.reduce((acc, x) => acc + x.week, 0);
      onChange(newWeeks);
    },
    [onChange],
  );

  return (
    <ToggleButtonGroup
      className={classes.root}
      exclusive
      value={period}
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
