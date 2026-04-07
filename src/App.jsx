import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  CssBaseline,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
  Avatar,
  createTheme,
  ThemeProvider,
  CircularProgress,
  Paper,
} from '@mui/material';
import axios from './api';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import StraightenIcon from '@mui/icons-material/Straighten';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import GoogleIcon from '@mui/icons-material/Google';
import Measurements from './components/Measurements';
import Photos from './components/Photos';
import Sleep from './components/Sleep';
import Workouts from './components/Workouts';
import Dashboard from './components/Dashboard';

const drawerWidth = 240;
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [mode, setMode] = useState('dark');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);
  const [activeWorkoutDay, setActiveWorkoutDay] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/status');
        if (response.data.authenticated) {
          setIsAuthenticated(true);
          setUser(response.data.user);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setIsAuthenticated(false);
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode]
  );

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <Dashboard
            onNavigate={setActiveTab}
            onStartWorkout={(day) => {
              setActiveWorkoutDay(day);
              setActiveTab('Workouts');
            }}
          />
        );
      case 'Workouts':
        return (
          <Workouts
            activeDay={activeWorkoutDay}
            onActiveDayChange={setActiveWorkoutDay}
          />
        );
      case 'Measurements':
        return <Measurements />;
      case 'Photos':
        return <Photos />;
      case 'Sleep':
        return <Sleep />;
      default:
        return <Typography variant="h4">Welcome</Typography>;
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon /> },
    { text: 'Workouts', icon: <FitnessCenterIcon /> },
    { text: 'Measurements', icon: <StraightenIcon /> },
    { text: 'Photos', icon: <PhotoCameraIcon /> },
    { text: 'Sleep', icon: <BedtimeIcon /> },
  ];

  if (isCheckingAuth) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            bgcolor: 'background.default',
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            bgcolor: 'background.default',
            backgroundImage:
              'radial-gradient(circle at 2% 10%, rgba(25, 118, 210, 0.05) 0%, transparent 20%), radial-gradient(circle at 98% 90%, rgba(25, 118, 210, 0.05) 0%, transparent 20%)',
          }}
        >
          <Paper
            elevation={3}
            sx={{ p: 5, textAlign: 'center', maxWidth: 400, borderRadius: 3 }}
          >
            <Typography
              variant="h4"
              gutterBottom
              fontWeight="bold"
              color="primary"
            >
              Health Tracker
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
              Track your progress, workouts, and health data in one place.
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<GoogleIcon />}
              onClick={handleLogin}
              sx={{
                py: 1.5,
                textTransform: 'none',
                fontSize: '1.1rem',
                borderRadius: 2,
              }}
            >
              Sign in with Google
            </Button>
            <Typography
              variant="caption"
              sx={{ mt: 3, display: 'block', color: 'text.disabled' }}
            >
              Sign in to track your workouts, measurements, and progress photos.
            </Typography>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <Toolbar>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1 }}
            >
              Personal Health Dashboard
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {user && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ display: { xs: 'none', sm: 'block' } }}
                  >
                    {user.name}
                  </Typography>
                  <Avatar
                    src={user.picture}
                    alt={user.name}
                    sx={{ width: 32, height: 32 }}
                  />
                </Box>
              )}
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
              <IconButton onClick={toggleColorMode} color="inherit">
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    selected={activeTab === item.text}
                    onClick={() => setActiveTab(item.text)}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            <Divider />
          </Box>
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          {/* Active Component renders here */}
          {renderContent()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
