import { useState, useEffect, useCallback } from 'react';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Tooltip,
  Tab,
  Tabs,
} from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import axios from '../api';
import { addTrendline, calcDomain, formatDateTick } from '../utils/chartUtils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import ExerciseLibrary from './ExerciseLibrary';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// ─── Rest Timer ──────────────────────────────────────────────────────────────

function RestTimer({ seconds, onDone }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) {
      onDone?.();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onDone]);

  const pct = (remaining / seconds) * 100;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
      <TimerIcon fontSize="small" color="primary" />
      <Box sx={{ flex: 1 }}>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Box>
      <Typography variant="body2" color="primary" sx={{ minWidth: 32 }}>
        {remaining}s
      </Typography>
      <Button size="small" onClick={onDone}>
        Skip
      </Button>
    </Box>
  );
}

// ─── Exercise Progress Dialog ─────────────────────────────────────────────────

function ProgressDialog({ exerciseId, exerciseName, open, onClose }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (!open || !exerciseId) return;
    axios
      .get(`/api/workouts/progress/${exerciseId}`)
      .then((r) => setData(r.data))
      .catch(console.error);
  }, [open, exerciseId]);

  const weightData = addTrendline(
    data
      .map((d) => ({
        date: d.date,
        value: d.max_weight,
        had_pr: d.had_pr,
        reps: d.max_reps,
      }))
      .filter(
        (d) => d.value !== null && d.value !== undefined && d.value !== ''
      )
  );
  const volumeData = addTrendline(
    data
      .map((d) => ({ date: d.date, value: Math.round(d.total_volume) }))
      .filter(
        (d) => d.value !== null && d.value !== undefined && d.value !== ''
      )
  );
  const weightDomain = calcDomain(weightData);
  const volumeDomain = calcDomain(volumeData);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        {exerciseName} — Progress
      </DialogTitle>
      <DialogContent>
        {data.length === 0 ? (
          <Typography color="text.secondary">No history yet.</Typography>
        ) : (
          <>
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
              Max Weight per Session (kg)
            </Typography>
            <Box sx={{ width: '100%', height: 220, mb: 3 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={formatDateTick}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={weightDomain}
                    tick={{ fontSize: 11 }}
                    unit=" kg"
                  />
                  <ChartTooltip
                    formatter={(v, name) => [
                      name === 'Trend' ? `${v} kg` : `${v} kg`,
                      name,
                    ]}
                    labelFormatter={formatDateTick}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Max weight"
                    stroke="#1976d2"
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      return payload.had_pr ? (
                        <circle
                          key={`dot-${cx}`}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill="#ed6c02"
                          stroke="#fff"
                          strokeWidth={1}
                        />
                      ) : (
                        <circle
                          key={`dot-${cx}`}
                          cx={cx}
                          cy={cy}
                          r={3}
                          fill="#1976d2"
                        />
                      );
                    }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="trend"
                    name="Trend"
                    stroke="#ff7043"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={false}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: 'warning.main',
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Orange dot = personal record on that session
              </Typography>
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              Total Volume per Session (kg lifted)
            </Typography>
            <Box sx={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={formatDateTick}
                    interval="preserveStartEnd"
                  />
                  <YAxis domain={volumeDomain} tick={{ fontSize: 11 }} />
                  <ChartTooltip labelFormatter={formatDateTick} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Volume"
                    stroke="#9c27b0"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="trend"
                    name="Trend"
                    stroke="#ff7043"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={false}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Weekly Volume Summary ──────────────────────────────────────────────────

function WeeklyVolumeSummary({ plan }) {
  const muscleSets = {};

  plan.days.forEach((day) => {
    const frequency = Math.max(1, day.scheduled_days?.length || 0);
    day.exercises.forEach((ex) => {
      const sets = (parseInt(ex.sets) || 0) * frequency;
      const primaryMuscles = (ex.primary_muscles || '')
        .split(',')
        .map((m) => m.trim().toLowerCase())
        .filter(Boolean);

      primaryMuscles.forEach((m) => {
        muscleSets[m] = (muscleSets[m] || 0) + sets;
      });
    });
  });

  const sortedMuscles = Object.entries(muscleSets).sort((a, b) => b[1] - a[1]);

  if (sortedMuscles.length === 0) return null;

  return (
    <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Weekly Volume Summary (Sets per Muscle)
      </Typography>
      <Grid container spacing={2}>
        {sortedMuscles.map(([muscle, sets]) => {
          // Scientific guideline: ~10-20 sets per week for hypertrophy
          const color = sets < 6 ? 'warning' : sets > 20 ? 'error' : 'success';
          return (
            <Grid key={muscle} size={{ xs: 12, sm: 6, md: 4 }}>
              <Box sx={{ mb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 0.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ textTransform: 'capitalize' }}
                  >
                    {muscle}
                  </Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {sets} sets
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((sets / 20) * 100, 100)}
                  color={color}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            </Grid>
          );
        })}
      </Grid>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1, display: 'block' }}
      >
        Guidelines: 10-20 sets/week is often optimal for hypertrophy.
      </Typography>
    </Paper>
  );
}

// ─── Muscle Readiness ─────────────────────────────────────────────────────────

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
    <Box sx={{ mt: 1 }}>
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

// ─── Plan Builder ─────────────────────────────────────────────────────────────

function PlanBuilder({ onSaved, onCancel, planToEdit }) {
  const [plan, setPlan] = useState(
    planToEdit || {
      name: '',
      description: '',
      days: [{ name: 'Day 1', exercises: [], scheduled_days: [] }],
    }
  );
  const [pickingForDay, setPickingForDay] = useState(null); // day index while library picker is open

  const addDay = () =>
    setPlan((p) => ({
      ...p,
      days: [
        ...p.days,
        { name: `Day ${p.days.length + 1}`, exercises: [], scheduled_days: [] },
      ],
    }));

  const removeDay = (dIdx) =>
    setPlan((p) => ({ ...p, days: p.days.filter((_, i) => i !== dIdx) }));

  const toggleScheduledDay = (dIdx, dayName) => {
    setPlan((p) => ({
      ...p,
      days: p.days.map((d, i) =>
        i !== dIdx
          ? d
          : {
              ...d,
              scheduled_days: d.scheduled_days.includes(dayName)
                ? d.scheduled_days.filter((name) => name !== dayName)
                : [...d.scheduled_days, dayName],
            }
      ),
    }));
  };

  const addExerciseToDay = (dIdx, ex) =>
    setPlan((p) => ({
      ...p,
      days: p.days.map((d, i) =>
        i !== dIdx
          ? d
          : {
              ...d,
              exercises: [
                ...d.exercises,
                {
                  exercise_id: ex.id,
                  name: ex.name,
                  primary_muscles: ex.primary_muscles,
                  sets: 3,
                  reps: 10,
                  weight: 0,
                  exercise_type: 'weighted',
                },
              ],
            }
      ),
    }));

  const removeExercise = (dIdx, eIdx) =>
    setPlan((p) => ({
      ...p,
      days: p.days.map((d, i) =>
        i !== dIdx
          ? d
          : {
              ...d,
              exercises: d.exercises.filter((_, j) => j !== eIdx),
            }
      ),
    }));

  const updateExerciseField = (dIdx, eIdx, field, value) =>
    setPlan((p) => ({
      ...p,
      days: p.days.map((d, i) =>
        i !== dIdx
          ? d
          : {
              ...d,
              exercises: d.exercises.map((ex, j) =>
                j !== eIdx ? ex : { ...ex, [field]: value }
              ),
            }
      ),
    }));

  const handleSave = async () => {
    if (!plan.name) return alert('Plan name is required');
    try {
      if (plan.id) {
        await axios.put(`/api/workouts/plans/${plan.id}`, plan);
      } else {
        await axios.post('/api/workouts/plans', plan);
      }
      onSaved();
    } catch {
      alert(`Failed to ${plan.id ? 'update' : 'create'} plan`);
    }
  };

  // ── Library picker view ──────────────────────────────────────────────────
  if (pickingForDay !== null) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button variant="outlined" onClick={() => setPickingForDay(null)}>
            ← Back to Plan
          </Button>
          <Typography variant="h6">
            Adding to: <strong>{plan.days[pickingForDay]?.name}</strong>
          </Typography>
        </Box>
        <ExerciseLibrary
          showAdd
          onAddExercise={(ex) => addExerciseToDay(pickingForDay, ex)}
        />
      </Box>
    );
  }

  // ── Plan editor view ─────────────────────────────────────────────────────
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {plan.id ? 'Edit Workout Plan' : 'Create New Workout Plan'}
      </Typography>
      <TextField
        fullWidth
        label="Plan Name"
        sx={{ mb: 2 }}
        value={plan.name}
        onChange={(e) => setPlan((p) => ({ ...p, name: e.target.value }))}
      />
      <TextField
        fullWidth
        label="Description (optional)"
        sx={{ mb: 3 }}
        value={plan.description}
        onChange={(e) =>
          setPlan((p) => ({ ...p, description: e.target.value }))
        }
      />

      <WeeklyVolumeSummary plan={plan} />

      {plan.days.map((day, dIdx) => (
        <Box
          key={dIdx}
          sx={{
            mb: 3,
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
            <TextField
              label={`Day ${dIdx + 1} Name`}
              size="small"
              value={day.name}
              onChange={(e) => {
                const days = [...plan.days];
                days[dIdx].name = e.target.value;
                setPlan((p) => ({ ...p, days }));
              }}
            />
            {plan.days.length > 1 && (
              <IconButton
                size="small"
                color="error"
                onClick={() => removeDay(dIdx)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mb: 0.5 }}
            >
              Scheduled Days:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {DAYS_OF_WEEK.map((dw) => (
                <Chip
                  key={dw}
                  label={dw.slice(0, 3)}
                  size="small"
                  onClick={() => toggleScheduledDay(dIdx, dw)}
                  color={
                    day.scheduled_days.includes(dw) ? 'primary' : 'default'
                  }
                  variant={
                    day.scheduled_days.includes(dw) ? 'filled' : 'outlined'
                  }
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>

          {day.exercises.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              No exercises yet — browse the library to add some.
            </Typography>
          )}

          {day.exercises.map((ex, eIdx) => (
            <Box
              key={eIdx}
              sx={{
                display: 'flex',
                gap: 1,
                mb: 1,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 160 }}>
                <Typography variant="body2" fontWeight={600}>
                  {ex.name}
                </Typography>
                {ex.primary_muscles && (
                  <Typography variant="caption" color="text.secondary">
                    {ex.primary_muscles}
                  </Typography>
                )}
              </Box>
              <TextField
                label="Sets"
                size="small"
                type="number"
                sx={{ width: 65 }}
                value={ex.sets}
                onChange={(e) =>
                  updateExerciseField(dIdx, eIdx, 'sets', e.target.value)
                }
              />
              <TextField
                label="Reps"
                size="small"
                type="number"
                sx={{ width: 65 }}
                value={ex.reps}
                onChange={(e) =>
                  updateExerciseField(dIdx, eIdx, 'reps', e.target.value)
                }
              />
              <TextField
                label="kg"
                size="small"
                type="number"
                sx={{ width: 75 }}
                value={ex.weight}
                onChange={(e) =>
                  updateExerciseField(dIdx, eIdx, 'weight', e.target.value)
                }
              />
              <TextField
                label="Min"
                size="small"
                type="number"
                sx={{ width: 60 }}
                value={ex.reps_min || ''}
                onChange={(e) =>
                  updateExerciseField(dIdx, eIdx, 'reps_min', e.target.value)
                }
              />
              <TextField
                label="Max"
                size="small"
                type="number"
                sx={{ width: 60 }}
                value={ex.reps_max || ''}
                onChange={(e) =>
                  updateExerciseField(dIdx, eIdx, 'reps_max', e.target.value)
                }
              />
              <TextField
                label="RPE"
                size="small"
                type="number"
                sx={{ width: 55 }}
                value={ex.target_rpe || ''}
                onChange={(e) =>
                  updateExerciseField(dIdx, eIdx, 'target_rpe', e.target.value)
                }
              />
              <Select
                size="small"
                sx={{ width: 115 }}
                value={ex.exercise_type}
                onChange={(e) =>
                  updateExerciseField(
                    dIdx,
                    eIdx,
                    'exercise_type',
                    e.target.value
                  )
                }
              >
                <MenuItem value="weighted">Weighted</MenuItem>
                <MenuItem value="bodyweight">Bodyweight</MenuItem>
                <MenuItem value="cardio">Cardio</MenuItem>
              </Select>
              <IconButton
                size="small"
                color="error"
                onClick={() => removeExercise(dIdx, eIdx)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}

          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{ mt: 1 }}
            onClick={() => setPickingForDay(dIdx)}
          >
            Browse Exercise Library
          </Button>
        </Box>
      ))}

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={addDay} startIcon={<AddIcon />}>
          Add Day
        </Button>
        <Button variant="contained" onClick={handleSave}>
          Save Plan
        </Button>
        <Button variant="text" onClick={onCancel}>
          Cancel
        </Button>
      </Box>
    </Paper>
  );
}

// ─── Active Workout ───────────────────────────────────────────────────────────

function ActiveWorkout({ day, onSaved, onCancel }) {
  const [logs, setLogs] = useState(() => {
    const init = {};
    day.exercises.forEach((ex) => {
      init[ex.exercise_id] = Array.from({ length: ex.sets || 3 }, () => ({
        weight: ex.weight || '',
        reps: ex.reps || '',
        rpe: '',
        notes: '',
        completed: false, // Added completed flag for tracking
      }));
    });
    return init;
  });
  const [prevSession, setPrevSession] = useState(null);
  const [restTimer, setRestTimer] = useState(null); // { seconds }
  const [sessionNotes, setSessionNotes] = useState('');
  const [progressEx, setProgressEx] = useState(null); // { id, name }
  const [suggestions, setSuggestions] = useState({});
  const [templateUpdate, setTemplateUpdate] = useState(null);

  useEffect(() => {
    axios
      .get(`/api/workouts/sessions/last-for-day/${day.id}`)
      .then((r) => {
        setPrevSession(r.data);
        if (r.data?.notes) {
          setSessionNotes(r.data.notes);
        }
      })
      .catch(() => {});
  }, [day.id]);

  useEffect(() => {
    const fetchLastPerformance = async () => {
      const exerciseIds = day.exercises.map((ex) => ex.exercise_id).join(',');
      try {
        const response = await axios.get(
          `/api/workouts/sessions/last-performance?exercise_ids=${exerciseIds}`
        );
        const lastPerf = response.data;

        setLogs((prev) => {
          const newLogs = { ...prev };
          day.exercises.forEach((ex) => {
            const perf = lastPerf[ex.exercise_id];
            if (perf && perf.length > 0) {
              // Use the number of sets from the last performance,
              // or the template if it has more sets
              const numSets = Math.max(perf.length, ex.sets || 0);
              newLogs[ex.exercise_id] = Array.from(
                { length: numSets },
                (_, i) => ({
                  weight: perf[i]?.weight ?? (ex.weight || ''),
                  reps: perf[i]?.reps ?? (ex.reps || ''),
                  rpe: perf[i]?.rpe ?? '',
                  notes: perf[i]?.notes ?? '',
                  completed: false,
                })
              );
            }
          });
          return newLogs;
        });
      } catch (err) {
        console.error('Error fetching last performance:', err);
      }
    };
    fetchLastPerformance();
  }, [day.exercises]);

  useEffect(() => {
    day.exercises.forEach((ex) => {
      const targetReps = ex.reps_max || ex.reps_min || ex.reps || 8;
      const targetRPE = ex.target_rpe || 8;
      axios
        .get(
          `/api/workouts/exercises/suggestion/${ex.exercise_id}?target_reps=${targetReps}&target_rpe=${targetRPE}`
        )
        .then((r) => {
          setSuggestions((prev) => ({
            ...prev,
            [ex.exercise_id]: r.data,
          }));
        })
        .catch(() => {});
    });
  }, [day.exercises]);

  const prevMap = useCallback(
    (exerciseId) => {
      if (!prevSession) return {};
      const sets = prevSession.logs.filter((l) => l.exercise_id === exerciseId);
      const bySet = {};
      sets.forEach((s) => {
        bySet[s.set_number] = s;
      });
      return bySet;
    },
    [prevSession]
  );

  const handleChange = (exId, setIdx, field, value) => {
    setLogs((prev) => ({
      ...prev,
      [exId]: prev[exId].map((s, i) =>
        i === setIdx ? { ...s, [field]: value } : s
      ),
    }));
  };

  const toggleSetComplete = (exId, setIdx) => {
    setLogs((prev) => {
      const isCompleted = !prev[exId][setIdx].completed;
      if (isCompleted) {
        setRestTimer({ seconds: 90 });
      }
      return {
        ...prev,
        [exId]: prev[exId].map((s, i) =>
          i === setIdx ? { ...s, completed: isCompleted } : s
        ),
      };
    });
  };

  const addSet = (exId) => {
    setLogs((prev) => ({
      ...prev,
      [exId]: [
        ...prev[exId],
        { weight: '', reps: '', rpe: '', notes: '', completed: false },
      ],
    }));
  };

  const removeSet = (exId, setIdx) => {
    setLogs((prev) => ({
      ...prev,
      [exId]: prev[exId].filter((_, i) => i !== setIdx),
    }));
  };

  const handleSave = async () => {
    const flatLogs = [];
    Object.keys(logs).forEach((exId) => {
      logs[exId].forEach((set, i) => {
        if (set.weight !== '' || set.reps !== '') {
          flatLogs.push({
            exercise_id: exId,
            set_number: i + 1,
            weight: set.weight !== '' ? parseFloat(set.weight) : null,
            reps: set.reps !== '' ? parseInt(set.reps) : null,
            rpe: set.rpe !== '' ? parseFloat(set.rpe) : null,
            notes: set.notes || null,
          });
        }
      });
    });
    try {
      await axios.post('/api/workouts/sessions', {
        day_id: day.id,
        date: new Date().toISOString().split('T')[0],
        notes: sessionNotes || null,
        logs: flatLogs,
      });

      // After saving session, check for differences to suggest template update
      const newDayExercises = day.exercises.map((ex) => {
        const sessionSets = logs[ex.exercise_id].filter(
          (s) => s.weight !== '' || s.reps !== ''
        );
        if (sessionSets.length === 0) return ex;

        const firstSet = sessionSets[0];
        return {
          ...ex,
          sets: sessionSets.length,
          weight: firstSet.weight !== '' ? firstSet.weight : ex.weight,
          reps: firstSet.reps !== '' ? firstSet.reps : ex.reps,
        };
      });

      const hasChanges = newDayExercises.some((ex, i) => {
        const orig = day.exercises[i];
        return (
          parseInt(ex.sets) !== parseInt(orig.sets) ||
          parseFloat(ex.weight) !== parseFloat(orig.weight) ||
          parseInt(ex.reps) !== parseInt(orig.reps)
        );
      });

      if (hasChanges) {
        setTemplateUpdate(newDayExercises);
      } else {
        onSaved();
      }
    } catch {
      alert('Failed to save session');
    }
  };

  const handleUpdateTemplate = async () => {
    try {
      await axios.put(`/api/workouts/days/${day.id}/exercises`, {
        exercises: templateUpdate,
      });
      onSaved();
    } catch {
      alert('Failed to update template');
      onSaved(); // Still close session even if template update failed
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6" color="primary">
          {day.name} — {new Date().toLocaleDateString()}
        </Typography>
        {prevSession && (
          <Chip
            size="small"
            label={`Prev: ${prevSession.date}`}
            variant="outlined"
          />
        )}
      </Box>

      {restTimer && (
        <Paper
          sx={{ p: 1.5, mb: 2, bgcolor: 'primary.50' }}
          elevation={0}
          variant="outlined"
        >
          <RestTimer
            seconds={restTimer.seconds}
            onDone={() => setRestTimer(null)}
          />
        </Paper>
      )}

      {day.exercises.map((ex) => {
        const prev = prevMap(ex.exercise_id);
        return (
          <Paper key={ex.exercise_id} sx={{ p: 2, mb: 2 }} variant="outlined">
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {ex.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {ex.reps_min && (
                    <Chip
                      size="small"
                      label={`Target: ${ex.reps_min}${ex.reps_max ? '-' + ex.reps_max : ''} reps`}
                      variant="outlined"
                    />
                  )}
                  {ex.target_rpe && (
                    <Chip
                      size="small"
                      label={`Target RPE: ${ex.target_rpe}`}
                      color="info"
                      variant="outlined"
                    />
                  )}
                  {suggestions[ex.exercise_id]?.suggested_weight && (
                    <Chip
                      size="small"
                      label={`Suggested: ${suggestions[ex.exercise_id].suggested_weight} kg`}
                      color="primary"
                    />
                  )}
                </Box>
              </Box>
              <IconButton
                size="small"
                onClick={() =>
                  setProgressEx({ id: ex.exercise_id, name: ex.name })
                }
              >
                <TrendingUpIcon fontSize="small" />
              </IconButton>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 32 }}>Set</TableCell>
                    {ex.exercise_type !== 'cardio' && (
                      <TableCell>Prev</TableCell>
                    )}
                    {ex.exercise_type !== 'bodyweight' &&
                      ex.exercise_type !== 'cardio' && (
                        <TableCell>kg</TableCell>
                      )}
                    {ex.exercise_type !== 'cardio' && (
                      <TableCell>Reps</TableCell>
                    )}
                    {ex.exercise_type === 'cardio' && (
                      <TableCell>Sec</TableCell>
                    )}
                    <TableCell>RPE</TableCell>
                    <TableCell sx={{ width: 32 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs[ex.exercise_id]?.map((set, i) => {
                    const p = prev[i + 1];

                    // Use theme-aware colors: success.main for completed, text.primary for active
                    const rowTextColor = set.completed
                      ? 'success.main'
                      : 'text.primary';
                    const prevTextColor = set.completed
                      ? 'success.light'
                      : 'text.secondary';

                    return (
                      <TableRow
                        key={i}
                        sx={{
                          // alpha(color, 0.1) creates a subtle tint that works in both light and dark modes
                          bgcolor: set.completed
                            ? (theme) => alpha(theme.palette.success.main, 0.15)
                            : 'inherit',
                          transition: 'background-color 0.3s ease',
                          '& .MuiTableCell-root': {
                            color: rowTextColor,
                            borderBottom: set.completed
                              ? (theme) =>
                                  `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                              : 'inherit',
                          },
                        }}
                      >
                        <TableCell>
                          <Chip
                            label={i + 1}
                            size="small"
                            onClick={() => toggleSetComplete(ex.exercise_id, i)}
                            color={set.completed ? 'success' : 'default'}
                            variant={set.completed ? 'filled' : 'outlined'}
                            sx={{
                              cursor: 'pointer',
                              fontWeight: 'bold',
                            }}
                          />
                        </TableCell>

                        {ex.exercise_type !== 'cardio' && (
                          <TableCell>
                            <Typography
                              variant="caption"
                              sx={{ color: prevTextColor }}
                            >
                              {p
                                ? `${p.weight ?? '—'}kg × ${p.reps ?? '—'}`
                                : '—'}
                            </Typography>
                          </TableCell>
                        )}

                        {[
                          {
                            field: 'weight',
                            show:
                              ex.exercise_type !== 'bodyweight' &&
                              ex.exercise_type !== 'cardio',
                            width: 70,
                          },
                          {
                            field: 'reps',
                            show: ex.exercise_type !== 'cardio',
                            width: 60,
                          },
                          { field: 'rpe', show: true, width: 55 },
                        ].map(
                          (input) =>
                            input.show && (
                              <TableCell key={input.field}>
                                <TextField
                                  size="small"
                                  type="number"
                                  variant="standard" // Standard variant looks cleaner in tables
                                  sx={{
                                    width: input.width,
                                    '& .MuiInputBase-input': {
                                      color: rowTextColor,
                                      fontWeight: set.completed ? 600 : 400,
                                      textAlign: 'center',
                                    },
                                    '& .MuiInput-underline:before': {
                                      borderBottomColor: set.completed
                                        ? (theme) =>
                                            alpha(
                                              theme.palette.success.main,
                                              0.4
                                            )
                                        : 'inherit',
                                    },
                                  }}
                                  value={set[input.field]}
                                  onChange={(e) =>
                                    handleChange(
                                      ex.exercise_id,
                                      i,
                                      input.field,
                                      e.target.value
                                    )
                                  }
                                />
                              </TableCell>
                            )
                        )}

                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => removeSet(ex.exercise_id, i)}
                            sx={{
                              color: set.completed ? 'success.main' : 'inherit',
                              opacity: 0.7,
                            }}
                          >
                            <DeleteIcon fontSize="inherit" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Button
              size="small"
              startIcon={<AddIcon />}
              sx={{ mt: 1 }}
              onClick={() => addSet(ex.exercise_id)}
            >
              Add Set
            </Button>
          </Paper>
        );
      })}

      <TextField
        fullWidth
        multiline
        rows={2}
        label="Session notes (optional)"
        value={sessionNotes}
        onChange={(e) => setSessionNotes(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" fullWidth onClick={handleSave}>
          Finish & Save
        </Button>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
      </Box>

      {progressEx && (
        <ProgressDialog
          exerciseId={progressEx.id}
          exerciseName={progressEx.name}
          open={!!progressEx}
          onClose={() => setProgressEx(null)}
        />
      )}

      <Dialog
        open={!!templateUpdate}
        onClose={() => onSaved()}
        aria-labelledby="template-update-dialog-title"
      >
        <DialogTitle id="template-update-dialog-title">
          Update Workout Template?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You made changes to the number of sets, weights, or reps during this
            session. Would you like to save these changes as the new template
            for <strong>{day.name}</strong>?
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            {templateUpdate &&
              templateUpdate
                .filter((ex, i) => {
                  const orig = day.exercises[i];
                  return (
                    parseInt(ex.sets) !== parseInt(orig.sets) ||
                    parseFloat(ex.weight) !== parseFloat(orig.weight) ||
                    parseInt(ex.reps) !== parseInt(orig.reps)
                  );
                })
                .map((ex, i) => {
                  const orig = day.exercises.find(
                    (o) => o.exercise_id === ex.exercise_id
                  );
                  return (
                    <Typography key={i} variant="body2" color="text.secondary">
                      • <strong>{ex.name}</strong>: {orig.sets}×{orig.weight}kg
                      → {ex.sets}×{ex.weight}kg
                    </Typography>
                  );
                })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onSaved()} color="inherit">
            No, keep original
          </Button>
          <Button
            onClick={handleUpdateTemplate}
            color="primary"
            variant="contained"
            autoFocus
          >
            Yes, update template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Stats Panel ──────────────────────────────────────────────────────────────

function StatsPanel() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    axios
      .get('/api/workouts/stats')
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, []);

  if (!stats)
    return <Typography color="text.secondary">Loading stats…</Typography>;

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Sessions', value: stats.totalSessions },
          { label: 'Total Sets', value: stats.totalSets },
          { label: 'Personal Records', value: stats.totalPRs },
        ].map((s) => (
          <Grid key={s.label} size={{ xs: 4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }} variant="outlined">
              <Typography variant="h4" fontWeight="bold" color="primary">
                {s.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {s.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {stats.recentPRs.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            <EmojiEventsIcon
              sx={{ mr: 0.5, color: 'warning.main', verticalAlign: 'middle' }}
            />
            Recent PRs
          </Typography>
          {stats.recentPRs.map((pr, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                py: 0.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2">{pr.name}</Typography>
              <Typography variant="body2" color="primary">
                {pr.weight} kg × {pr.reps} reps
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {pr.date}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {stats.muscleVolume.length > 0 && (
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Volume by Muscle Group
          </Typography>
          {stats.muscleVolume.map((m, i) => {
            const max = stats.muscleVolume[0].volume;
            return (
              <Box key={i} sx={{ mb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 0.3,
                  }}
                >
                  <Typography variant="caption">
                    {m.muscle || 'Unknown'}
                  </Typography>
                  <Typography variant="caption">
                    {Math.round(m.volume)} kg total
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(m.volume / max) * 100}
                  sx={{ height: 8, borderRadius: 2 }}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

// ─── History Panel ───────────────────────────────────────────────────────────

function HistoryPanel() {
  const [history, setHistory] = useState([]);
  const [progressEx, setProgressEx] = useState(null);

  useEffect(() => {
    axios
      .get('/api/workouts/sessions?limit=30')
      .then((r) => setHistory(r.data))
      .catch(() => {});
  }, []);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Workout History
      </Typography>
      {history.length === 0 && (
        <Typography color="text.secondary">No sessions yet.</Typography>
      )}
      {history.map((session) => {
        const exerciseSummary = Object.values(
          session.logs.reduce((acc, log) => {
            if (!acc[log.exercise_id])
              acc[log.exercise_id] = {
                name: log.exercise_name,
                sets: [],
                hasPR: false,
              };
            acc[log.exercise_id].sets.push(log);
            if (log.is_pr) acc[log.exercise_id].hasPR = true;
            return acc;
          }, {})
        );

        return (
          <Accordion key={session.id} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  width: '100%',
                }}
              >
                <Typography sx={{ flexGrow: 1 }}>
                  {session.date} — {session.day_name}
                </Typography>
                <Chip
                  label={session.plan_name}
                  size="small"
                  variant="outlined"
                />
                {exerciseSummary.some((e) => e.hasPR) && (
                  <Tooltip title="Personal Record!">
                    <EmojiEventsIcon fontSize="small" color="warning" />
                  </Tooltip>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {session.notes && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1, fontStyle: 'italic' }}
                >
                  "{session.notes}"
                </Typography>
              )}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Exercise</TableCell>
                      <TableCell align="right">Sets</TableCell>
                      <TableCell align="right">Best Set</TableCell>
                      <TableCell align="right">Volume</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exerciseSummary.map((ex, i) => {
                      const bestSet = ex.sets.reduce(
                        (best, s) =>
                          !best || s.weight > best.weight ? s : best,
                        null
                      );
                      const volume = ex.sets.reduce(
                        (sum, s) => sum + (s.weight || 0) * (s.reps || 0),
                        0
                      );
                      return (
                        <TableRow
                          key={i}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() =>
                            setProgressEx({
                              id: ex.sets[0].exercise_id,
                              name: ex.name,
                            })
                          }
                        >
                          <TableCell>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              {ex.name}
                              {ex.hasPR && (
                                <EmojiEventsIcon
                                  fontSize="inherit"
                                  color="warning"
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{ex.sets.length}</TableCell>
                          <TableCell align="right">
                            {bestSet
                              ? `${bestSet.weight ?? '—'} kg × ${bestSet.reps ?? '—'}`
                              : '—'}
                          </TableCell>
                          <TableCell align="right">
                            {Math.round(volume)} kg
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {progressEx && (
        <ProgressDialog
          exerciseId={progressEx.id}
          exerciseName={progressEx.name}
          open={!!progressEx}
          onClose={() => setProgressEx(null)}
        />
      )}
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Workouts({
  activeDay: propActiveDay,
  onActiveDayChange,
}) {
  const [tab, setTab] = useState(0);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activeDay, setActiveDay] = useState(propActiveDay || null);
  const [planToEdit, setPlanToEdit] = useState(null);
  const [lastTrainedMuscles, setLastTrainedMuscles] = useState(null);

  // Sync prop with state
  useEffect(() => {
    if (propActiveDay) {
      setActiveDay(propActiveDay);
    }
  }, [propActiveDay]);

  const handleActiveDayChange = (day) => {
    setActiveDay(day);
    if (!day && onActiveDayChange) {
      onActiveDayChange(null);
    }
  };

  const fetchPlans = useCallback(async () => {
    const r = await axios
      .get('/api/workouts/plans')
      .catch(() => ({ data: [] }));
    setPlans(r.data);
  }, []);

  const fetchTrainedMuscles = useCallback(async () => {
    const r = await axios
      .get('/api/workouts/last-trained-muscles')
      .catch(() => ({ data: {} }));
    setLastTrainedMuscles(r.data);
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchTrainedMuscles();
  }, [fetchPlans, fetchTrainedMuscles]);

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Delete this plan?')) return;
    await axios.delete(`/api/workouts/plans/${planId}`).catch(() => {});
    fetchPlans();
    if (selectedPlan?.id === planId) setSelectedPlan(null);
  };

  if (activeDay) {
    return (
      <ActiveWorkout
        day={activeDay}
        onSaved={() => {
          handleActiveDayChange(null);
          setTab(1);
        }}
        onCancel={() => handleActiveDayChange(null)}
      />
    );
  }

  if (planToEdit !== null) {
    return (
      <PlanBuilder
        planToEdit={planToEdit === true ? null : planToEdit}
        onSaved={() => {
          fetchPlans();
          setPlanToEdit(null);
        }}
        onCancel={() => setPlanToEdit(null)}
      />
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h4">Workout Tracking</Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => setPlanToEdit(true)}
        >
          Create New Plan
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Start Workout" />
        <Tab label="History" />
        <Tab label="Stats" />
        <Tab label="Exercise Library" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Select Plan
              </Typography>
              {plans.length === 0 && (
                <Typography color="text.secondary">
                  No plans yet. Create one to get started.
                </Typography>
              )}
              {plans.map((plan) => (
                <Paper
                  key={plan.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    mb: 1,
                    cursor: 'pointer',
                    bgcolor:
                      selectedPlan?.id === plan.id
                        ? 'primary.50'
                        : 'transparent',
                    borderColor:
                      selectedPlan?.id === plan.id ? 'primary.main' : 'divider',
                  }}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography fontWeight="bold">{plan.name}</Typography>
                      {plan.description && (
                        <Typography variant="caption" color="text.secondary">
                          {plan.description}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        {plan.days?.length ?? 0} days
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanToEdit(plan);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlan(plan.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            {selectedPlan ? (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedPlan.name}
                </Typography>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Choose a day to start:
                </Typography>
                <Grid container spacing={1}>
                  {selectedPlan.days?.map((day) => (
                    <Grid key={day.id} size={{ xs: 12, sm: 6 }}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          '&:hover': { borderColor: 'primary.main' },
                        }}
                        onClick={() => handleActiveDayChange(day)}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <Box>
                            <Typography fontWeight="bold">
                              {day.name}
                            </Typography>
                            {day.scheduled_days?.length > 0 && (
                              <Typography
                                variant="caption"
                                color="primary"
                                display="block"
                                fontWeight="bold"
                              >
                                {day.scheduled_days
                                  .map((d) => d.slice(0, 3))
                                  .join(', ')}
                              </Typography>
                            )}
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              {day.exercises?.length ?? 0} exercises
                            </Typography>
                          </Box>
                          <MuscleReadiness
                            day={day}
                            lastTrainedMuscles={lastTrainedMuscles}
                          />
                        </Box>

                        <Box sx={{ mt: 1 }}>
                          {day.exercises?.slice(0, 3).map((ex, i) => (
                            <Chip
                              key={i}
                              label={ex.name}
                              size="small"
                              sx={{ mr: 0.3, mb: 0.3, fontSize: '0.65rem' }}
                            />
                          ))}
                          {(day.exercises?.length ?? 0) > 3 && (
                            <Chip
                              label={`+${day.exercises.length - 3}`}
                              size="small"
                              sx={{ fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            ) : (
              <Paper
                sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}
              >
                Select a plan on the left to begin.
              </Paper>
            )}
          </Grid>
        </Grid>
      )}

      {tab === 1 && <HistoryPanel />}
      {tab === 2 && <StatsPanel />}
      {tab === 3 && <ExerciseLibrary />}
    </Box>
  );
}
