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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
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
} from 'recharts';
import axios from '../api';

export default function Measurements() {
  const [history, setHistory] = useState([]);
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

  const measurementOptions = [
    { value: 'bodyweight', label: 'Weight (kg)' },
    { value: 'body_fat', label: 'Body Fat %' },
    { value: 'chest', label: 'Chest (cm)' },
    { value: 'waist', label: 'Waist (cm)' },
    { value: 'biceps', label: 'Biceps (cm)' },
    { value: 'forearm', label: 'Forearm (cm)' },
    { value: 'calf', label: 'Calf (cm)' },
    { value: 'thigh', label: 'Thigh (cm)' },
  ];

  // Fetch history on load
  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/measurements');
      // Sort history by date for the graph
      const sortedData = response.data.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      setHistory(sortedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create a copy of the data and convert empty strings to null
    const submissionData = { ...formData };
    Object.keys(submissionData).forEach((key) => {
      if (key !== 'date' && submissionData[key] === '') {
        submissionData[key] = null;
      }
    });

    try {
      // Send the sanitized data
      await axios.post('/api/measurements', submissionData);
      fetchHistory();

      // Reset numeric fields and keep current date
      setFormData({
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
    } catch (error) {
      console.error('Submission error details:', error.response?.data);
      alert(
        `Failed to save: ${error.response?.data?.error || 'Unknown error'}`
      );
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMeasurementChange = (event) => {
    setSelectedMeasurement(event.target.value);
  };

  // Filter data for the graph (remove entries without the selected measurement)
  const chartData = history
    .filter(
      (entry) =>
        entry[selectedMeasurement] !== null && entry[selectedMeasurement] !== ''
    )
    .map((entry) => ({
      date: entry.date,
      value: parseFloat(entry[selectedMeasurement]),
    }));

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Body Measurements
      </Typography>

      <Grid container spacing={3}>
        {/* Form Section */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, mb: 3 }}>
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
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Weight (kg)"
                    name="bodyweight"
                    type="number"
                    value={formData.bodyweight}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Body Fat %"
                    name="body_fat"
                    type="number"
                    value={formData.body_fat}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Chest (cm)"
                    name="chest"
                    type="number"
                    value={formData.chest}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Waist (cm)"
                    name="waist"
                    type="number"
                    value={formData.waist}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Biceps (cm)"
                    name="biceps"
                    type="number"
                    value={formData.biceps}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Forearm (cm)"
                    name="forearm"
                    type="number"
                    value={formData.forearm}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Calf (cm)"
                    name="calf"
                    type="number"
                    value={formData.calf}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Thigh (cm)"
                    name="thigh"
                    type="number"
                    value={formData.thigh}
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

          {/* Graph Section */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Progress Graph
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="measurement-select-label">
                Select Measurement
              </InputLabel>
              <Select
                labelId="measurement-select-label"
                value={selectedMeasurement}
                label="Select Measurement"
                onChange={handleMeasurementChange}
              >
                {measurementOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
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
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* History Table Section */}
        <Grid size={{ xs: 12, md: 8 }}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Weight</TableCell>
                  <TableCell align="right">Fat %</TableCell>
                  <TableCell align="right">Chest</TableCell>
                  <TableCell align="right">Waist</TableCell>
                  <TableCell align="right">Biceps</TableCell>
                  <TableCell align="right">Forearm</TableCell>
                  <TableCell align="right">Calf</TableCell>
                  <TableCell align="right">Thigh</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...history].reverse().map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell align="right">{row.bodyweight}</TableCell>
                    <TableCell align="right">
                      {row.body_fat ? row.body_fat + '%' : ''}
                    </TableCell>
                    <TableCell align="right">{row.chest}</TableCell>
                    <TableCell align="right">{row.waist}</TableCell>
                    <TableCell align="right">{row.biceps}</TableCell>
                    <TableCell align="right">{row.forearm}</TableCell>
                    <TableCell align="right">{row.calf}</TableCell>
                    <TableCell align="right">{row.thigh}</TableCell>
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
