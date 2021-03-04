import React from 'react';
import { makeStyles, Theme, useMediaQuery } from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { getCurrentWeek, weeksInTerm } from '../util';
import { MetaData } from '../interfaces';

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
  toggleButton: {
    flexGrow: 1,
  },
}));

export enum PeriodOption {
  current,
  next,
  term,
}

const periodOptions: [PeriodOption, string][] = [
  [PeriodOption.current, 'This week'],
  [PeriodOption.next, 'Next week'],
  [PeriodOption.term, 'Rest of term'],
];

export function getWeeksDescription(period: PeriodOption, meta: MetaData) {
  const currentWeek = getCurrentWeek(meta);
  const finalWeek = weeksInTerm(meta);

  if (period === PeriodOption.current) {
    return `Week ${currentWeek}`;
  } else if (period === PeriodOption.next) {
    return `Week ${currentWeek + 1}`;
  }

  return `Weeks ${currentWeek}–${finalWeek}`;
}

export interface Props {
  meta: MetaData | undefined,
  period: number,
  onChange: (period: number) => void,
}

export default function WeekSelection({ meta, period, onChange }: Props) {
  const classes = useStyles();
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<{}>, value: PeriodOption) => {
      onChange(value);
    },
    [onChange],
  );
  const sizeXS = useMediaQuery((theme: Theme) => theme.breakpoints.down('xs'));

  return (
    <ToggleButtonGroup
      className={classes.root}
      exclusive
      value={period}
      onChange={handleChange}
      size={sizeXS ? 'small' : 'large'}
    >
      {periodOptions.map(([id, text]) => (
        <ToggleButton value={id} key={id} className={classes.toggleButton}>
          {text}
          {meta && (
            <>
              <br />
              {getWeeksDescription(id, meta)}
            </>
          )}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
