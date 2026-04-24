import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  CircularProgress,
} from '@mui/material';
import axios from '../api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Photos({ initialDate, onDateChange }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [dates, setDates] = useState([]);
  const [selectedDate1, setSelectedDate1] = useState('');
  const [selectedDate2, setSelectedDate2] = useState('');
  const [photos1, setPhotos1] = useState(null);
  const [photos2, setPhotos2] = useState(null);
  const [uploadDate, setUploadDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isUploading, setIsUploading] = useState(false);

  // Set initial date from props if provided
  useEffect(() => {
    if (initialDate) {
      setSelectedDate1(initialDate);
      // Clear it in parent after consuming to avoid loops
      if (onDateChange) onDateChange(null);
    }
  }, [initialDate, onDateChange]);

  // Selection state for Cloudinary
  const [selectedFiles, setSelectedFiles] = useState({
    front: null,
    side: null,
    back: null,
  });

  // Preview URLs
  const [previews, setPreviews] = useState({
    front: null,
    side: null,
    back: null,
  });

  const fileInputRefs = {
    front: useRef(),
    side: useRef(),
    back: useRef(),
  };

  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get('/api/auth/status');
      setIsAuthenticated(response.data.authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

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
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDates();
    }
  }, [isAuthenticated, fetchDates]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPhotos(selectedDate1, setPhotos1);
    }
  }, [isAuthenticated, selectedDate1, fetchPhotos]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPhotos(selectedDate2, setPhotos2);
    }
  }, [isAuthenticated, selectedDate2, fetchPhotos]);

  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  const handleFileChange = (target, e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFiles((prev) => ({ ...prev, [target]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({ ...prev, [target]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    const formData = new FormData();
    formData.append('date', uploadDate);
    if (selectedFiles.front) formData.append('front', selectedFiles.front);
    if (selectedFiles.side) formData.append('side', selectedFiles.side);
    if (selectedFiles.back) formData.append('back', selectedFiles.back);

    try {
      await axios.post('/api/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Photos uploaded successfully to Cloudinary');
      fetchDates();
      if (uploadDate === selectedDate1) fetchPhotos(selectedDate1, setPhotos1);
      if (uploadDate === selectedDate2) fetchPhotos(selectedDate2, setPhotos2);

      // Reset state
      setSelectedFiles({ front: null, side: null, back: null });
      setPreviews({ front: null, side: null, back: null });
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const ImageBox = ({ path, side, maxHeight = 'none' }) => {
    const src = path; // In Cloudinary, path is the full URL

    return (
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
            src={src}
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
  };

  const renderSingleView = () => (
    <Box sx={{ mt: 1 }}>
      <Typography variant="h6" align="center" gutterBottom>
        {selectedDate1}
      </Typography>
      <Grid container spacing={2}>
        {['front', 'side', 'back'].map((side) => (
          <Grid key={side} size={4}>
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

  if (isCheckingAuth) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Sign in to Track Progress
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Use your Google account to securely store and compare your progress
          photos.
        </Typography>
        <Button variant="contained" color="primary" onClick={handleLogin}>
          Sign in with Google
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Progress Photos (Cloudinary)
      </Typography>

      <Grid container spacing={3}>
        {/* Selection Section - 1/3 of the width */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upload New Photos
            </Typography>
            <form onSubmit={handleSave}>
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

              {['front', 'side', 'back'].map((side) => (
                <Box key={side} sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ textTransform: 'capitalize' }}
                  >
                    {side} Photo
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {previews[side] ? (
                      <Box
                        component="img"
                        src={previews[side]}
                        sx={{
                          width: 60,
                          height: 60,
                          objectFit: 'cover',
                          borderRadius: 1,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                        }}
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      ref={fileInputRefs[side]}
                      onChange={(e) => handleFileChange(side, e)}
                      data-testid={`${side}-file-input`}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => fileInputRefs[side].current.click()}
                      sx={{ textTransform: 'none' }}
                    >
                      {previews[side] ? 'Change' : 'Select File'}
                    </Button>
                  </Box>
                </Box>
              ))}

              <Button
                variant="contained"
                type="submit"
                color="primary"
                fullWidth
                disabled={
                  isUploading ||
                  (!selectedFiles.front &&
                    !selectedFiles.side &&
                    !selectedFiles.back)
                }
              >
                {isUploading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Upload to Cloudinary'
                )}
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
