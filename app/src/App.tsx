import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Container, Grid, Typography } from '@material-ui/core';
import DaySelection, { getToday } from './DaySelection';
import TimeSelection, { getLikelyHour } from './TimeSelection';
import DurationSelection from './DurationSelection';
import FreeRoomDisplay from './FreeRoomDisplay';
import RegionSelection from './RegionSelection';
import { RegionName } from './interfaces';


const useStyles = makeStyles(theme => ({
  header: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(4),
    backgroundColor: theme.palette.grey[100],
  },
  section: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paddingTop: {
    paddingTop: theme.spacing(2),
  },
}));

export default function App() {
  const classes = useStyles();
  const [day, setDay] = React.useState(getToday());
  const [start, setStart] = React.useState(getLikelyHour());
  const [duration, setDuration] = React.useState(1);
  const [region, setRegion] = React.useState<RegionName>('mid');

  return (
    <div>
      <div className={classes.header}>
        <Container maxWidth="md">
          <Grid container className={classes.paddingTop}>
            <RegionSelection region={region} onChange={setRegion} />
          </Grid>

          <Grid container className={classes.paddingTop}>
            <DaySelection day={day} onChange={setDay} />
          </Grid>

          <Grid container className={classes.paddingTop}>
            <Grid item xs={12} sm={6}>
              <TimeSelection hour={start} onChange={setStart} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DurationSelection duration={duration} onChange={setDuration} />
            </Grid>
          </Grid>
        </Container>
      </div>

      <div>
        <Container maxWidth="md" className={classes.section}>
          <Typography variant="h3">
            Free Rooms
          </Typography>

          <FreeRoomDisplay
            day={day}
            duration={duration}
            start={start}
            region={region}
            weeks={1 << 1}
          />
        </Container>
      </div>
    </div>
  );
}
