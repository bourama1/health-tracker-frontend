import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import axios from '../api';

// Helper: minutes to H:mm
const minutesToHm = (minutes) => {
  if (minutes === null || minutes === undefined || minutes === '') return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
};

// Helper: H:mm to minutes
const hmToMinutes = (hm) => {
  if (!hm || typeof hm !== 'string' || !hm.includes(':')) return hm;
  const [h, m] = hm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return hm;
  return h * 60 + m;
};

export default function Sleep() {
  const [history, setHistory] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    bedtime: '',
    wake_time: '',
    rhr: '',
    sleep_score: '',
    deep_sleep_minutes: '',
    rem_sleep_minutes: '',
  });

  const [syncing, setSyncing] = useState(false);
  const [syncDays, setSyncDays] = useState(30);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/sleep');
      const sortedData = response.data.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      setHistory(sortedData);
    } catch (error) {
      console.error('Error fetching sleep data:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        deep_sleep_minutes: hmToMinutes(formData.deep_sleep_minutes),
        rem_sleep_minutes: hmToMinutes(formData.rem_sleep_minutes),
      };
      await axios.post('/api/sleep', dataToSubmit);
      fetchHistory();
      setFormData({
        ...formData,
        bedtime: '',
        wake_time: '',
        rhr: '',
        sleep_score: '',
        deep_sleep_minutes: '',
        rem_sleep_minutes: '',
      });
    } catch (error) {
      alert('Failed to save sleep data');
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
      // Token expired — user needs to log in again to grant Fitness scopes
      if (err.response?.status === 401) {
        showSnackbar(
          'Google session expired or Fitness permission not granted. Please log out and sign in again.',
          'warning'
        );
      } else {
        showSnackbar(msg, 'error');
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Sleep Tracking</Typography>

        {/* ── Google Fit sync controls ── */}
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

          <Tooltip title="Pull sleep data from Google Fit (synced from your Ultrahuman ring)">
            <span>
              <Button
                variant="outlined"
                startIcon={syncing ? <CircularProgress size={16} /> : <SyncIcon />}
                onClick={handleGoogleFitSync}
                disabled={syncing}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {syncing ? 'Syncing…' : 'Sync from Google Fit'}
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
              <TextField
                fullWidth
                label="RHR (bpm)"
                name="rhr"
                type="number"
                value={formData.rhr}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Sleep Score"
                name="sleep_score"
                type="number"
                value={formData.sleep_score}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Deep Sleep (h:mm)"
                name="deep_sleep_minutes"
                type="text"
                placeholder="e.g., 1:30"
                value={formData.deep_sleep_minutes}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="REM Sleep (h:mm)"
                name="rem_sleep_minutes"
                type="text"
                placeholder="e.g., 1:30"
                value={formData.rem_sleep_minutes}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
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
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Bedtime</TableCell>
                  <TableCell align="right">Wake Up</TableCell>
                  <TableCell align="right">RHR</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell align="right">Deep (h:mm)</TableCell>
                  <TableCell align="right">REM (h:mm)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...history].reverse().map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell align="right">{row.bedtime}</TableCell>
                    <TableCell align="right">{row.wake_time}</TableCell>
                    <TableCell align="right">{row.rhr}</TableCell>
                    <TableCell align="right">{row.sleep_score}</TableCell>
                    <TableCell align="right">
                      {minutesToHm(row.deep_sleep_minutes)}
                    </TableCell>
                    <TableCell align="right">
                      {minutesToHm(row.rem_sleep_minutes)}
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
