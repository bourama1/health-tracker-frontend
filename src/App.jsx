import React, { useState } from 'react';
import { 
  Box, Drawer, AppBar, CssBaseline, Toolbar, List, Typography, 
  Divider, ListItem, ListItemButton, ListItemIcon, ListItemText 
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import StraightenIcon from '@mui/icons-material/Straighten';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import BedtimeIcon from '@mui/icons-material/Bedtime';

const drawerWidth = 240;

export default function App() {
  const [activeTab, setActiveTab] = useState('Workouts');

  // Placeholder components for the 4 main sections
  const renderContent = () => {
    switch (activeTab) {
      case 'Workouts':
        return <Typography variant="h4">Workout & Step Tracking</Typography>;
      case 'Measurements':
        return <Typography variant="h4">Body Measurements</Typography>;
      case 'Photos':
        return <Typography variant="h4">Progress Photos Comparison</Typography>;
      case 'Sleep':
        return <Typography variant="h4">Sleep & Recovery Tracking</Typography>;
      default:
        return <Typography variant="h4">Welcome</Typography>;
    }
  };

  const menuItems = [
    { text: 'Workouts', icon: <FitnessCenterIcon /> },
    { text: 'Measurements', icon: <StraightenIcon /> },
    { text: 'Photos', icon: <PhotoCameraIcon /> },
    { text: 'Sleep', icon: <BedtimeIcon /> }
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Personal Health Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
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
  );
}