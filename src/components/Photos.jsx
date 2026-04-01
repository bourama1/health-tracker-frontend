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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import axios from '../api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Photos() {
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
  
  // Selection state
  const [selectedPhotos, setSelectedPhotos] = useState({
    front: null, // { id, baseUrl }
    side: null,
    back: null,
  });

  // Picker state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // 'front', 'side', or 'back'
  const [googlePhotos, setGooglePhotos] = useState([]);
  const [isLoadingGooglePhotos, setIsLoadingGooglePhotos] = useState(false);

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

  const openPicker = async (target) => {
    setPickerTarget(target);
    setIsPickerOpen(true);
    setIsLoadingGooglePhotos(true);
    try {
      const response = await axios.get('/api/photos/google-photos');
      setGooglePhotos(response.data.mediaItems || []);
    } catch (error) {
      console.error('Error fetching Google Photos:', error);
    } finally {
      setIsLoadingGooglePhotos(false);
    }
  };

  const selectPhoto = (photo) => {
    setSelectedPhotos({
      ...selectedPhotos,
      [pickerTarget]: { id: photo.id, baseUrl: photo.baseUrl }
    });
    setIsPickerOpen(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      date: uploadDate,
      front_google_id: selectedPhotos.front?.id,
      side_google_id: selectedPhotos.side?.id,
      back_google_id: selectedPhotos.back?.id,
    };

    try {
      await axios.post('/api/photos', payload);
      alert('Photos saved successfully');
      fetchDates();
      if (uploadDate === selectedDate1) fetchPhotos(selectedDate1, setPhotos1);
      if (uploadDate === selectedDate2) fetchPhotos(selectedDate2, setPhotos2);
      setSelectedPhotos({ front: null, side: null, back: null });
    } catch (error) {
      console.error('Error saving photos:', error);
      alert('Save failed');
    }
  };

  const ImageBox = ({ path, side, maxHeight = 'none' }) => {
    // Determine if the path is a full URL or a relative path
    const isFullUrl = path?.startsWith('http');
    const src = isFullUrl ? path : (path ? `/${path}` : null);

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
          Connect to Google Photos
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          To use this feature, you need to sign in with your Google account.
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
        Progress Photos (Google Photos)
      </Typography>

      <Grid container spacing={3}>
        {/* Selection Section - 1/3 of the width */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Select Photos
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
                  <Typography variant="subtitle2" gutterBottom sx={{ textTransform: 'capitalize' }}>
                    {side} Photo
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {selectedPhotos[side] ? (
                      <Box
                        component="img"
                        src={selectedPhotos[side].baseUrl}
                        sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1 }}
                      />
                    ) : (
                      <Box sx={{ width: 60, height: 60, bgcolor: 'action.hover', borderRadius: 1 }} />
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => openPicker(side)}
                      sx={{ textTransform: 'none' }}
                    >
                      {selectedPhotos[side] ? 'Change' : 'Pick Photo'}
                    </Button>
                  </Box>
                </Box>
              ))}

              <Button
                variant="contained"
                type="submit"
                color="primary"
                fullWidth
                disabled={!selectedPhotos.front && !selectedPhotos.side && !selectedPhotos.back}
              >
                Save Selection
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

      {/* Google Photo Picker Dialog */}
      <Dialog open={isPickerOpen} onClose={() => setIsPickerOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Select {pickerTarget} Photo</DialogTitle>
        <DialogContent dividers>
          {isLoadingGooglePhotos ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={1}>
              {googlePhotos.map((photo) => (
                <Grid size={{ xs: 4, sm: 3 }} key={photo.id}>
                  <Box
                    component="img"
                    src={`${photo.baseUrl}=w300`}
                    sx={{
                      width: '100%',
                      aspectRatio: '1',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      borderRadius: 1,
                      border: '2px solid transparent',
                      '&:hover': {
                        borderColor: 'primary.main',
                        opacity: 0.8
                      }
                    }}
                    onClick={() => selectPhoto(photo)}
                  />
                </Grid>
              ))}
              {googlePhotos.length === 0 && (
                <Typography variant="body1" sx={{ p: 2 }}>
                  No photos found in your Google Photos library.
                </Typography>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPickerOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
