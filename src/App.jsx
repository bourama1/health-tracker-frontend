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
  createTheme,
  ThemeProvider,
} from '@mui/material';
import axios from './api';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import StraightenIcon from '@mui/icons-material/Straighten';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Measurements from './components/Measurements';
import Photos from './components/Photos';
import Sleep from './components/Sleep';
import Workouts from './components/Workouts';

const drawerWidth = 240;

export default function App() {
  const [activeTab, setActiveTab] = useState('Workouts');
  const [mode, setMode] = useState('dark');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/status');
        setIsAuthenticated(response.data.authenticated);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setIsAuthenticated(false);
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

  // Placeholder components for the 4 main sections
  const renderContent = () => {
    switch (activeTab) {
      case 'Workouts':
        return <Workouts />;
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
    { text: 'Workouts', icon: <FitnessCenterIcon /> },
    { text: 'Measurements', icon: <StraightenIcon /> },
    { text: 'Photos', icon: <PhotoCameraIcon /> },
    { text: 'Sleep', icon: <BedtimeIcon /> },
  ];

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
            {isAuthenticated && (
              <Button color="inherit" onClick={handleLogout} sx={{ mr: 2 }}>
                Logout
              </Button>
            )}
            <IconButton onClick={toggleColorMode} color="inherit">
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
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
