import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from '@mui/material';
import axios from '../api';

export default function Photos() {
  const [dates, setDates] = useState([]);
  const [selectedDate1, setSelectedDate1] = useState('');
  const [selectedDate2, setSelectedDate2] = useState('');
  const [photos1, setPhotos1] = useState(null);
  const [photos2, setPhotos2] = useState(null);
  const [uploadDate, setUploadDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [files, setFiles] = useState({
    front: null,
    side: null,
    back: null,
  });

  const fetchDates = useCallback(async () => {
    try {
      const response = await axios.get('/api/photos/dates');
      setDates(response.data.map((d) => d.date));
    } catch (error) {
      console.error('Error fetching dates:', error);
    }
  }, []);

  const fetchPhotos = useCallback(async (date, setPhotos) => {
    if (!date) {
      setPhotos(null);
      return;
    }
    try {
      const response = await axios.get(`/api/photos/${date}`);
      setPhotos(response.data);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  }, []);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  useEffect(() => {
    fetchPhotos(selectedDate1, setPhotos1);
  }, [selectedDate1, fetchPhotos]);

  useEffect(() => {
    fetchPhotos(selectedDate2, setPhotos2);
  }, [selectedDate2, fetchPhotos]);

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('date', uploadDate);
    if (files.front) formData.append('front', files.front);
    if (files.side) formData.append('side', files.side);
    if (files.back) formData.append('back', files.back);

    try {
      await axios.post('/api/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Photos uploaded successfully');
      fetchDates();
      if (uploadDate === selectedDate1) fetchPhotos(selectedDate1, setPhotos1);
      if (uploadDate === selectedDate2) fetchPhotos(selectedDate2, setPhotos2);
      setFiles({ front: null, side: null, back: null });
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Upload failed');
    }
  };

  const ImageBox = ({ path, side, maxHeight = 'none' }) => (
    <Box sx={{ width: '100%', mb: 2, textAlign: 'center' }}>
      <Typography
        variant="caption"
        display="block"
        align="center"
        sx={{ fontWeight: 'bold', mb: 0.5, color: 'text.secondary' }}
      >
        {side.toUpperCase()}
      </Typography>
      {path ? (
        <Box
          component="img"
          src={`/${path}`}
          alt={side}
          sx={{
            width: '100%',
            height: 'auto',
            maxHeight: maxHeight,
            objectFit: 'contain',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            display: 'block',
            margin: '0 auto',
            boxShadow: 1,
          }}
        />
      ) : (
        <Box
          sx={{
            bgcolor: 'action.hover',
            aspectRatio: '3/4',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            No Image
          </Typography>
        </Box>
      )}
    </Box>
  );

  const renderSingleView = () => (
    <Box sx={{ mt: 1 }}>
      <Typography variant="h6" align="center" gutterBottom>
        {selectedDate1}
      </Typography>
      <Grid container spacing={2}>
        {['front', 'side', 'back'].map((side) => (
          <Grid size={4} key={side}>
            <ImageBox
              path={photos1?.[`${side}_path`]}
              side={side}
              maxHeight={600}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderComparisonView = () => (
    <Box sx={{ mt: 1 }}>
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid size={6}>
          <Typography
            variant="h6"
            align="center"
            sx={{ fontWeight: 'bold', color: 'primary.main' }}
          >
            {selectedDate1}
          </Typography>
        </Grid>
        <Grid size={6}>
          <Typography
            variant="h6"
            align="center"
            sx={{ fontWeight: 'bold', color: 'primary.main' }}
          >
            {selectedDate2}
          </Typography>
        </Grid>
      </Grid>
      <Divider sx={{ mb: 2 }} />
      {['front', 'side', 'back'].map((side) => (
        <Grid container spacing={3} key={side} sx={{ mb: 4 }}>
          <Grid size={6}>
            <ImageBox
              path={photos1?.[`${side}_path`]}
              side={side}
              maxHeight={800}
            />
          </Grid>
          <Grid size={6}>
            <ImageBox
              path={photos2?.[`${side}_path`]}
              side={side}
              maxHeight={800}
            />
          </Grid>
        </Grid>
      ))}
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Progress Photos
      </Typography>

      <Grid container spacing={3}>
        {/* Upload Section - 1/3 of the width */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upload Photos
            </Typography>
            <form onSubmit={handleUpload}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={uploadDate}
                onChange={(e) => setUploadDate(e.target.value)}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
                required
              />
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 1, textTransform: 'none' }}
              >
                {files.front
                  ? `Front: ${files.front.name}`
                  : 'Select Front Photo'}
                <input
                  type="file"
                  name="front"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 1, textTransform: 'none' }}
              >
                {files.side ? `Side: ${files.side.name}` : 'Select Side Photo'}
                <input
                  type="file"
                  name="side"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 2, textTransform: 'none' }}
              >
                {files.back ? `Back: ${files.back.name}` : 'Select Back Photo'}
                <input
                  type="file"
                  name="back"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              <Button
                variant="contained"
                type="submit"
                color="primary"
                fullWidth
              >
                Save Photos
              </Button>
            </form>
          </Paper>
        </Grid>

        {/* View & Compare Section - 2/3 of the width */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2, minHeight: 400 }}>
            <Grid container spacing={2}>
              <Grid size={6}>
                <FormControl fullWidth>
                  <InputLabel id="date1-label">Date 1</InputLabel>
                  <Select
                    labelId="date1-label"
                    id="date1-select"
                    value={selectedDate1}
                    label="Date 1"
                    onChange={(e) => setSelectedDate1(e.target.value)}
                  >
                    <MenuItem value="">Select a date</MenuItem>
                    {dates.map((date) => (
                      <MenuItem key={date} value={date}>
                        {date}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={6}>
                <FormControl fullWidth disabled={!selectedDate1}>
                  <InputLabel id="date2-label">Date 2 (Compare)</InputLabel>
                  <Select
                    labelId="date2-label"
                    id="date2-select"
                    value={selectedDate2}
                    label="Date 2 (Compare)"
                    onChange={(e) => setSelectedDate2(e.target.value)}
                  >
                    <MenuItem value="">None</MenuItem>
                    {dates.map((date) => (
                      <MenuItem key={date} value={date}>
                        {date}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {!selectedDate1 ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 300,
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Please select a date to view photos.
                </Typography>
              </Box>
            ) : selectedDate2 ? (
              renderComparisonView()
            ) : (
              renderSingleView()
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
