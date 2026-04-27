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
import {
  addTrendline,
  calcDomain,
  formatDateTick,
  getGradientColor,
} from '../utils/chartUtils';

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

// ─── COMPONENT ──────────────────────────────────────────────────────────────

const sleepStatsOptions = [
  { label: 'RHR (bpm)', value: 'rhr', color: '#ff7300', better: 'lower' },
  { label: 'HRV (ms)', value: 'hrv', color: '#8884d8', better: 'higher' },
  { label: 'Score', value: 'sleep_score', color: '#82ca9d', better: 'higher' },
  {
    label: 'Temp Dev (°C)',
    value: 'temp_dev',
    color: '#ff4444',
    better: 'lower',
  },
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
    hrv: '',
    sleep_score: '',
    temp_dev: '',
    deep_sleep_minutes: '',
    rem_sleep_minutes: '',
    light_minutes: '',
    awake_minutes: '',
  });

  const [syncing, setSyncing] = useState(false);
  const [syncingUh, setSyncingUh] = useState(false);
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
      'hrv',
      'sleep_score',
      'temp_dev',
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
      key === 'wake_dev' ||
      key === 'temp_dev'
    ) {
      return getGradientColor(value, range.min, range.max); // Lower is better
    }
    return getGradientColor(value, range.max, range.min); // Higher is better
  };

  // ─── HANDLERS ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const existing = history.find((h) => h.date === formData.date);
    if (existing) {
      setFormData((prev) => ({
        ...prev,
        bedtime: existing.bedtime || '',
        wake_time: existing.wake_time || '',
        rhr: existing.rhr || '',
        hrv: existing.hrv || '',
        sleep_score: existing.sleep_score || '',
        temp_dev: existing.temp_dev || '',
        deep_sleep_minutes:
          minutesToHm(existing.deep_sleep_minutes) === '-'
            ? ''
            : minutesToHm(existing.deep_sleep_minutes),
        rem_sleep_minutes:
          minutesToHm(existing.rem_sleep_minutes) === '-'
            ? ''
            : minutesToHm(existing.rem_sleep_minutes),
        light_minutes:
          minutesToHm(existing.light_minutes) === '-'
            ? ''
            : minutesToHm(existing.light_minutes),
        awake_minutes:
          minutesToHm(existing.awake_minutes) === '-'
            ? ''
            : minutesToHm(existing.awake_minutes),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        bedtime: '',
        wake_time: '',
        rhr: '',
        hrv: '',
        sleep_score: '',
        temp_dev: '',
        deep_sleep_minutes: '',
        rem_sleep_minutes: '',
        light_minutes: '',
        awake_minutes: '',
      }));
    }
  }, [formData.date, history]);

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
        hrv: '',
        sleep_score: '',
        temp_dev: '',
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
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await axios.post(
        `/api/fit/sync-sleep?days=${syncDays}&tz=${encodeURIComponent(tz)}`
      );
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

  const handleUltrahumanSync = async () => {
    setSyncingUh(true);
    try {
      const response = await axios.get(`/api/ultrahuman/sync?days=${syncDays}`);
      showSnackbar(response.data.message, 'success');
      fetchHistory();
    } catch (err) {
      const msg = err.response?.data?.error || 'Sync failed. Please try again.';
      showSnackbar(msg, 'error');
    } finally {
      setSyncingUh(false);
    }
  };

  const chartData = addTrendline(
    history
      .map((h) => ({
        date: h.date,
        value: h[selectedStat],
      }))
      .filter(
        (d) => d.value !== null && d.value !== undefined && d.value !== ''
      )
  );

  const yDomain = calcDomain(chartData);

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
                disabled={syncing || syncingUh}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {syncing ? 'Syncing…' : 'Sync Google Fit'}
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="Sync with Ultrahuman">
            <span>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={
                  syncingUh ? <CircularProgress size={16} /> : <SyncIcon />
                }
                onClick={handleUltrahumanSync}
                disabled={syncing || syncingUh}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {syncingUh ? 'Syncing…' : 'Sync Ultrahuman'}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Top row: form left, chart right, same height ── */}
      <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Add Sleep Entry
            </Typography>
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
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
                    label="HRV (ms)"
                    name="hrv"
                    type="number"
                    value={formData.hrv}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Sleep Score"
                    name="sleep_score"
                    type="number"
                    value={formData.sleep_score}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Temp Dev (°C)"
                    name="temp_dev"
                    type="number"
                    inputProps={{ step: '0.01' }}
                    value={formData.temp_dev}
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
                <Grid size={6}>
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
              <Box sx={{ mt: 'auto' }}>
                <Button
                  variant="contained"
                  type="submit"
                  fullWidth
                  color="primary"
                >
                  Save Entry
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex' }}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Typography variant="h6">Sleep Trends</Typography>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="stat-select-label">Select Statistic</InputLabel>
                <Select
                  labelId="stat-select-label"
                  value={selectedStat}
                  label="Metric"
                  onChange={(e) => setSelectedStat(e.target.value)}
                >
                  {sleepStatsOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={formatDateTick}
                    interval="preserveStartEnd"
                  />
                  <YAxis domain={yDomain} tick={{ fontSize: 11 }} />
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
                    dot={{ r: 3 }}
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
          </Paper>
        </Grid>
      </Grid>

      {/* ── Sparkline overview: all sleep metrics ── */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          All Metrics Overview
        </Typography>
        <Grid container spacing={2}>
          {sleepStatsOptions.map((opt) => {
            const sparkData = addTrendline(
              history
                .map((h) => ({ date: h.date, value: h[opt.value] }))
                .filter(
                  (d) =>
                    d.value !== null && d.value !== undefined && d.value !== ''
                )
            );
            const hasData = sparkData.some(
              (d) => d.value != null && d.value !== ''
            );
            if (!hasData) return null;
            const domain = calcDomain(sparkData);
            const vals = sparkData
              .map((d) => parseFloat(d.value))
              .filter((v) => !isNaN(v));
            const latest = vals[vals.length - 1];
            const first = vals[0];
            const delta =
              latest != null && first != null ? latest - first : null;
            // For RHR and awake, lower is better; for sleep stages, higher is better
            const lowerIsBetter = opt.better === 'lower';
            const improving =
              delta !== null && (lowerIsBetter ? delta < 0 : delta > 0);
            const trendColor =
              delta === null
                ? 'text.secondary'
                : improving
                  ? 'success.main'
                  : 'error.main';
            const isDuration = opt.value.includes('minutes');
            const latestDisplay =
              opt.value === 'rhr'
                ? `${latest} bpm`
                : opt.value === 'temp_dev'
                  ? `${latest > 0 ? '+' : ''}${latest}°C`
                  : isDuration
                    ? minutesToHm(Math.round(latest))
                    : latest;

            const deltaDisplay =
              opt.value === 'rhr' ||
              opt.value === 'hrv' ||
              opt.value === 'sleep_score' ||
              opt.value === 'temp_dev'
                ? delta.toFixed(opt.value === 'temp_dev' ? 2 : 1)
                : minutesToHm(Math.abs(Math.round(delta)));

            return (
              <Grid key={opt.value} size={{ xs: 12, sm: 6, md: 'grow' }}>
                <Paper
                  variant="outlined"
                  onClick={() => setSelectedStat(opt.value)}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    borderColor:
                      selectedStat === opt.value ? 'primary.main' : 'divider',
                    borderWidth: selectedStat === opt.value ? 2 : 1,
                    '&:hover': { borderColor: 'primary.light' },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {opt.label}
                    </Typography>
                    {delta !== null && (
                      <Typography
                        variant="caption"
                        color={trendColor}
                        sx={{ ml: 1, flexShrink: 0 }}
                      >
                        {delta > 0 ? '+' : ''}
                        {deltaDisplay}
                      </Typography>
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{ mb: 0.5 }}
                  >
                    {latestDisplay}
                  </Typography>
                  <Box sx={{ width: '100%', height: 50 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparkData}>
                        <YAxis domain={domain} hide />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={opt.color}
                          strokeWidth={1.5}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="trend"
                          stroke="#ff7043"
                          strokeWidth={1}
                          strokeDasharray="4 2"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* ── History table, full width ── */}
      <TableContainer component={Paper} sx={{ mt: 3, maxHeight: 600 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell align="right">Bedtime</TableCell>
              <TableCell align="right">Wake Up</TableCell>
              <TableCell align="right">RHR</TableCell>
              <TableCell align="right">HRV</TableCell>
              <TableCell align="right">Score</TableCell>
              <TableCell align="right">Temp</TableCell>
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
                <TableCell sx={{ fontWeight: 'bold' }}>{row.date}</TableCell>
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
                    color: getDynamicColor('hrv', row.hrv),
                    fontWeight: 'bold',
                  }}
                >
                  {row.hrv || '-'}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: getDynamicColor('sleep_score', row.sleep_score),
                    fontWeight: 'bold',
                  }}
                >
                  {row.sleep_score || '-'}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: getDynamicColor('temp_dev', row.temp_dev),
                    fontWeight: 'bold',
                  }}
                >
                  {row.temp_dev != null
                    ? row.temp_dev > 0
                      ? `+${row.temp_dev}`
                      : row.temp_dev
                    : '-'}
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
                </TableCell>{' '}
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
                    color: getDynamicColor('awake_minutes', row.awake_minutes),
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
