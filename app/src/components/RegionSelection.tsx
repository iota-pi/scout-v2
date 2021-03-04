import React from 'react';
import { makeStyles, Theme, useMediaQuery } from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { RegionName } from '../interfaces';


const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
  toggleButton: {
    flexGrow: 1,
  },
}));


export const regions: RegionName[] = ['low', 'mid', 'top'];

const dayTuples: [RegionName, string][] = [
  ['low', 'Lower Campus'],
  ['mid', 'Quad'],
  ['top', 'Upper Campus'],
];

export interface Props {
  region: RegionName,
  onChange: (region: RegionName) => void,
}

export default function RegionSelection({ region, onChange }: Props) {
  const classes = useStyles();
  const handleChange = React.useCallback(
    (event: React.MouseEvent, newDay: RegionName) => {
      onChange(newDay);
    },
    [onChange],
  );
  const sizeXS = useMediaQuery((theme: Theme) => theme.breakpoints.down('xs'));

  return (
    <ToggleButtonGroup
      className={classes.root}
      exclusive
      value={region}
      onChange={handleChange}
      size={sizeXS ? 'small' : 'large'}
    >
      {dayTuples.map(([abbrev, name]) => (
        <ToggleButton value={abbrev} key={abbrev} className={classes.toggleButton}>
          {name}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
