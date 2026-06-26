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
  ToggleButtonGroup,
  ToggleButton,
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
import { formatDateTick } from '../utils/chartUtils';

const metrics = [
  {
    key: 'energy',
    label: 'Energy',
    lowLabel: 'Lethargic',
    highLabel: 'Manic',
    lowDesc: 'Lethargic, unmotivated, disinterested',
    balancedDesc: 'Bright, focused, consistent',
    highDesc: 'Irrational, inefficient, distracted',
  },
  {
    key: 'mood',
    label: 'Mood',
    lowLabel: 'Depressed',
    highLabel: 'Overexcited',
    lowDesc: 'Depressed, irritable, at risk of harmful behaviors',
    balancedDesc: 'Happy, content, stable',
    highDesc: 'Inflated, obsessive, avoidant of difficult situations',
  },
  {
    key: 'composure',
    label: 'Composure',
    lowLabel: 'Anxious',
    highLabel: 'Arrogant',
    lowDesc: 'Anxious, hyper-reactive, self-doubting',
    balancedDesc: 'Stable, responsive, able to solve problems',
    highDesc: 'Careless, lacking empathy, alienating',
  },
  {
    key: 'physicality',
    label: 'Physicality',
    lowLabel: 'Weak',
    highLabel: 'Overtaxed',
    lowDesc: 'Tired, tense, slow',
    balancedDesc: 'Relaxed, energized, moving',
    highDesc: 'Physically stressed, too narrowly focused, at risk of burnout',
  },
  {
    key: 'connectivity',
    label: 'Connectivity',
    lowLabel: 'Avoidant',
    highLabel: 'Distracted',
    lowDesc: 'Negative, awkward, pessimistic, lonely',
    balancedDesc: 'Sociable, affectionate, community-focused',
    highDesc: 'Over-extended, delusional, codependent',
  },
];

const valueLabel = (val) => {
  if (val === -1) return 'Low';
  if (val === 1) return 'High';
  return 'Balanced';
};

const valueColor = (val) => {
  if (val === -1) return 'error.main';
  if (val === 1) return 'warning.main';
  return 'success.main';
};

const metricColors = {
  energy: '#ff7300',
  mood: '#8884d8',
  composure: '#82ca9d',
  physicality: '#1976d2',
  connectivity: '#e91e63',
};

export default function MentalHealth() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('energy');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    energy: '',
    mood: '',
    composure: '',
    physicality: '',
    connectivity: '',
    notes: '',
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  const fetchEntries = useCallback(async () => {
    try {
      const response = await axios.get('/api/mental-health');
      setEntries(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching mental health entries:', err);
      setError('Failed to load mental health data');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    const existing = entries.find((e) => e.date === formData.date);
    if (existing) {
      setFormData((prev) => ({
        ...prev,
        energy: existing.energy ?? '',
        mood: existing.mood ?? '',
        composure: existing.composure ?? '',
        physicality: existing.physicality ?? '',
        connectivity: existing.connectivity ?? '',
        notes: existing.notes ?? '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        energy: '',
        mood: '',
        composure: '',
        physicality: '',
        connectivity: '',
        notes: '',
      }));
    }
  }, [formData.date, entries]);

  const handleToggleChange = (metric) => (_, newValue) => {
    if (newValue !== null) {
      setFormData((prev) => ({ ...prev, [metric]: newValue }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/mental-health', formData);
      fetchEntries();
      setFormData((prev) => ({
        ...prev,
        energy: '',
        mood: '',
        composure: '',
        physicality: '',
        connectivity: '',
        notes: '',
      }));
      showSnackbar('Mental health entry saved!');
    } catch (err) {
      console.error('Error saving mental health entry:', err);
      showSnackbar('Failed to save entry', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await axios.delete(`/api/mental-health/${id}`);
      fetchEntries();
      showSnackbar('Entry deleted');
    } catch (error) {
      showSnackbar('Failed to delete entry', 'error');
    }
  };

  const handleMetricChange = (e) => {
    setSelectedMetric(e.target.value);
  };

  const chartData = useMemo(() => {
    const data = entries
      .slice()
      .reverse()
      .map((e) => ({
        date: e.date,
        value: e[selectedMetric],
      }))
      .filter(
        (d) => d.value !== null && d.value !== undefined && d.value !== ''
      );
    return data;
  }, [entries, selectedMetric]);

  const yDomain = [-1, 1];

  const renderMetricToggle = (metric) => (
    <Box key={metric.key} sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {metric.label}
      </Typography>
      <ToggleButtonGroup
        value={formData[metric.key]}
        exclusive
        onChange={handleToggleChange(metric.key)}
        size="small"
        fullWidth
        color="primary"
      >
        <ToggleButton
          value={-1}
          sx={{
            flex: 1,
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
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Mental Health
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
              Daily Check-In
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
              {metrics.map(renderMetricToggle)}
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={2}
                value={formData.notes}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
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
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="metric-select-label">Metric</InputLabel>
                <Select
                  labelId="metric-select-label"
                  value={selectedMetric}
                  label="Metric"
                  onChange={handleMetricChange}
                >
                  {metrics.map((m) => (
                    <MenuItem key={m.key} value={m.key}>
                      {m.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1, minHeight: 200 }}>
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={formatDateTick}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={yDomain}
                      tick={{ fontSize: 11 }}
                      ticks={[-1, 0, 1]}
                      tickFormatter={(v) => valueLabel(v)}
                    />
                    <Tooltip
                      formatter={(v) => [
                        valueLabel(v),
                        metrics.find((m) => m.key === selectedMetric)?.label,
                      ]}
                      labelFormatter={(l) => `Date: ${l}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={
                        metrics.find((m) => m.key === selectedMetric)?.label
                      }
                      stroke={metricColors[selectedMetric] || '#1976d2'}
                      activeDot={{ r: 8 }}
                      dot={{ r: 3 }}
                      strokeWidth={2}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography color="text.secondary">
                    {chartData.length === 1
                      ? 'Need at least 2 entries to show a chart'
                      : 'No data yet. Start tracking!'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Metric Descriptions
        </Typography>
        <Grid container spacing={2}>
          {metrics.map((m) => (
            <Grid key={m.key} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {m.label}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                  <b>Low:</b> {m.lowDesc}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                  <b>Balanced:</b> {m.balancedDesc}
                </Typography>
                <Typography variant="caption" display="block">
                  <b>High:</b> {m.highDesc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ mt: 3, maxHeight: 600 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              {metrics.map((m) => (
                <TableCell key={m.key} align="center">
                  {m.label}
                </TableCell>
              ))}
              <TableCell>Notes</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id} hover>
                <TableCell sx={{ fontWeight: 'bold' }}>{e.date}</TableCell>
                {metrics.map((m) => (
                  <TableCell key={m.key} align="center">
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={valueColor(e[m.key])}
                    >
                      {e[m.key] !== null && e[m.key] !== undefined
                        ? valueLabel(e[m.key])
                        : '-'}
                    </Typography>
                  </TableCell>
                ))}
                <TableCell
                  sx={{
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {e.notes || '-'}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(e.id)}
                    aria-label="delete entry"
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
