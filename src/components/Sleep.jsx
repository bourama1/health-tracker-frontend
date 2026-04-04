import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import DeleteIcon from '@mui/icons-material/Delete';
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
import axios from '../api';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const minutesToHm = (minutes) => {
  if (minutes === null || minutes === undefined || minutes === '') return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
};

const hmToMinutes = (hm) => {
  if (!hm || typeof hm !== 'string' || !hm.includes(':')) return hm;
  const [h, m] = hm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return hm;
  return h * 60 + m;
};

const getMinsFromTime = (timeStr) => {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const getTimeDeviation = (timeStr, targetH, targetM) => {
  if (!timeStr) return 0;
  const actual = getMinsFromTime(timeStr);
  const target = targetH * 60 + targetM;
  let diff = Math.abs(actual - target);
  if (diff > 12 * 60) diff = 24 * 60 - diff;
  return diff;
};

// ─── COLOR LOGIC ────────────────────────────────────────────────────────────

/**
 * Returns a color between Green (120) and Red (0) based on value position in range.
 * @param {number} value - The actual value
 * @param {number} best - The 'best' value in history
 * @param {number} worst - The 'worst' value in history
 */
const getGradientColor = (value, best, worst) => {
  if (value === null || value === undefined || best === worst) return 'inherit';

  // Calculate percentage (0 = worst, 1 = best)
  // Clamp value between best and worst
  const min = Math.min(best, worst);
  const max = Math.max(best, worst);
  const clamped = Math.max(min, Math.min(max, value));

  let pct;
  if (best > worst) {
    // Higher is better (e.g. Deep Sleep)
    pct = (clamped - worst) / (best - worst);
  } else {
    // Lower is better (e.g. RHR, Awake, Deviation)
    pct = (worst - clamped) / (worst - best);
  }

  // HSL: 0 is Red, 120 is Green.
  const hue = pct * 120;
  return `hsl(${hue}, 70%, 45%)`;
};

// ─── COMPONENT ──────────────────────────────────────────────────────────────

const sleepStatsOptions = [
  { label: 'RHR (bpm)', value: 'rhr', color: '#ff7300', better: 'lower' },
  {
    label: 'Deep Sleep (mins)',
    value: 'deep_sleep_minutes',
    color: '#0088fe',
    better: 'higher',
  },
  {
    label: 'REM Sleep (mins)',
    value: 'rem_sleep_minutes',
    color: '#00c49f',
    better: 'higher',
  },
  {
    label: 'Light Sleep (mins)',
    value: 'light_minutes',
    color: '#ffbb28',
    better: 'higher',
  },
  {
    label: 'Awake (mins)',
    value: 'awake_minutes',
    color: '#ff8042',
    better: 'lower',
  },
];

export default function Sleep() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStat, setSelectedStat] = useState('rhr');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    bedtime: '',
    wake_time: '',
    rhr: '',
    deep_sleep_minutes: '',
    rem_sleep_minutes: '',
    light_minutes: '',
    awake_minutes: '',
  });

  const [syncing, setSyncing] = useState(false);
  const [syncDays, setSyncDays] = useState(30);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axios.get('/api/sleep');
      const sortedData = response.data.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      setHistory(sortedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ─── CALCULATE DYNAMIC RANGES ─────────────────────────────────────────────
  const statsRanges = useMemo(() => {
    if (history.length === 0) return {};

    const keys = [
      'rhr',
      'deep_sleep_minutes',
      'rem_sleep_minutes',
      'awake_minutes',
      'bedtime_dev',
      'wake_dev',
    ];
    const ranges = {};

    keys.forEach((key) => {
      let values;
      if (key === 'bedtime_dev') {
        values = history
          .map((h) => getTimeDeviation(h.bedtime, 22, 0))
          .filter((v) => v !== null);
      } else if (key === 'wake_dev') {
        values = history
          .map((h) => getTimeDeviation(h.wake_time, 6, 0))
          .filter((v) => v !== null);
      } else {
        values = history
          .map((h) => h[key])
          .filter((v) => v !== null && v !== '');
      }

      if (values.length > 0) {
        ranges[key] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
        };
      }
    });

    return ranges;
  }, [history]);

  const getDynamicColor = (key, value) => {
    const range = statsRanges[key];
    if (!range || value === null || value === undefined || value === '')
      return 'inherit';

    if (
      key === 'rhr' ||
      key === 'awake_minutes' ||
      key === 'bedtime_dev' ||
      key === 'wake_dev'
    ) {
      return getGradientColor(value, range.min, range.max); // Lower is better
    }
    return getGradientColor(value, range.max, range.min); // Higher is better
  };

  // ─── HANDLERS ─────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        deep_sleep_minutes: hmToMinutes(formData.deep_sleep_minutes),
        rem_sleep_minutes: hmToMinutes(formData.rem_sleep_minutes),
        light_minutes: hmToMinutes(formData.light_minutes),
        awake_minutes: hmToMinutes(formData.awake_minutes),
      };
      await axios.post('/api/sleep', dataToSubmit);
      fetchHistory();
      setFormData({
        ...formData,
        bedtime: '',
        wake_time: '',
        rhr: '',
        deep_sleep_minutes: '',
        rem_sleep_minutes: '',
        light_minutes: '',
        awake_minutes: '',
      });
      showSnackbar('Sleep entry saved!');
    } catch (error) {
      showSnackbar('Failed to save sleep data', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await axios.delete(`/api/sleep/${id}`);
      fetchHistory();
      showSnackbar('Entry deleted');
    } catch (error) {
      showSnackbar('Failed to delete entry', 'error');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleFitSync = async () => {
    setSyncing(true);
    try {
      const response = await axios.post(`/api/fit/sync-sleep?days=${syncDays}`);
      showSnackbar(response.data.message, 'success');
      fetchHistory();
    } catch (err) {
      const msg = err.response?.data?.error || 'Sync failed. Please try again.';
      if (err.response?.status === 401) {
        showSnackbar('Google session expired. Please log in again.', 'warning');
      } else {
        showSnackbar(msg, 'error');
      }
    } finally {
      setSyncing(false);
    }
  };

  const chartData = history.map((h) => ({
    date: h.date,
    value: h[selectedStat],
  }));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="h4">Sleep Analysis</Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel id="sync-days-label">Sync period</InputLabel>
            <Select
              labelId="sync-days-label"
              value={syncDays}
              label="Sync period"
              onChange={(e) => setSyncDays(e.target.value)}
              disabled={syncing}
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={60}>Last 60 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Sync with Google Fit">
            <span>
              <Button
                variant="outlined"
                startIcon={
                  syncing ? <CircularProgress size={16} /> : <SyncIcon />
                }
                onClick={handleGoogleFitSync}
                disabled={syncing}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {syncing ? 'Syncing…' : 'Sync Google Fit'}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add Sleep Entry
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
                required
              />
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Bedtime"
                    type="time"
                    name="bedtime"
                    value={formData.bedtime}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Wake Time"
                    type="time"
                    name="wake_time"
                    value={formData.wake_time}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="RHR (bpm)"
                    name="rhr"
                    type="number"
                    value={formData.rhr}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Deep (h:mm)"
                    name="deep_sleep_minutes"
                    placeholder="1:30"
                    value={formData.deep_sleep_minutes}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="REM (h:mm)"
                    name="rem_sleep_minutes"
                    placeholder="1:15"
                    value={formData.rem_sleep_minutes}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Light (h:mm)"
                    name="light_minutes"
                    placeholder="4:30"
                    value={formData.light_minutes}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Awake (h:mm)"
                    name="awake_minutes"
                    placeholder="0:45"
                    value={formData.awake_minutes}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>
              <Button
                variant="contained"
                type="submit"
                fullWidth
                color="primary"
              >
                Save Entry
              </Button>
            </form>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sleep Trends
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="stat-select-label">Select Statistic</InputLabel>
              <Select
                labelId="stat-select-label"
                value={selectedStat}
                label="Select Statistic"
                onChange={(e) => setSelectedStat(e.target.value)}
              >
                {sleepStatsOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={
                      sleepStatsOptions.find((o) => o.value === selectedStat)
                        ?.label
                    }
                    stroke={
                      sleepStatsOptions.find((o) => o.value === selectedStat)
                        ?.color
                    }
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <TableContainer component={Paper} sx={{ maxHeight: 800 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Bedtime</TableCell>
                  <TableCell align="right">Wake Up</TableCell>
                  <TableCell align="right">RHR</TableCell>
                  <TableCell align="right">Deep</TableCell>
                  <TableCell align="right">REM</TableCell>
                  <TableCell align="right">Light</TableCell>
                  <TableCell align="right">Awake</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...history].reverse().map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {row.date}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: getDynamicColor(
                          'bedtime_dev',
                          getTimeDeviation(row.bedtime, 22, 0)
                        ),
                        fontWeight: 'bold',
                      }}
                    >
                      {row.bedtime}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: getDynamicColor(
                          'wake_dev',
                          getTimeDeviation(row.wake_time, 6, 0)
                        ),
                        fontWeight: 'bold',
                      }}
                    >
                      {row.wake_time}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: getDynamicColor('rhr', row.rhr),
                        fontWeight: 'bold',
                      }}
                    >
                      {row.rhr || '-'}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: getDynamicColor(
                          'deep_sleep_minutes',
                          row.deep_sleep_minutes
                        ),
                        fontWeight: 'bold',
                      }}
                    >
                      {minutesToHm(row.deep_sleep_minutes)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: getDynamicColor(
                          'rem_sleep_minutes',
                          row.rem_sleep_minutes
                        ),
                        fontWeight: 'bold',
                      }}
                    >
                      {minutesToHm(row.rem_sleep_minutes)}
                    </TableCell>
                    <TableCell align="right">
                      {minutesToHm(row.light_minutes)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: getDynamicColor(
                          'awake_minutes',
                          row.awake_minutes
                        ),
                        fontWeight: 'bold',
                      }}
                    >
                      {minutesToHm(row.awake_minutes)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(row.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
