import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Chip,
  IconButton,
  Paper,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import AddIcon from '@mui/icons-material/Add';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Body from '../vendor/body-highlighter';
import axios from '../api';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const BODY_MAP_MAPPING = {
  'trapezius-left-front': 'traps',
  'trapezius-right-front': 'traps',
  'trapezius-left-back': 'traps',
  'trapezius-right-back': 'traps',
  'upper-back-left': 'middle back',
  'upper-back-right': 'middle back',
  'lower-back-left': 'lower back',
  'lower-back-right': 'lower back',
  'chest-left': 'chest',
  'chest-right': 'chest',
  'biceps-left': 'biceps',
  'biceps-right': 'biceps',
  'triceps-left-front': 'triceps',
  'triceps-right-front': 'triceps',
  'triceps-left-back': 'triceps',
  'triceps-right-back': 'triceps',
  'forearm-left-front': 'forearms',
  'forearm-right-front': 'forearms',
  'forearm-left-back': 'forearms',
  'forearm-right-back': 'forearms',
  'deltoids-left-front': 'shoulders',
  'deltoids-right-front': 'shoulders',
  'deltoids-left-back': 'shoulders',
  'deltoids-right-back': 'shoulders',
  'abs-upper': 'abdominals',
  'abs-lower': 'abdominals',
  'obliques-left': 'abdominals',
  'obliques-right': 'abdominals',
  'adductors-left-front': 'adductors',
  'adductors-right-front': 'adductors',
  'adductors-left-back': 'adductors',
  'adductors-right-back': 'adductors',
  'hamstring-left': 'hamstrings',
  'hamstring-right': 'hamstrings',
  'quadriceps-left': 'quadriceps',
  'quadriceps-right': 'quadriceps',
  'calves-left-front': 'calves',
  'calves-right-front': 'calves',
  'calves-left-back': 'calves',
  'calves-right-back': 'calves',
  'gluteal-left': 'glutes',
  'gluteal-right': 'glutes',
  'neck-left-front': 'neck',
  'neck-right-front': 'neck',
  'neck-left-back': 'neck',
  'neck-right-back': 'neck',
};

const minutesToHm = (minutes) => {
  if (minutes === null || minutes === undefined || minutes === '') return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
};

function MuscleHighlight({ exercises, sessionLogs }) {
  const [view, setView] = useState('front');
  const theme = useTheme();

  const muscleFrequency = useMemo(() => {
    const freq = {};
    const processMuscles = (muscleStr, weight = 1) => {
      (muscleStr || '').split(',').forEach((m) => {
        const t = m.trim().toLowerCase();
        if (t) freq[t] = (freq[t] || 0) + weight;
      });
    };

    if (sessionLogs && sessionLogs.length > 0) {
      sessionLogs.forEach((log) => {
        processMuscles(log.primary_muscles, 1);
        processMuscles(log.secondary_muscles, 0.5);
      });
    } else if (exercises) {
      exercises.forEach((ex) => {
        processMuscles(ex.primary_muscles, 2);
        processMuscles(ex.secondary_muscles, 1);
      });
    }

    return freq;
  }, [exercises, sessionLogs]);

  const data = useMemo(() => {
    return Object.keys(BODY_MAP_MAPPING)
      .map((slug) => {
        const backendMuscle = BODY_MAP_MAPPING[slug];
        const freq = muscleFrequency[backendMuscle] || 0;
        return {
          slug: slug,
          intensity: Math.ceil(freq),
        };
      })
      .filter((d) => d.intensity > 0);
  }, [muscleFrequency]);

  if (data.length === 0) return null;

  return (
    <Box sx={{ mt: 2, textAlign: 'center' }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Muscles Worked Intensity
      </Typography>
      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={(_, v) => v && setView(v)}
        size="small"
        sx={{
          mb: 1,
          '& .MuiToggleButton-root': {
            borderColor: 'divider',
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            },
          },
        }}
      >
        <ToggleButton value="front" sx={{ px: 1, py: 0.2, fontSize: '0.7rem' }}>
          Front
        </ToggleButton>
        <ToggleButton value="back" sx={{ px: 1, py: 0.2, fontSize: '0.7rem' }}>
          Back
        </ToggleButton>
      </ToggleButtonGroup>
      <Box sx={{ width: 140, height: 200, mx: 'auto' }}>
        <Body
          side={view}
          data={data}
          colors={['#e3f2fd', '#90caf9', '#42a5f5', '#1e88e5', '#1565c0']}
          scale={0.5}
          theme={theme.palette.mode}
        />
      </Box>
    </Box>
  );
}

function MuscleReadiness({ day, lastTrainedMuscles }) {
  if (!lastTrainedMuscles) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const muscles = new Set();
  day.exercises.forEach((ex) => {
    (ex.primary_muscles || '').split(',').forEach((m) => {
      const t = m.trim().toLowerCase();
      if (t) muscles.add(t);
    });
  });

  const muscleStatus = Array.from(muscles).map((m) => {
    const lastDateStr = lastTrainedMuscles[m];
    if (!lastDateStr) return { muscle: m, status: 'ready', days: Infinity };

    const lastDate = new Date(lastDateStr);
    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays >= 2) return { muscle: m, status: 'ready', days: diffDays };
    if (diffDays >= 1)
      return { muscle: m, status: 'recovering', days: diffDays };
    return { muscle: m, status: 'needs_rest', days: diffDays };
  });

  if (muscleStatus.length === 0) return null;

  const overallStatus = muscleStatus.reduce((acc, curr) => {
    if (curr.status === 'needs_rest') return 'needs_rest';
    if (curr.status === 'recovering' && acc !== 'needs_rest')
      return 'recovering';
    return acc;
  }, 'ready');

  const statusColors = {
    ready: 'success',
    recovering: 'warning',
    needs_rest: 'error',
  };

  const statusLabels = {
    ready: 'Ready',
    recovering: 'Recovering (1 day rest)',
    needs_rest: 'Needs Rest (0 days rest)',
  };

  return (
    <Box>
      <Tooltip
        title={
          <Box sx={{ p: 0.5 }}>
            {muscleStatus.map((m) => (
              <Typography key={m.muscle} variant="caption" display="block">
                {m.muscle.charAt(0).toUpperCase() + m.muscle.slice(1)}:{' '}
                {m.status.replace('_', ' ')} (
                {m.days === Infinity ? 'never' : m.days + ' days ago'})
              </Typography>
            ))}
          </Box>
        }
      >
        <Chip
          label={statusLabels[overallStatus]}
          color={statusColors[overallStatus]}
          size="small"
          variant="outlined"
        />
      </Tooltip>
    </Box>
  );
}

export default function Dashboard({ onNavigate, onStartWorkout }) {
  const [loading, setLoading] = useState(true);
  const [activeDateStr, setActiveDateStr] = useState(
    new Date().toLocaleDateString('en-CA')
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [allData, setAllData] = useState({
    sleep: [],
    measurements: [],
    sessions: [],
    photoDates: [],
    lastTrainedMuscles: {},
  });
  const [plans, setPlans] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Dialog states
  const [openMeasurements, setOpenMeasurements] = useState(false);
  const [openPhotos, setOpenPhotos] = useState(false);
  const [openStartWorkout, setOpenStartWorkout] = useState(false);

  const [measurementForm, setMeasurementForm] = useState({
    bodyweight: '',
    body_fat: '',
    chest: '',
    waist: '',
    biceps: '',
    forearm: '',
    calf: '',
    thigh: '',
  });

  const [photoFiles, setPhotoFiles] = useState({
    front: null,
    side: null,
    back: null,
  });
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        sleepRes,
        measureRes,
        sessionRes,
        planRes,
        photoRes,
        lastTrainedRes,
      ] = await Promise.all([
        axios.get('/api/sleep'),
        axios.get('/api/measurements'),
        axios.get('/api/workouts/sessions?limit=100'),
        axios.get('/api/workouts/plans'),
        axios.get('/api/photos/dates'),
        axios.get('/api/workouts/last-trained-muscles'),
      ]);

      setAllData({
        sleep: sleepRes.data,
        measurements: measureRes.data,
        sessions: sessionRes.data,
        photoDates: photoRes.data.map((d) => d.date),
        lastTrainedMuscles: lastTrainedRes.data,
      });
      setPlans(planRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showSnackbar('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeData = useMemo(() => {
    const sleep = allData.sleep.find((s) => s.date === activeDateStr);
    const measurements = allData.measurements.find(
      (m) => m.date === activeDateStr
    );
    const workout = allData.sessions.find((s) => s.date === activeDateStr);
    const hasPhotos = allData.photoDates.includes(activeDateStr);

    // Identify scheduled workout for this day
    const dateObj = new Date(activeDateStr + 'T00:00:00');
    const dayName = DAYS_OF_WEEK[dateObj.getDay()];
    let scheduledWorkout = null;

    plans.forEach((plan) => {
      if (plan.days) {
        plan.days.forEach((day) => {
          if (day.scheduled_days && day.scheduled_days.includes(dayName)) {
            scheduledWorkout = { ...day, plan_name: plan.name };
          }
        });
      }
    });

    return {
      sleep,
      measurements,
      workout,
      hasPhotos,
      scheduledWorkout,
    };
  }, [allData, activeDateStr, plans]);

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  const handleSyncSleep = async () => {
    setSyncing(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await axios.post(
        `/api/fit/sync-sleep?days=7&tz=${encodeURIComponent(tz)}`
      );
      showSnackbar('Sleep synced successfully');
      fetchData();
    } catch (error) {
      showSnackbar('Failed to sync sleep', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleMeasurementSubmit = async () => {
    try {
      await axios.post('/api/measurements', {
        ...measurementForm,
        date: activeDateStr,
      });
      showSnackbar('Measurements saved');
      setOpenMeasurements(false);
      fetchData();
    } catch (error) {
      showSnackbar('Failed to save measurements', 'error');
    }
  };

  const handlePhotoUpload = async () => {
    setIsUploadingPhotos(true);
    const formData = new FormData();
    formData.append('date', activeDateStr);
    if (photoFiles.front) formData.append('front', photoFiles.front);
    if (photoFiles.side) formData.append('side', photoFiles.side);
    if (photoFiles.back) formData.append('back', photoFiles.back);

    try {
      await axios.post('/api/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showSnackbar('Photos uploaded successfully');
      setOpenPhotos(false);
      setPhotoFiles({ front: null, side: null, back: null });
      fetchData();
    } catch (error) {
      showSnackbar('Failed to upload photos', 'error');
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  // Calendar Helpers
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      days.push({
        day: i,
        dateStr,
        hasSleep: allData.sleep.some((s) => s.date === dateStr),
        hasMeasurements: allData.measurements.some((m) => m.date === dateStr),
        hasWorkout: allData.sessions.some((s) => s.date === dateStr),
        hasPhotos: allData.photoDates.includes(dateStr),
      });
    }
    return days;
  }, [currentMonth, allData]);

  const changeMonth = (offset) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Calendar Section */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                {currentMonth.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Typography>
              <Box>
                <IconButton onClick={() => changeMonth(-1)} size="small">
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton onClick={() => changeMonth(1)} size="small">
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 1,
                textAlign: 'center',
              }}
            >
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <Typography
                  key={d}
                  variant="caption"
                  fontWeight="bold"
                  color="text.secondary"
                >
                  {d[0]}
                </Typography>
              ))}
              {calendarDays.map((d, idx) => {
                if (!d) return <Box key={`empty-${idx}`} />;
                const isActive = d.dateStr === activeDateStr;
                const isToday =
                  d.dateStr === new Date().toLocaleDateString('en-CA');

                return (
                  <Paper
                    key={d.dateStr}
                    elevation={isActive ? 4 : 0}
                    onClick={() => setActiveDateStr(d.dateStr)}
                    sx={{
                      p: 0.5,
                      minHeight: 60,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: isActive ? 'primary.main' : 'divider',
                      bgcolor: isActive
                        ? 'action.selected'
                        : 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: isToday ? 'bold' : 'normal',
                        color: isToday ? 'primary.main' : 'text.primary',
                        fontSize: '0.75rem',
                      }}
                    >
                      {d.day}
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: 0.2,
                        mt: 0.5,
                      }}
                    >
                      {d.hasSleep && (
                        <BedtimeIcon
                          sx={{ fontSize: 12, color: 'info.main' }}
                        />
                      )}
                      {d.hasWorkout && (
                        <FitnessCenterIcon
                          sx={{ fontSize: 12, color: 'error.main' }}
                        />
                      )}
                      {d.hasMeasurements && (
                        <MonitorWeightIcon
                          sx={{ fontSize: 12, color: 'success.main' }}
                        />
                      )}
                      {d.hasPhotos && (
                        <PhotoCameraIcon
                          sx={{ fontSize: 12, color: 'warning.main' }}
                        />
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>

            <Box
              sx={{
                mt: 2,
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <BedtimeIcon sx={{ fontSize: 14, color: 'info.main' }} />
                <Typography variant="caption">Sleep</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FitnessCenterIcon sx={{ fontSize: 14, color: 'error.main' }} />
                <Typography variant="caption">Workout</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MonitorWeightIcon
                  sx={{ fontSize: 14, color: 'success.main' }}
                />
                <Typography variant="caption">Measures</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PhotoCameraIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                <Typography variant="caption">Photos</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Details Section */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Details for{' '}
              {new Date(activeDateStr + 'T00:00:00').toLocaleDateString(
                'en-US',
                {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }
              )}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {/* Sleep Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BedtimeIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Sleep</Typography>
                    {activeData.sleep && (
                      <CheckCircleIcon color="success" sx={{ ml: 'auto' }} />
                    )}
                  </Box>
                  {activeData.sleep ? (
                    <Box>
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid size={4}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Bedtime
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {activeData.sleep.bedtime || '-'}
                          </Typography>
                        </Grid>
                        <Grid size={4}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Wake Up
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {activeData.sleep.wake_time || '-'}
                          </Typography>
                        </Grid>
                        <Grid size={4}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Total
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {minutesToHm(
                              (activeData.sleep.deep_sleep_minutes || 0) +
                                (activeData.sleep.rem_sleep_minutes || 0) +
                                (activeData.sleep.light_minutes || 0)
                            )}
                          </Typography>
                        </Grid>
                      </Grid>
                      <Divider sx={{ mb: 1 }} />
                      <Grid container spacing={1}>
                        <Grid size={4}>
                          <Typography variant="caption" color="text.secondary">
                            Deep
                          </Typography>
                          <Typography variant="body2">
                            {minutesToHm(activeData.sleep.deep_sleep_minutes)}
                          </Typography>
                        </Grid>
                        <Grid size={4}>
                          <Typography variant="caption" color="text.secondary">
                            REM
                          </Typography>
                          <Typography variant="body2">
                            {minutesToHm(activeData.sleep.rem_sleep_minutes)}
                          </Typography>
                        </Grid>
                        <Grid size={4}>
                          <Typography variant="caption" color="text.secondary">
                            RHR
                          </Typography>
                          <Typography variant="body2">
                            {activeData.sleep.rhr || '-'} bpm
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No sleep data recorded.
                    </Typography>
                  )}
                </CardContent>
                <Box sx={{ flexGrow: 1 }} />
                <CardActions>
                  <Button
                    startIcon={
                      syncing ? <CircularProgress size={16} /> : <SyncIcon />
                    }
                    onClick={handleSyncSleep}
                    disabled={syncing}
                    fullWidth
                    size="small"
                    variant="outlined"
                  >
                    Sync Fit
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Workout Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FitnessCenterIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Workout</Typography>
                    {activeData.workout && (
                      <CheckCircleIcon color="success" sx={{ ml: 'auto' }} />
                    )}
                  </Box>
                  {activeData.workout ? (
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {activeData.workout.day_name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {activeData.workout.plan_name}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Grid container spacing={2}>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary">
                            Exercises
                          </Typography>
                          <Typography variant="body2">
                            {
                              new Set(
                                activeData.workout.logs.map(
                                  (l) => l.exercise_id
                                )
                              ).size
                            }
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary">
                            Sets
                          </Typography>
                          <Typography variant="body2">
                            {activeData.workout.logs.length}
                          </Typography>
                        </Grid>
                      </Grid>
                      <MuscleHighlight sessionLogs={activeData.workout.logs} />
                    </Box>
                  ) : activeData.scheduledWorkout ? (
                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {activeData.scheduledWorkout.name}
                          </Typography>
                          <Typography variant="body2" color="primary">
                            Scheduled for today
                          </Typography>
                        </Box>
                        <MuscleReadiness
                          day={activeData.scheduledWorkout}
                          lastTrainedMuscles={allData.lastTrainedMuscles}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {activeData.scheduledWorkout.plan_name}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {activeData.scheduledWorkout.exercises
                          .slice(0, 3)
                          .map((ex, i) => (
                            <Chip
                              key={i}
                              label={ex.name}
                              size="small"
                              sx={{ mr: 0.3, mb: 0.3, fontSize: '0.65rem' }}
                            />
                          ))}
                      </Box>
                      <MuscleHighlight
                        exercises={activeData.scheduledWorkout.exercises}
                      />
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No workout scheduled or recorded.
                    </Typography>
                  )}
                </CardContent>
                <Box sx={{ flexGrow: 1 }} />
                <CardActions>
                  {activeData.workout ? (
                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      onClick={() => onNavigate('Workouts')}
                    >
                      View Details
                    </Button>
                  ) : activeData.scheduledWorkout ? (
                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      color="secondary"
                      onClick={() =>
                        onStartWorkout(activeData.scheduledWorkout)
                      }
                    >
                      Start Scheduled Workout
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      onClick={() => setOpenStartWorkout(true)}
                    >
                      Start Workout
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>

            {/* Measurements Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MonitorWeightIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Measurements</Typography>
                    {activeData.measurements && (
                      <CheckCircleIcon color="success" sx={{ ml: 'auto' }} />
                    )}
                  </Box>
                  {activeData.measurements ? (
                    <Grid container spacing={1}>
                      {[
                        {
                          label: 'Weight',
                          value: activeData.measurements.bodyweight,
                          unit: 'kg',
                        },
                        {
                          label: 'Body Fat',
                          value: activeData.measurements.body_fat,
                          unit: '%',
                        },
                        {
                          label: 'Chest',
                          value: activeData.measurements.chest,
                          unit: 'cm',
                        },
                        {
                          label: 'Waist',
                          value: activeData.measurements.waist,
                          unit: 'cm',
                        },
                        {
                          label: 'Biceps',
                          value: activeData.measurements.biceps,
                          unit: 'cm',
                        },
                        {
                          label: 'Forearm',
                          value: activeData.measurements.forearm,
                          unit: 'cm',
                        },
                        {
                          label: 'Calf',
                          value: activeData.measurements.calf,
                          unit: 'cm',
                        },
                        {
                          label: 'Thigh',
                          value: activeData.measurements.thigh,
                          unit: 'cm',
                        },
                      ]
                        .filter(
                          (m) =>
                            m.value !== null &&
                            m.value !== '' &&
                            m.value !== undefined
                        )
                        .map((m, idx) => (
                          <Grid item key={idx} xs={4}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              {m.label}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {m.value}
                              {m.unit}
                            </Typography>
                          </Grid>
                        ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No measurements recorded.
                    </Typography>
                  )}
                </CardContent>
                <Box sx={{ flexGrow: 1 }} />
                <CardActions>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenMeasurements(true)}
                    aria-label={
                      activeData.measurements
                        ? 'Edit measurements'
                        : 'Add measurements'
                    }
                  >
                    {activeData.measurements ? 'Edit' : 'Add'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Photos Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PhotoCameraIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Photos</Typography>
                    {activeData.hasPhotos && (
                      <CheckCircleIcon color="success" sx={{ ml: 'auto' }} />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {activeData.hasPhotos
                      ? 'Progress photos uploaded for this day.'
                      : 'No photos for this day.'}
                  </Typography>
                </CardContent>
                <Box sx={{ flexGrow: 1 }} />
                <CardActions>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenPhotos(true)}
                    aria-label={
                      activeData.hasPhotos ? 'Edit photos' : 'Upload photos'
                    }
                  >
                    {activeData.hasPhotos ? 'Edit' : 'Upload'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* DIALOGS (Measurements, Photos, Start Workout) - Keep same as before but ensure date use activeDateStr */}
      <Dialog
        open={openMeasurements}
        onClose={() => setOpenMeasurements(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Measurements — {activeDateStr}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {[
              'bodyweight',
              'body_fat',
              'chest',
              'waist',
              'biceps',
              'forearm',
              'calf',
              'thigh',
            ].map((field) => (
              <Grid item xs={6} key={field}>
                <TextField
                  fullWidth
                  label={field
                    .replace('_', ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                  type="number"
                  value={measurementForm[field]}
                  onChange={(e) =>
                    setMeasurementForm({
                      ...measurementForm,
                      [field]: e.target.value,
                    })
                  }
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMeasurements(false)}>Cancel</Button>
          <Button onClick={handleMeasurementSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openPhotos}
        onClose={() => setOpenPhotos(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Upload Photos — {activeDateStr}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {['front', 'side', 'back'].map((side) => (
              <Box key={side} sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ textTransform: 'capitalize' }}
                >
                  {side} Photo
                </Typography>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setPhotoFiles({ ...photoFiles, [side]: e.target.files[0] })
                  }
                />
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPhotos(false)}>Cancel</Button>
          <Button
            onClick={handlePhotoUpload}
            variant="contained"
            disabled={
              isUploadingPhotos ||
              (!photoFiles.front && !photoFiles.side && !photoFiles.back)
            }
          >
            {isUploadingPhotos ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openStartWorkout}
        onClose={() => setOpenStartWorkout(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Select a Workout to Start</DialogTitle>
        <DialogContent>
          {plans.map((plan) => (
            <Box key={plan.id} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {plan.name}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {plan.days.map((day) => (
                  <Chip
                    key={day.id}
                    label={day.name}
                    clickable
                    color="primary"
                    variant="outlined"
                    onClick={() => {
                      onStartWorkout({ ...day, plan_name: plan.name });
                      setOpenStartWorkout(false);
                    }}
                  />
                ))}
              </Box>
              <Divider sx={{ mt: 2 }} />
            </Box>
          ))}
          {plans.length === 0 && (
            <Typography color="text.secondary">
              No workout plans found.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStartWorkout(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
