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
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Body from '../vendor/body-highlighter';
import axios from '../api';
import { BODY_MAP_MAPPING } from '../constants/muscles';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

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
    <Box
      sx={{
        mt: 2,
        textAlign: 'center',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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
      <Box
        sx={{
          width: '100%',
          flex: 1,
          minHeight: 200,
          mx: 'auto',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Body
          side={view}
          data={data}
          colors={
            theme.palette.mode === 'dark'
              ? ['#1a237e', '#0d47a1', '#1565c0', '#1e88e5', '#42a5f5']
              : ['#e3f2fd', '#90caf9', '#42a5f5', '#1e88e5', '#1565c0']
          }
          scale={0.9}
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

const toDateString = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Dashboard({
  onNavigate,
  onStartWorkout,
  today = new Date(),
}) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeDateStr, setActiveDateStr] = useState(toDateString(today));
  const [currentMonth, setCurrentMonth] = useState(new Date(today));

  const [allData, setAllData] = useState({
    sleep: [],
    activity: [],
    measurements: [],
    sessions: [],
    photoDates: [],
    lastTrainedMuscles: {},
  });
  const [plans, setPlans] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncingUh, setSyncingUh] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Dialog states
  const [openMeasurements, setOpenMeasurements] = useState(false);
  const [openPhotos, setOpenPhotos] = useState(false);
  const [openStartWorkout, setOpenStartWorkout] = useState(false);
  const [scheduledIndex, setScheduledIndex] = useState(0);

  useEffect(() => {
    setScheduledIndex(0);
  }, [activeDateStr]);

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
        activityRes,
        measureRes,
        sessionRes,
        planRes,
        photoRes,
        lastTrainedRes,
      ] = await Promise.all([
        axios.get('/api/sleep'),
        axios.get('/api/activity'),
        axios.get('/api/measurements'),
        axios.get('/api/workouts/sessions?limit=100'),
        axios.get('/api/workouts/plans'),
        axios.get('/api/photos/dates'),
        axios.get('/api/workouts/last-trained-muscles'),
      ]);

      setAllData({
        sleep: sleepRes.data,
        activity: activityRes.data,
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
    const autoSync = async () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        await Promise.allSettled([
          axios.post(`/api/fit/sync-sleep?days=2&tz=${encodeURIComponent(tz)}`),
          axios.get(`/api/ultrahuman/sync?days=2`),
        ]);
        fetchData();
      } catch (e) {
        console.warn('Dashboard auto-sync failed:', e);
      }
    };
    autoSync();
  }, [fetchData]);

  const activeData = useMemo(() => {
    const sleep = allData.sleep.find((s) => s.date === activeDateStr);
    const activity = allData.activity.find((a) => a.date === activeDateStr);
    const measurements = allData.measurements.find(
      (m) => m.date === activeDateStr
    );
    const workout = allData.sessions.find((s) => s.date === activeDateStr);
    const hasPhotos = allData.photoDates.includes(activeDateStr);

    const dateObj = new Date(activeDateStr + 'T00:00:00');
    const dayName = DAYS_OF_WEEK[dateObj.getDay()];
    const scheduledWorkouts = [];

    plans.forEach((plan) => {
      if (plan.days) {
        plan.days.forEach((day) => {
          if (day.scheduled_days && day.scheduled_days.includes(dayName)) {
            scheduledWorkouts.push({ ...day, plan_name: plan.name });
          }
        });
      }
    });

    return {
      sleep,
      activity,
      measurements,
      workout,
      hasPhotos,
      scheduledWorkouts,
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

  const handleSyncUltrahuman = async () => {
    setSyncingUh(true);
    try {
      await axios.get(`/api/ultrahuman/sync?days=7`);
      showSnackbar('Ultrahuman synced successfully');
      fetchData();
    } catch (error) {
      showSnackbar('Failed to sync Ultrahuman', 'error');
    } finally {
      setSyncingUh(false);
    }
  };

  const handleOpenMeasurements = () => {
    if (activeData.measurements) {
      setMeasurementForm({
        bodyweight: activeData.measurements.bodyweight || '',
        body_fat: activeData.measurements.body_fat || '',
        chest: activeData.measurements.chest || '',
        waist: activeData.measurements.waist || '',
        biceps: activeData.measurements.biceps || '',
        forearm: activeData.measurements.forearm || '',
        calf: activeData.measurements.calf || '',
        thigh: activeData.measurements.thigh || '',
      });
    } else {
      setMeasurementForm({
        bodyweight: '',
        body_fat: '',
        chest: '',
        waist: '',
        biceps: '',
        forearm: '',
        calf: '',
        thigh: '',
      });
    }
    setOpenMeasurements(true);
  };

  const isMeasurementDirty = () => {
    const initial = activeData.measurements
      ? {
          bodyweight: activeData.measurements.bodyweight || '',
          body_fat: activeData.measurements.body_fat || '',
          chest: activeData.measurements.chest || '',
          waist: activeData.measurements.waist || '',
          biceps: activeData.measurements.biceps || '',
          forearm: activeData.measurements.forearm || '',
          calf: activeData.measurements.calf || '',
          thigh: activeData.measurements.thigh || '',
        }
      : {
          bodyweight: '',
          body_fat: '',
          chest: '',
          waist: '',
          biceps: '',
          forearm: '',
          calf: '',
          thigh: '',
        };
    return Object.keys(measurementForm).some(
      (key) => String(measurementForm[key]) !== String(initial[key])
    );
  };

  const handleCloseMeasurements = (event, reason) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      if (isMeasurementDirty()) {
        if (!window.confirm('Discard unsaved changes?')) return;
      }
    }
    setOpenMeasurements(false);
  };

  const handleCancelMeasurements = () => {
    if (isMeasurementDirty()) {
      if (!window.confirm('Discard unsaved changes?')) return;
    }
    setOpenMeasurements(false);
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

  const isPhotosDirty = () => {
    return photoFiles.front || photoFiles.side || photoFiles.back;
  };

  const handleClosePhotos = (event, reason) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      if (isPhotosDirty()) {
        if (!window.confirm('Discard un-uploaded photos?')) return;
      }
    }
    setOpenPhotos(false);
  };

  const handleCancelPhotos = () => {
    if (isPhotosDirty()) {
      if (!window.confirm('Discard un-uploaded photos?')) return;
    }
    setOpenPhotos(false);
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
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      days.push({
        day: i,
        dateStr,
        hasSleep: allData.sleep.some((s) => s.date === dateStr),
        hasMeasurements: allData.measurements.some((m) => m.date === dateStr),
        hasWorkout: allData.sessions.some((s) => s.date === dateStr),
        hasPhotos: allData.photoDates.includes(dateStr),
        activity: allData.activity.find((a) => a.date === dateStr),
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

  const cardStyle = {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
    },
    borderRadius: 2,
    bgcolor:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.paper, 0.8)
        : 'background.paper',
    boxSizing: 'border-box',
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
        {/* Calendar Section - 1/2 Width */}
        <Grid size={{ xs: 12, lg: 6 }} sx={{ display: 'flex' }}>
          <Paper
            sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              flex: 1,
            }}
          >
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
                gridAutoRows: '1fr',
                gap: 1,
                textAlign: 'center',
                flex: 1,
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
                if (!d)
                  return <Box key={`empty-${idx}`} sx={{ height: '100%' }} />;
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
                      height: '100%',
                      minHeight: 85,
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: isActive ? 'primary.main' : 'transparent',
                      bgcolor: isActive
                        ? alpha(theme.palette.primary.main, 0.1)
                        : theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.paper, 0.4)
                          : 'background.paper',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: isToday ? 'bold' : 'normal',
                        color: isToday ? 'primary.main' : 'text.primary',
                        fontSize: '0.9rem',
                        mb: 0.5,
                      }}
                    >
                      {d.day}
                    </Typography>

                    {d.activity?.steps > 0 && (
                      <Box sx={{ lineClamp: 1, overflow: 'hidden', mb: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.65rem',
                            color: 'text.secondary',
                            display: 'block',
                            lineHeight: 1,
                          }}
                        >
                          {d.activity.steps.toLocaleString()}
                        </Typography>
                      </Box>
                    )}

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 0.5,
                        mt: 'auto',
                        mb: 0.5,
                      }}
                    >
                      {d.hasSleep ? (
                        <BedtimeIcon
                          sx={{ fontSize: 18, color: 'info.main' }}
                        />
                      ) : (
                        <Box sx={{ width: 18, height: 18 }} />
                      )}
                      {d.hasWorkout ? (
                        <FitnessCenterIcon
                          sx={{ fontSize: 18, color: 'error.main' }}
                        />
                      ) : (
                        <Box sx={{ width: 18, height: 18 }} />
                      )}
                      {d.hasMeasurements ? (
                        <MonitorWeightIcon
                          sx={{ fontSize: 18, color: 'success.main' }}
                        />
                      ) : (
                        <Box sx={{ width: 18, height: 18 }} />
                      )}
                      {d.hasPhotos ? (
                        <PhotoCameraIcon
                          sx={{ fontSize: 18, color: 'warning.main' }}
                        />
                      ) : (
                        <Box sx={{ width: 18, height: 18 }} />
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>

            <Box
              sx={{
                mt: 3,
                display: 'flex',
                gap: 3,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BedtimeIcon sx={{ fontSize: 16, color: 'info.main' }} />
                <Typography variant="caption">Sleep</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FitnessCenterIcon sx={{ fontSize: 16, color: 'error.main' }} />
                <Typography variant="caption">Workout</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MonitorWeightIcon
                  sx={{ fontSize: 16, color: 'success.main' }}
                />
                <Typography variant="caption">Measures</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhotoCameraIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                <Typography variant="caption">Photos</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Details Section - 1/2 Width */}
        <Grid
          size={{ xs: 12, lg: 6 }}
          sx={{ display: 'flex', flexDirection: 'column' }}
        >
          <Box
            sx={{
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Typography variant="h5" fontWeight="bold">
              {new Date(activeDateStr + 'T00:00:00').toLocaleDateString(
                'en-US',
                { weekday: 'long', month: 'short', day: 'numeric' }
              )}
            </Typography>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              {activeData.activity?.movement_index != null && (
                <Chip
                  label={`Movement: ${activeData.activity.movement_index}`}
                  size="small"
                  color={
                    activeData.activity.movement_index > 80
                      ? 'success'
                      : activeData.activity.movement_index > 50
                        ? 'warning'
                        : 'error'
                  }
                  sx={{ fontWeight: 'bold' }}
                />
              )}
              {activeData.sleep?.recovery_index && (
                <Chip
                  label={`Recovery: ${activeData.sleep.recovery_index}`}
                  size="small"
                  color={
                    activeData.sleep.recovery_index > 80
                      ? 'success'
                      : activeData.sleep.recovery_index > 50
                        ? 'warning'
                        : 'error'
                  }
                  sx={{ fontWeight: 'bold' }}
                />
              )}
              {activeData.sleep?.sleep_score && (
                <Chip
                  label={`Sleep: ${activeData.sleep.sleep_score}`}
                  size="small"
                  color={
                    activeData.sleep.sleep_score > 80
                      ? 'success'
                      : activeData.sleep.sleep_score > 60
                        ? 'warning'
                        : 'error'
                  }
                  sx={{ fontWeight: 'bold' }}
                />
              )}
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ flex: 1, alignItems: 'stretch' }}>
            {/* COLUMN 1: WORKOUT & PHOTOS (4:1 split) */}
            <Grid
              size={{ xs: 12, md: 6 }}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              {/* WORKOUT - 4/5 height */}
              <Card sx={{ ...cardStyle, flex: 4 }}>
                <CardContent
                  sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FitnessCenterIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        Workout
                      </Typography>
                      {activeData.workout && (
                        <CheckCircleIcon
                          color="success"
                          sx={{ ml: 1, fontSize: 20 }}
                        />
                      )}
                    </Box>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() =>
                        activeData.workout
                          ? onNavigate('Workouts')
                          : activeData.scheduledWorkouts?.length > 0
                            ? onStartWorkout(
                                activeData.scheduledWorkouts[scheduledIndex] ||
                                  activeData.scheduledWorkouts[0],
                                activeDateStr
                              )
                            : setOpenStartWorkout(true)
                      }
                      startIcon={
                        activeData.workout ? <VisibilityIcon /> : <AddIcon />
                      }
                    >
                      {activeData.workout
                        ? 'View'
                        : activeData.scheduledWorkouts?.length > 0
                          ? 'Start'
                          : 'Log'}
                    </Button>
                  </Box>
                  {activeData.workout ? (
                    <Box
                      sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">
                        {activeData.workout.session_custom_name ||
                          activeData.workout.day_name}
                      </Typography>
                      {activeData.workout.plan_name && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          gutterBottom
                          display="block"
                        >
                          {activeData.workout.plan_name}
                        </Typography>
                      )}
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 0.5,
                          mt: 1,
                        }}
                      >
                        {[
                          ...new Set(
                            activeData.workout.logs.map((l) => l.exercise_name)
                          ),
                        ]
                          .slice(0, 6)
                          .map((name, i) => (
                            <Chip
                              key={i}
                              label={name}
                              size="small"
                              sx={{ fontSize: '0.6rem', height: 20 }}
                            />
                          ))}
                      </Box>
                      <MuscleHighlight sessionLogs={activeData.workout.logs} />
                    </Box>
                  ) : activeData.scheduledWorkouts?.length > 0 ? (
                    <Box
                      sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                    >
                      {activeData.scheduledWorkouts.length > 1 && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 1,
                            gap: 1,
                            justifyContent: 'center',
                          }}
                        >
                          <IconButton
                            size="small"
                            disabled={scheduledIndex === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setScheduledIndex((prev) => prev - 1);
                            }}
                          >
                            <ChevronLeftIcon fontSize="small" />
                          </IconButton>
                          <Typography variant="caption" fontWeight="bold">
                            {scheduledIndex + 1} /{' '}
                            {activeData.scheduledWorkouts.length}
                          </Typography>
                          <IconButton
                            size="small"
                            disabled={
                              scheduledIndex ===
                              activeData.scheduledWorkouts.length - 1
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              setScheduledIndex((prev) => prev + 1);
                            }}
                          >
                            <ChevronRightIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                      {(() => {
                        const current =
                          activeData.scheduledWorkouts[scheduledIndex] ||
                          activeData.scheduledWorkouts[0];
                        return (
                          <>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="bold"
                                >
                                  {current.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {current.plan_name}
                                </Typography>
                              </Box>
                              <MuscleReadiness
                                day={current}
                                lastTrainedMuscles={allData.lastTrainedMuscles}
                              />
                            </Box>
                            <Typography
                              variant="caption"
                              color="primary"
                              display="block"
                              sx={{ mt: 1, fontWeight: 'bold' }}
                            >
                              Scheduled
                            </Typography>
                            <MuscleHighlight exercises={current.exercises} />
                          </>
                        );
                      })()}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        textAlign: 'center',
                        py: 8,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <FitnessCenterIcon
                        sx={{
                          fontSize: 64,
                          color: 'action.disabled',
                          mb: 2,
                          mx: 'auto',
                        }}
                      />
                      <Typography variant="h6" color="text.secondary">
                        Rest Day
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* PHOTOS - 1/5 height */}
              <Card sx={{ ...cardStyle, flex: 1, minHeight: 'auto' }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhotoCameraIcon
                        color="warning"
                        sx={{ mr: 1, fontSize: 20 }}
                      />
                      <Typography variant="subtitle2" fontWeight="bold">
                        Photos
                      </Typography>
                      {activeData.hasPhotos && (
                        <CheckCircleIcon
                          color="success"
                          sx={{ ml: 1, fontSize: 16 }}
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenPhotos(true)}
                        aria-label="Edit photos"
                        sx={{ py: 0.5 }}
                      >
                        {activeData.hasPhotos ? 'Edit' : 'Upload'}
                      </Button>
                      {activeData.hasPhotos && (
                        <Button
                          size="small"
                          variant="contained"
                          color="secondary"
                          startIcon={<VisibilityIcon />}
                          onClick={() =>
                            onNavigate('Photos', { date: activeDateStr })
                          }
                          sx={{ py: 0.5 }}
                        >
                          View
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* COLUMN 2: SLEEP & MEASUREMENTS (1:1 split) */}
            <Grid
              size={{ xs: 12, md: 6 }}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              {/* SLEEP - 1/2 height */}
              <Card sx={{ ...cardStyle, flex: 1 }}>
                <CardContent sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BedtimeIcon color="info" sx={{ mr: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        Sleep
                      </Typography>
                      {activeData.sleep && (
                        <CheckCircleIcon
                          color="success"
                          sx={{ ml: 1, fontSize: 20 }}
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleSyncSleep}
                        disabled={syncing}
                      >
                        Fit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={handleSyncUltrahuman}
                        disabled={syncingUh}
                      >
                        UH
                      </Button>
                    </Box>
                  </Box>
                  {activeData.sleep ? (
                    <Grid container spacing={1}>
                      {[
                        {
                          label: 'Total',
                          value: minutesToHm(
                            (activeData.sleep.deep_sleep_minutes || 0) +
                              (activeData.sleep.rem_sleep_minutes || 0) +
                              (activeData.sleep.light_minutes || 0)
                          ),
                        },
                        {
                          label: 'Score',
                          value: activeData.sleep.sleep_score || '-',
                        },
                        {
                          label: 'Recovery',
                          value: activeData.sleep.recovery_index || '-',
                        },
                        {
                          label: 'RHR',
                          value: activeData.sleep.rhr
                            ? `${activeData.sleep.rhr} bpm`
                            : '-',
                        },
                        {
                          label: 'HRV',
                          value: activeData.sleep.hrv
                            ? `${activeData.sleep.hrv} ms`
                            : '-',
                        },
                        {
                          label: 'Rest. %',
                          value:
                            activeData.sleep.restorative_sleep_percentage !=
                            null
                              ? `${activeData.sleep.restorative_sleep_percentage}%`
                              : '-',
                        },
                        {
                          label: 'Deep',
                          value: minutesToHm(
                            activeData.sleep.deep_sleep_minutes
                          ),
                        },
                        {
                          label: 'REM',
                          value: minutesToHm(
                            activeData.sleep.rem_sleep_minutes
                          ),
                        },
                        {
                          label: 'Light',
                          value: minutesToHm(activeData.sleep.light_minutes),
                        },
                        {
                          label: 'Awake',
                          value: minutesToHm(activeData.sleep.awake_minutes),
                        },
                        {
                          label: 'Mvmnts',
                          value: activeData.sleep.movements ?? '-',
                        },
                        {
                          label: 'T&T',
                          value: activeData.sleep.tosses_and_turns ?? '-',
                        },
                        {
                          label: 'Bed',
                          value: activeData.sleep.bedtime || '-',
                        },
                        {
                          label: 'Wake',
                          value: activeData.sleep.wake_time || '-',
                        },
                      ].map((item, idx) => (
                        <Grid key={idx} size={4}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            noWrap
                            sx={{ fontSize: '0.65rem' }}
                          >
                            {item.label}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            sx={{ fontSize: '0.8rem' }}
                          >
                            {item.value}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No data.
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* MEASUREMENTS - 1/2 height */}
              <Card sx={{ ...cardStyle, flex: 1 }}>
                <CardContent sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MonitorWeightIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        Measurements
                      </Typography>
                      {activeData.measurements && (
                        <CheckCircleIcon
                          color="success"
                          sx={{ ml: 1, fontSize: 20 }}
                        />
                      )}
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleOpenMeasurements}
                      aria-label="Edit measurements"
                    >
                      {activeData.measurements ? 'Edit' : 'Add'}
                    </Button>
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
                          label: 'VO2 Max',
                          value: activeData.measurements.vo2_max,
                          unit: '',
                        },
                        {
                          label: 'Waist',
                          value: activeData.measurements.waist,
                          unit: 'cm',
                        },
                        {
                          label: 'Chest',
                          value: activeData.measurements.chest,
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
                          label: 'Thigh',
                          value: activeData.measurements.thigh,
                          unit: 'cm',
                        },
                        {
                          label: 'Calf',
                          value: activeData.measurements.calf,
                          unit: 'cm',
                        },
                      ]
                        .filter((m) => m.value)
                        .map((m, idx) => (
                          <Grid key={idx} size={4}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              noWrap
                              sx={{ fontSize: '0.65rem' }}
                            >
                              {m.label}
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              sx={{ fontSize: '0.8rem' }}
                            >
                              {m.value}
                              {m.unit}
                            </Typography>
                          </Grid>
                        ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No data.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* DIALOGS */}
      <Dialog
        open={openMeasurements}
        onClose={handleCloseMeasurements}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Update Measurements</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {[
              { id: 'bodyweight', label: 'Weight (kg)' },
              { id: 'body_fat', label: 'Body Fat (%)' },
              { id: 'chest', label: 'Chest (cm)' },
              { id: 'waist', label: 'Waist (cm)' },
              { id: 'biceps', label: 'Biceps (cm)' },
              { id: 'forearm', label: 'Forearm (cm)' },
              { id: 'calf', label: 'Calf (cm)' },
              { id: 'thigh', label: 'Thigh (cm)' },
            ].map((field) => (
              <Grid size={6} key={field.id}>
                <TextField
                  fullWidth
                  label={field.label}
                  type="number"
                  value={measurementForm[field.id]}
                  onChange={(e) =>
                    setMeasurementForm({
                      ...measurementForm,
                      [field.id]: e.target.value,
                    })
                  }
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelMeasurements}>Cancel</Button>
          <Button onClick={handleMeasurementSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openPhotos}
        onClose={handleClosePhotos}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Progress Photos</DialogTitle>
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
          <Button onClick={handleCancelPhotos}>Cancel</Button>
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
        <DialogTitle>Select Workout</DialogTitle>
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
                      onStartWorkout(
                        { ...day, plan_name: plan.name },
                        activeDateStr
                      );
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
