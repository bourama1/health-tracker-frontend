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
import PsychologyIcon from '@mui/icons-material/Psychology';
import RestaurantIcon from '@mui/icons-material/Restaurant';
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
        mt: 1,
        textAlign: 'center',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          mb: 0.5,
          flexShrink: 0,
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: '0.65rem' }}
        >
          Muscles
        </Typography>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              borderColor: 'divider',
              py: 0,
              px: 0.8,
              fontSize: '0.6rem',
              lineHeight: 1.2,
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
          <ToggleButton value="front">Front</ToggleButton>
          <ToggleButton value="back">Back</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          mx: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
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
          scale={1}
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
    mentalHealth: [],
    nutrition: [],
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
  const [openMentalHealth, setOpenMentalHealth] = useState(false);
  const [scheduledIndex, setScheduledIndex] = useState(0);

  const [mentalHealthForm, setMentalHealthForm] = useState({
    energy: '',
    mood: '',
    composure: '',
    physicality: '',
    connectivity: '',
    notes: '',
  });

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
        mentalHealthRes,
        nutritionRes,
      ] = await Promise.all([
        axios.get('/api/sleep'),
        axios.get('/api/activity'),
        axios.get('/api/measurements'),
        axios.get('/api/workouts/sessions?limit=100'),
        axios.get('/api/workouts/plans'),
        axios.get('/api/photos/dates'),
        axios.get('/api/workouts/last-trained-muscles'),
        axios.get('/api/mental-health'),
        axios.get('/api/nutrition/summary'),
      ]);

      setAllData({
        sleep: sleepRes.data,
        activity: activityRes.data,
        measurements: measureRes.data,
        sessions: sessionRes.data,
        photoDates: photoRes.data.map((d) => d.date),
        lastTrainedMuscles: lastTrainedRes.data,
        mentalHealth: mentalHealthRes.data,
        nutrition: nutritionRes.data,
      });
      setPlans(planRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showSnackbar('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load saved MFP username
  const [mfpUsername, setMfpUsername] = useState('');
  useEffect(() => {
    axios
      .get('/api/user/settings')
      .then((res) => {
        if (res.data.mfp_username) setMfpUsername(res.data.mfp_username);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
    const autoSync = async () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const tasks = [
          axios.post(`/api/fit/sync-sleep?days=2&tz=${encodeURIComponent(tz)}`),
          axios.get(`/api/ultrahuman/sync?days=2`),
        ];
        // Auto-import MFP for selected date if username saved
        if (mfpUsername) {
          tasks.push(
            axios.post('/api/nutrition/mfp/import', {
              username: mfpUsername,
              from: activeDateStr,
              to: activeDateStr,
            })
          );
        }
        await Promise.allSettled(tasks);
        fetchData();
      } catch (e) {
        console.warn('Dashboard auto-sync failed:', e);
      }
    };
    autoSync();
  }, [fetchData, mfpUsername, activeDateStr]);

  const activeData = useMemo(() => {
    const sleep = allData.sleep.find((s) => s.date === activeDateStr);
    const activity = allData.activity.find((a) => a.date === activeDateStr);
    const measurements = allData.measurements.find(
      (m) => m.date === activeDateStr
    );
    const workout = allData.sessions.find((s) => s.date === activeDateStr);
    const hasPhotos = allData.photoDates.includes(activeDateStr);
    const mentalHealth = allData.mentalHealth.find(
      (m) => m.date === activeDateStr
    );
    const nutrition = allData.nutrition.find((n) => n.date === activeDateStr);

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
      mentalHealth,
      nutrition,
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

  const handleOpenMentalHealth = () => {
    if (activeData.mentalHealth) {
      setMentalHealthForm({
        energy: activeData.mentalHealth.energy ?? '',
        mood: activeData.mentalHealth.mood ?? '',
        composure: activeData.mentalHealth.composure ?? '',
        physicality: activeData.mentalHealth.physicality ?? '',
        connectivity: activeData.mentalHealth.connectivity ?? '',
        notes: activeData.mentalHealth.notes ?? '',
      });
    } else {
      setMentalHealthForm({
        energy: '',
        mood: '',
        composure: '',
        physicality: '',
        connectivity: '',
        notes: '',
      });
    }
    setOpenMentalHealth(true);
  };

  const handleMentalHealthToggle = (metric) => (_, newValue) => {
    if (newValue !== null) {
      setMentalHealthForm((prev) => ({ ...prev, [metric]: newValue }));
    }
  };

  const handleMentalHealthSave = async () => {
    try {
      await axios.post('/api/mental-health', {
        ...mentalHealthForm,
        date: activeDateStr,
      });
      showSnackbar('Mental health entry saved');
      setOpenMentalHealth(false);
      fetchData();
    } catch (error) {
      showSnackbar('Failed to save', 'error');
    }
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
      const sleepRec = allData.sleep.find((s) => s.date === dateStr);
      const actRec = allData.activity.find((a) => a.date === dateStr);
      days.push({
        day: i,
        dateStr,
        hasSleep: !!sleepRec,
        hasMeasurements: allData.measurements.some((m) => m.date === dateStr),
        hasWorkout: allData.sessions.some((s) => s.date === dateStr),
        hasPhotos: allData.photoDates.includes(dateStr),
        hasMentalHealth: allData.mentalHealth.some((m) => m.date === dateStr),
        hasNutrition: allData.nutrition.some((n) => n.date === dateStr),
        activity: actRec,
        movementIndex: actRec?.movement_index ?? null,
        sleepScore: sleepRec?.sleep_score ?? null,
        recoveryIndex: sleepRec?.recovery_index ?? null,
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
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      <Grid
        container
        spacing={3}
        sx={{
          flex: 1,
          overflow: 'hidden',
          alignItems: 'stretch',
          minHeight: 0,
        }}
      >
        {/* Calendar Section - 1/2 Width */}
        <Grid
          size={{ xs: 12, lg: 6 }}
          sx={{ display: 'flex', overflow: 'hidden' }}
        >
          <Paper
            sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              flex: 1,
              overflow: 'auto',
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
                      <Box sx={{ lineClamp: 1, overflow: 'hidden', mb: 0.5 }}>
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

                    {(d.movementIndex != null ||
                      d.sleepScore != null ||
                      d.recoveryIndex != null) && (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                          alignItems: 'stretch',
                          flex: 1,
                          width: '100%',
                          px: 0.3,
                          py: 0.3,
                        }}
                      >
                        {d.movementIndex != null && (
                          <Box
                            sx={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 3,
                              bgcolor:
                                d.movementIndex > 80
                                  ? 'success.main'
                                  : d.movementIndex > 50
                                    ? 'warning.main'
                                    : 'error.main',
                              color: '#fff',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              lineHeight: 1,
                              letterSpacing: '0.02em',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                            }}
                          >
                            M {d.movementIndex}
                          </Box>
                        )}
                        {d.sleepScore != null && (
                          <Box
                            sx={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 3,
                              bgcolor:
                                d.sleepScore > 80
                                  ? 'success.main'
                                  : d.sleepScore > 50
                                    ? 'warning.main'
                                    : 'error.main',
                              color: '#fff',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              lineHeight: 1,
                              letterSpacing: '0.02em',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                            }}
                          >
                            S {Math.round(d.sleepScore)}
                          </Box>
                        )}
                        {d.recoveryIndex != null && (
                          <Box
                            sx={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 3,
                              bgcolor:
                                d.recoveryIndex > 80
                                  ? 'success.main'
                                  : d.recoveryIndex > 50
                                    ? 'warning.main'
                                    : 'error.main',
                              color: '#fff',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              lineHeight: 1,
                              letterSpacing: '0.02em',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                            }}
                          >
                            R {d.recoveryIndex}
                          </Box>
                        )}
                      </Box>
                    )}

                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: 0.3,
                        mt: 'auto',
                        mb: 0.5,
                      }}
                    >
                      {d.hasSleep && (
                        <BedtimeIcon
                          sx={{ fontSize: 16, color: 'info.main' }}
                        />
                      )}
                      {d.hasWorkout && (
                        <FitnessCenterIcon
                          sx={{ fontSize: 16, color: 'error.main' }}
                        />
                      )}
                      {d.hasMeasurements && (
                        <MonitorWeightIcon
                          sx={{ fontSize: 16, color: 'success.main' }}
                        />
                      )}
                      {d.hasPhotos && (
                        <PhotoCameraIcon
                          sx={{ fontSize: 16, color: 'warning.main' }}
                        />
                      )}
                      {d.hasMentalHealth && (
                        <PsychologyIcon
                          sx={{ fontSize: 16, color: 'secondary.main' }}
                        />
                      )}
                      {d.hasNutrition && (
                        <RestaurantIcon
                          sx={{ fontSize: 16, color: '#ff9800' }}
                        />
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PsychologyIcon
                  sx={{ fontSize: 16, color: 'secondary.main' }}
                />
                <Typography variant="caption">Mental</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RestaurantIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                <Typography variant="caption">Food</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Details Section - 1/2 Width */}
        <Grid
          size={{ xs: 12, lg: 6 }}
          sx={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}
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
                        aria-label="Sync Fit"
                      >
                        Sync Fit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={handleSyncUltrahuman}
                        disabled={syncingUh}
                        aria-label="Sync UH"
                      >
                        Sync UH
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

          {/* Mental Health Card - Full Width */}
          <Box sx={{ mt: 2 }}>
            <Card sx={{ ...cardStyle }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PsychologyIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Mental Health
                    </Typography>
                    {activeData.mentalHealth && (
                      <CheckCircleIcon
                        color="success"
                        sx={{ ml: 1, fontSize: 20 }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleOpenMentalHealth}
                      startIcon={
                        activeData.mentalHealth ? undefined : <AddIcon />
                      }
                    >
                      {activeData.mentalHealth ? 'Edit' : 'Check In'}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onNavigate('Mental Health')}
                    >
                      View All
                    </Button>
                  </Box>
                </Box>
                {activeData.mentalHealth ? (
                  <Grid container spacing={1}>
                    {[
                      {
                        key: 'energy',
                        label: 'Energy',
                        value: activeData.mentalHealth.energy,
                      },
                      {
                        key: 'mood',
                        label: 'Mood',
                        value: activeData.mentalHealth.mood,
                      },
                      {
                        key: 'composure',
                        label: 'Composure',
                        value: activeData.mentalHealth.composure,
                      },
                      {
                        key: 'physicality',
                        label: 'Physicality',
                        value: activeData.mentalHealth.physicality,
                      },
                      {
                        key: 'connectivity',
                        label: 'Connectivity',
                        value: activeData.mentalHealth.connectivity,
                      },
                    ].map((m) => {
                      const val = m.value;
                      const label =
                        val === -1 ? 'Low' : val === 1 ? 'High' : 'Balanced';
                      const color =
                        val === -1
                          ? 'error.main'
                          : val === 1
                            ? 'warning.main'
                            : 'success.main';
                      return (
                        <Grid key={m.key} size={12 / 5}>
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
                            color={color}
                            sx={{ fontSize: '0.8rem' }}
                          >
                            {label}
                          </Typography>
                        </Grid>
                      );
                    })}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No data. Check in daily to track your mental health.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Nutrition Card - Full Width */}
          <Box sx={{ mt: 2 }}>
            <Card sx={{ ...cardStyle }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <RestaurantIcon sx={{ mr: 1, color: '#ff9800' }} />
                    <Typography variant="h6" fontWeight="bold">
                      Nutrition
                    </Typography>
                    {activeData.nutrition && (
                      <CheckCircleIcon
                        color="success"
                        sx={{ ml: 1, fontSize: 20 }}
                      />
                    )}
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onNavigate('Nutrition')}
                  >
                    Log Meals
                  </Button>
                </Box>
                {activeData.nutrition ? (
                  <Grid container spacing={1}>
                    {[
                      {
                        label: 'Calories',
                        value: Math.round(activeData.nutrition.calories || 0),
                        unit: 'kcal',
                        color: '#ff9800',
                      },
                      {
                        label: 'Protein',
                        value: Math.round(activeData.nutrition.protein || 0),
                        unit: 'g',
                        color: '#8884d8',
                      },
                      {
                        label: 'Carbs',
                        value: Math.round(
                          activeData.nutrition.carbohydrates || 0
                        ),
                        unit: 'g',
                        color: '#82ca9d',
                      },
                      {
                        label: 'Fat',
                        value: Math.round(activeData.nutrition.fat || 0),
                        unit: 'g',
                        color: '#ff7300',
                      },
                      {
                        label: 'Fiber',
                        value: Math.round(activeData.nutrition.fiber || 0),
                        unit: 'g',
                        color: '#ffc658',
                      },
                      {
                        label: 'Sugar',
                        value: Math.round(activeData.nutrition.sugar || 0),
                        unit: 'g',
                        color: '#e91e63',
                      },
                    ].map((m) => (
                      <Grid key={m.label} size={4}>
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
                          sx={{ fontSize: '0.8rem', color: m.color }}
                        >
                          {m.value} {m.unit}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No meals logged for this date.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
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

      {/* Mental Health Check-In Dialog */}
      <Dialog
        open={openMentalHealth}
        onClose={() => setOpenMentalHealth(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ pb: 1 }}>
          Mental Health Check-In
          <Typography variant="caption" display="block" color="text.secondary">
            {new Date(activeDateStr + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {[
            { key: 'energy', label: 'Energy' },
            { key: 'mood', label: 'Mood' },
            { key: 'composure', label: 'Composure' },
            { key: 'physicality', label: 'Physicality' },
            { key: 'connectivity', label: 'Connectivity' },
          ].map((m) => (
            <Box key={m.key} sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                fontWeight="bold"
                sx={{ mb: 0.5, display: 'block' }}
              >
                {m.label}
              </Typography>
              <ToggleButtonGroup
                value={mentalHealthForm[m.key]}
                exclusive
                onChange={handleMentalHealthToggle(m.key)}
                size="small"
                fullWidth
              >
                <ToggleButton
                  value={-1}
                  sx={{
                    flex: 1,
                    py: 0.5,
                    fontSize: '0.75rem',
                    '&.Mui-selected': {
                      bgcolor: 'error.main',
                      color: '#fff',
                      '&:hover': { bgcolor: 'error.dark' },
                    },
                  }}
                >
                  Low
                </ToggleButton>
                <ToggleButton
                  value={0}
                  sx={{
                    flex: 1,
                    py: 0.5,
                    fontSize: '0.75rem',
                    '&.Mui-selected': {
                      bgcolor: 'success.main',
                      color: '#fff',
                      '&:hover': { bgcolor: 'success.dark' },
                    },
                  }}
                >
                  Balanced
                </ToggleButton>
                <ToggleButton
                  value={1}
                  sx={{
                    flex: 1,
                    py: 0.5,
                    fontSize: '0.75rem',
                    '&.Mui-selected': {
                      bgcolor: 'warning.main',
                      color: '#fff',
                      '&:hover': { bgcolor: 'warning.dark' },
                    },
                  }}
                >
                  High
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          ))}
          <TextField
            fullWidth
            label="Notes"
            size="small"
            value={mentalHealthForm.notes}
            onChange={(e) =>
              setMentalHealthForm((prev) => ({
                ...prev,
                notes: e.target.value,
              }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMentalHealth(false)}>Cancel</Button>
          <Button onClick={handleMentalHealthSave} variant="contained">
            Save
          </Button>
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
