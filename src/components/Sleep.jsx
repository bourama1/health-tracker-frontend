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
} from '@mui/material';
import axios from 'axios';

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
      await axios.post('/api/sleep', formData);
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

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Sleep Tracking
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
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
                label="Deep Sleep (min)"
                name="deep_sleep_minutes"
                type="number"
                value={formData.deep_sleep_minutes}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="REM Sleep (min)"
                name="rem_sleep_minutes"
                type="number"
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

        <Grid item xs={12} md={8}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Bedtime</TableCell>
                  <TableCell align="right">Wake Up</TableCell>
                  <TableCell align="right">RHR</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell align="right">Deep (min)</TableCell>
                  <TableCell align="right">REM (min)</TableCell>
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
                    <TableCell align="right">{row.deep_sleep_minutes}</TableCell>
                    <TableCell align="right">{row.rem_sleep_minutes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
}
