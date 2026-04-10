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
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import axios from '../api';
import { addTrendline, calcDomain, formatDateTick } from '../utils/chartUtils';

const measurementOptions = [
  { label: 'Bodyweight (kg)', value: 'bodyweight' },
  { label: 'Body Fat (%)', value: 'body_fat' },
  { label: 'Chest (cm)', value: 'chest' },
  { label: 'Waist (cm)', value: 'waist' },
  { label: 'Biceps (cm)', value: 'biceps' },
  { label: 'Forearm (cm)', value: 'forearm' },
  { label: 'Calf (cm)', value: 'calf' },
  { label: 'Thigh (cm)', value: 'thigh' },
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
    chest: '',
    waist: '',
    biceps: '',
    forearm: '',
    calf: '',
    thigh: '',
  });

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
        chest: '',
        waist: '',
        biceps: '',
        forearm: '',
        calf: '',
        thigh: '',
      }));
    } catch (err) {
      console.error('Error saving measurement:', err);
      alert('Failed to save measurement');
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
                  <InputLabel id="measurement-select-label">Metric</InputLabel>
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
                    stroke="#1976d2"
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
            const trendColor =
              delta === null
                ? 'text.secondary'
                : delta < 0
                  ? 'success.main'
                  : delta > 0
                    ? 'error.main'
                    : 'text.secondary';
            return (
              <Grid key={opt.value} size={{ xs: 12, sm: 6, md: 3 }}>
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
                          stroke="#1976d2"
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

      {/* ── History list ── */}
      <Paper sx={{ p: 2, mt: 3, maxHeight: 600, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          History
        </Typography>
        {measurements.map((m) => (
          <Box
            key={m.id}
            sx={{
              p: 2,
              mb: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {m.date}
            </Typography>
            <Grid container spacing={1}>
              {measurementOptions.map((opt) => (
                <Grid key={opt.value} size={3}>
                  <Typography variant="caption" color="text.secondary">
                    {opt.label.split(' ')[0]}:
                  </Typography>
                  <Typography variant="body2">{m[opt.value] || '-'}</Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
