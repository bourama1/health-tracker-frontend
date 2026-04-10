import React, { useState, useEffect, useCallback } from 'react';
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

  const chartData = measurements
    .slice()
    .reverse()
    .map((m) => ({
      date: m.date,
      value: m[selectedMeasurement],
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
      <Typography variant="h4" gutterBottom>
        Body Measurements
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
              <Button
                type="submit"
                variant="contained"
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
              <ResponsiveContainer width="100%" height="100%">
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

        {/* List Section */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2, maxHeight: 800, overflow: 'auto' }}>
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
                      <Typography variant="body2">
                        {m[opt.value] || '-'}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
