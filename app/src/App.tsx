import React from 'react';
import axios from 'axios';
import { makeStyles } from '@material-ui/core/styles';
import { Container, Fade, Grid, LinearProgress, Typography } from '@material-ui/core';
import DaySelection, { getToday } from './components/DaySelection';
import TimeSelection, { getLikelyHour } from './components/TimeSelection';
import DurationSelection from './components/DurationSelection';
import FreeRoomDisplay from './components/FreeRoomDisplay';
import RegionSelection from './components/RegionSelection';
import { FullData, initData, RegionName } from './interfaces';
import WeekSelection, { PeriodOption } from './components/WeekSelection';
import { periodToWeeks } from './util';


const DATA_URI_BASE = process.env.REACT_APP_DATA_URI_BASE || '/data';
function getDataURI(region: string) {
  return `${DATA_URI_BASE}/${region}.json`;
}

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
  loading: {
    height: 2,
  },
}));

export default function App() {
  const classes = useStyles();
  const [day, setDay] = React.useState(getToday());
  const [start, setStart] = React.useState(getLikelyHour());
  const [duration, setDuration] = React.useState(1);
  const [region, setRegion] = React.useState<RegionName>('mid');
  const [period, setPeriod] = React.useState(PeriodOption.current);
  const [data, setData] = React.useState<FullData>(initData);
  const [loading, setLoading] = React.useState(false);

  const weeks = React.useMemo(
    () => periodToWeeks(period, data.meta),
    [period, data],
  );

  React.useEffect(
    () => {
      const uri = getDataURI(region);
      axios.get(uri).then(
        r => {
          setData(r.data);
        },
      ).catch(console.error);
    },
    [region],
  );

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

          <Grid container className={classes.paddingTop}>
            <WeekSelection
              meta={data.meta}
              period={period}
              onChange={setPeriod}
            />
          </Grid>
        </Container>
      </div>

      <Fade in={loading}>
        <LinearProgress
          variant="indeterminate"
          color="secondary"
          className={classes.loading}
        />
      </Fade>

      <div>
        <Container maxWidth="md" className={classes.section}>
          <Typography variant="h3" gutterBottom>
            Free Rooms
          </Typography>

          <FreeRoomDisplay
            data={data.data}
            day={day}
            duration={duration}
            setLoading={setLoading}
            start={start}
            weeks={weeks}
          />
        </Container>
      </div>
    </div>
  );
}
