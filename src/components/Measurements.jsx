import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Snackbar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

const measurementOptions = [
  {
    label: 'Bodyweight (kg)',
    value: 'bodyweight',
    better: 'lower',
    color: '#1976d2',
  },
  {
    label: 'Body Fat (%)',
    value: 'body_fat',
    better: 'lower',
    color: '#82ca9d',
  },
  { label: 'VO2 Max', value: 'vo2_max', better: 'higher', color: '#ff7300' },
  { label: 'Chest (cm)', value: 'chest', better: 'higher', color: '#8884d8' },
  { label: 'Waist (cm)', value: 'waist', better: 'lower', color: '#ff4444' },
  { label: 'Biceps (cm)', value: 'biceps', better: 'higher', color: '#0088fe' },
  {
    label: 'Forearm (cm)',
    value: 'forearm',
    better: 'higher',
    color: '#00c49f',
  },
  { label: 'Calf (cm)', value: 'calf', better: 'higher', color: '#ffbb28' },
  { label: 'Thigh (cm)', value: 'thigh', better: 'higher', color: '#ff8042' },
];

export default function Measurements() {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMeasurement, setSelectedMeasurement] = useState('bodyweight');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    bodyweight: '',
    body_fat: '',
    vo2_max: '',
    chest: '',
    waist: '',
    biceps: '',
    forearm: '',
    calf: '',
    thigh: '',
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  const fetchMeasurements = useCallback(async () => {
    try {
      const response = await axios.get('/api/measurements');
      setMeasurements(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching measurements:', err);
      setError('Failed to load measurements');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeasurements();
  }, [fetchMeasurements]);

  // ─── CALCULATE DYNAMIC RANGES ─────────────────────────────────────────────
  const statsRanges = useMemo(() => {
    if (measurements.length === 0) return {};

    const keys = measurementOptions.map((opt) => opt.value);
    const ranges = {};

    keys.forEach((key) => {
      const values = measurements
        .map((m) => m[key])
        .filter((v) => v !== null && v !== '' && v !== undefined)
        .map((v) => parseFloat(v))
        .filter((v) => !isNaN(v));

      if (values.length > 0) {
        ranges[key] = {
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }
    });

    return ranges;
  }, [measurements]);

  const getDynamicColor = (key, value) => {
    const range = statsRanges[key];
    if (!range || value === null || value === undefined || value === '')
      return 'inherit';

    const option = measurementOptions.find((opt) => opt.value === key);
    if (option?.better === 'lower') {
      return getGradientColor(value, range.min, range.max);
    }
    return getGradientColor(value, range.max, range.min);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/measurements', formData);
      fetchMeasurements();
      // Reset form (except date)
      setFormData((prev) => ({
        ...prev,
        bodyweight: '',
        body_fat: '',
        vo2_max: '',
        chest: '',
        waist: '',
        biceps: '',
        forearm: '',
        calf: '',
        thigh: '',
      }));
      showSnackbar('Measurement entry saved!');
    } catch (err) {
      console.error('Error saving measurement:', err);
      showSnackbar('Failed to save measurement', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await axios.delete(`/api/measurements/${id}`);
      fetchMeasurements();
      showSnackbar('Entry deleted');
    } catch (error) {
      showSnackbar('Failed to delete entry', 'error');
    }
  };

  const handleMeasurementChange = (e) => {
    setSelectedMeasurement(e.target.value);
  };

  const chartData = addTrendline(
    measurements
      .slice()
      .reverse()
      .map((m) => ({
        date: m.date,
        value: m[selectedMeasurement],
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
      <Typography variant="h4" gutterBottom>
        Body Measurements
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Top row: form left, big chart right ─────────────────────── */}
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
              Add New Entry
            </Typography>
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              <TextField
                fullWidth
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
                required
              />
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Weight (kg)"
                    name="bodyweight"
                    type="number"
                    inputProps={{ step: '0.1' }}
                    value={formData.bodyweight}
                    onChange={handleInputChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Body Fat (%)"
                    name="body_fat"
                    type="number"
                    inputProps={{ step: '0.1' }}
                    value={formData.body_fat}
                    onChange={handleInputChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="VO2 Max"
                    name="vo2_max"
                    type="number"
                    inputProps={{ step: '0.1' }}
                    value={formData.vo2_max}
                    onChange={handleInputChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Chest (cm)"
                    name="chest"
                    type="number"
                    inputProps={{ step: '0.1' }}
                    value={formData.chest}
                    onChange={handleInputChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Waist (cm)"
                    name="waist"
                    type="number"
                    inputProps={{ step: '0.1' }}
                    value={formData.waist}
                    onChange={handleInputChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Biceps (cm)"
                    name="biceps"
                    type="number"
                    inputProps={{ step: '0.1' }}
                    value={formData.biceps}
                    onChange={handleInputChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Forearm (cm)"
                    name="forearm"
                    type="number"
                    inputProps={{ step: '0.1' }}
                    value={formData.forearm}
                    onChange={handleInputChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Calf (cm)"
                    name="calf"
                    type="number"
                    inputProps={{ step: '0.1' }}
                    value={formData.calf}
                    onChange={handleInputChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Thigh (cm)"
                    name="thigh"
                    type="number"
                    inputProps={{ step: '0.1' }}
                    value={formData.thigh}
                    onChange={handleInputChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 'auto' }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  color="primary"
                >
                  Save Entry
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>

        {/* ── Main chart: full height, right side ── */}
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
              <Typography variant="h6">Progress Chart</Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel id="measurement-select-label">
                    Select Measurement
                  </InputLabel>
                  <Select
                    labelId="measurement-select-label"
                    value={selectedMeasurement}
                    label="Metric"
                    onChange={handleMeasurementChange}
                  >
                    {measurementOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Box sx={{ flex: 1, minHeight: 200 }}>
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
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={
                      measurementOptions.find(
                        (opt) => opt.value === selectedMeasurement
                      )?.label
                    }
                    stroke={
                      measurementOptions.find(
                        (o) => o.value === selectedMeasurement
                      )?.color || '#1976d2'
                    }
                    activeDot={{ r: 8 }}
                    dot={{ r: 3 }}
                    strokeWidth={2}
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

      {/* ── Sparkline row: all metrics at a glance ── */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          All Metrics Overview
        </Typography>
        <Grid container spacing={2}>
          {measurementOptions.map((opt) => {
            const sparkData = addTrendline(
              measurements
                .slice()
                .reverse()
                .map((m) => ({ date: m.date, value: m[opt.value] }))
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
            const lowerIsBetter = opt.better === 'lower';
            const improving =
              delta !== null && (lowerIsBetter ? delta < 0 : delta > 0);
            const trendColor =
              delta === null
                ? 'text.secondary'
                : improving
                  ? 'success.main'
                  : 'error.main';
            return (
              <Grid key={opt.value} size={{ xs: 12, sm: 6, md: 'grow' }}>
                <Paper
                  variant="outlined"
                  onClick={() => setSelectedMeasurement(opt.value)}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    borderColor:
                      selectedMeasurement === opt.value
                        ? 'primary.main'
                        : 'divider',
                    borderWidth: selectedMeasurement === opt.value ? 2 : 1,
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
                        {delta.toFixed(1)}
                      </Typography>
                    )}
                  </Box>
                  {latest != null && (
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{ mb: 0.5 }}
                    >
                      {latest}
                    </Typography>
                  )}
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

      {/* ── History Table ── */}
      <TableContainer component={Paper} sx={{ mt: 3, maxHeight: 600 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              {measurementOptions.map((opt) => (
                <TableCell key={opt.value} align="right">
                  {opt.label.split(' ')[0]}
                </TableCell>
              ))}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {measurements.map((m) => (
              <TableRow key={m.id} hover>
                <TableCell sx={{ fontWeight: 'bold' }}>{m.date}</TableCell>
                {measurementOptions.map((opt) => (
                  <TableCell
                    key={opt.value}
                    align="right"
                    sx={{
                      color: getDynamicColor(opt.value, m[opt.value]),
                      fontWeight: 'bold',
                    }}
                  >
                    {m[opt.value] || '-'}
                  </TableCell>
                ))}
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(m.id)}
                    aria-label="delete measurement"
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
