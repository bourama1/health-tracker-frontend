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

export default function Measurements() {
  const [history, setHistory] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    bodyweight: '',
    body_fat: '',
    chest: '',
    waist: '',
    biceps: '',
  });

  // Fetch history on load
  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/measurements');
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/measurements', formData);
      fetchHistory(); // Refresh table
      // Reset numeric fields only
      setFormData({
        ...formData,
        bodyweight: '',
        body_fat: '',
        chest: '',
        waist: '',
        biceps: '',
      });
    } catch (error) {
      alert('Failed to save measurements');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Body Measurements
      </Typography>

      <Grid container spacing={3}>
        {/* Form Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Add New Entry
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
                label="Weight (kg)"
                name="bodyweight"
                type="number"
                value={formData.bodyweight}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Body Fat %"
                name="body_fat"
                type="number"
                value={formData.body_fat}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Chest (cm)"
                name="chest"
                type="number"
                value={formData.chest}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Waist (cm)"
                name="waist"
                type="number"
                value={formData.waist}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Biceps (cm)"
                name="biceps"
                type="number"
                value={formData.biceps}
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

        {/* History Table Section */}
        <Grid item xs={12} md={8}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Weight</TableCell>
                  <TableCell align="right">Fat %</TableCell>
                  <TableCell align="right">Chest</TableCell>
                  <TableCell align="right">Waist</TableCell>
                  <TableCell align="right">Biceps</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell align="right">{row.bodyweight}</TableCell>
                    <TableCell align="right">{row.body_fat}%</TableCell>
                    <TableCell align="right">{row.chest}</TableCell>
                    <TableCell align="right">{row.waist}</TableCell>
                    <TableCell align="right">{row.biceps}</TableCell>
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
