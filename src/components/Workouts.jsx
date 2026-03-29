import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

export default function Workouts() {
  const [plans, setPlans] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDay, setSelectedPlanDay] = useState(null);
  const [sessionLogs, setSessionLogs] = useState({}); // { exercise_id: [ { weight, reps }, ... ] }
  const [history, setHistory] = useState([]);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);

  // New Plan State
  const [newPlan, setNewPlan] = useState({ name: '', description: '', days: [{ name: 'Day 1', exercises: [] }] });

  useEffect(() => {
    fetchPlans();
    fetchHistory();
    fetchExercises();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/api/workouts/plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchExercises = async () => {
    try {
      const response = await axios.get('/api/workouts/exercises');
      setExercises(response.data);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/workouts/sessions');
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleCreatePlan = async () => {
    try {
      await axios.post('/api/workouts/plans', newPlan);
      alert('Plan created successfully!');
      setIsCreatingPlan(false);
      fetchPlans();
      setNewPlan({ name: '', description: '', days: [{ name: 'Day 1', exercises: [] }] });
    } catch (error) {
      alert('Failed to create plan');
    }
  };

  const addDayToNewPlan = () => {
    setNewPlan(prev => ({
      ...prev,
      days: [...prev.days, { name: `Day ${prev.days.length + 1}`, exercises: [] }]
    }));
  };

  const addExerciseToDay = (dayIndex, exercise) => {
    const updatedDays = [...newPlan.days];
    updatedDays[dayIndex].exercises.push({
      exercise_id: exercise.id,
      name: exercise.name,
      sets: 3,
      reps: 10,
      weight: 0
    });
    setNewPlan({ ...newPlan, days: updatedDays });
  };

  const handlePlanChange = (event) => {
    const plan = plans.find(p => p.id === event.target.value);
    setSelectedPlan(plan);
    setSelectedPlanDay(null);
    setSessionLogs({});
  };

  const handleDaySelect = (day) => {
    setSelectedPlanDay(day);
    // Initialize logs with default values from plan
    const initialLogs = {};
    day.exercises.forEach(ex => {
      initialLogs[ex.exercise_id] = Array.from({ length: ex.sets || 3 }, () => ({
        weight: ex.weight || '',
        reps: ex.reps || ''
      }));
    });
    setSessionLogs(initialLogs);
  };

  const handleLogChange = (exerciseId, setIndex, field, value) => {
    setSessionLogs(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((set, i) => 
        i === setIndex ? { ...set, [field]: value } : set
      )
    }));
  };

  const handleSaveSession = async () => {
    if (!selectedDay) return;

    const logs = [];
    Object.keys(sessionLogs).forEach(exerciseId => {
      sessionLogs[exerciseId].forEach((set, index) => {
        if (set.weight !== '' && set.reps !== '') {
          logs.push({
            exercise_id: exerciseId,
            set_number: index + 1,
            weight: parseFloat(set.weight),
            reps: parseInt(set.reps)
          });
        }
      });
    });

    try {
      await axios.post('/api/workouts/sessions', {
        day_id: selectedDay.id,
        date: new Date().toISOString().split('T')[0],
        logs: logs
      });
      alert('Session saved successfully!');
      setSelectedPlanDay(null);
      fetchHistory();
    } catch (error) {
      alert('Failed to save session');
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Workout Tracking</Typography>
        <Button variant="contained" color="secondary" onClick={() => setIsCreatingPlan(!isCreatingPlan)}>
          {isCreatingPlan ? 'View Workouts' : 'Create New Plan'}
        </Button>
      </Box>

      {isCreatingPlan ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Create New Workout Plan</Typography>
          <TextField 
            fullWidth label="Plan Name" sx={{ mb: 2 }} 
            value={newPlan.name} onChange={(e) => setNewPlan({...newPlan, name: e.target.value})} 
          />
          <TextField 
            fullWidth label="Description" sx={{ mb: 3 }} 
            value={newPlan.description} onChange={(e) => setNewPlan({...newPlan, description: e.target.value})} 
          />

          {newPlan.days.map((day, dIdx) => (
            <Box key={dIdx} sx={{ mb: 4, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <TextField 
                label={`Day ${dIdx + 1} Name`} size="small" sx={{ mb: 2 }}
                value={day.name} onChange={(e) => {
                  const days = [...newPlan.days];
                  days[dIdx].name = e.target.value;
                  setNewPlan({...newPlan, days});
                }}
              />
              <Typography variant="subtitle2">Exercises in this day:</Typography>
              <Box sx={{ mb: 2 }}>
                {day.exercises.map((ex, eIdx) => (
                  <Box key={eIdx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    <Typography sx={{ minWidth: 150 }}>{ex.name}</Typography>
                    <TextField 
                      label="Sets" size="small" type="number" sx={{ width: 70 }}
                      value={ex.sets} onChange={(e) => {
                        const days = [...newPlan.days];
                        days[dIdx].exercises[eIdx].sets = e.target.value;
                        setNewPlan({...newPlan, days});
                      }}
                    />
                    <TextField 
                      label="Reps" size="small" type="number" sx={{ width: 70 }}
                      value={ex.reps} onChange={(e) => {
                        const days = [...newPlan.days];
                        days[dIdx].exercises[eIdx].reps = e.target.value;
                        setNewPlan({...newPlan, days});
                      }}
                    />
                  </Box>
                ))}
              </Box>

              <FormControl fullWidth size="small">
                <InputLabel>Add Exercise</InputLabel>
                <Select value="" label="Add Exercise" onChange={(e) => addExerciseToDay(dIdx, exercises.find(ex => ex.id === e.target.value))}>
                  {exercises.map(ex => (
                    <MenuItem key={ex.id} value={ex.id}>{ex.name} ({ex.primary_muscles})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          ))}

          <Button variant="outlined" sx={{ mr: 2 }} onClick={addDayToNewPlan}>Add Another Day</Button>
          <Button variant="contained" onClick={handleCreatePlan}>Save Entire Plan</Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Start a Workout
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Workout Plan</InputLabel>
              <Select
                value={selectedPlan?.id || ''}
                label="Select Workout Plan"
                onChange={handlePlanChange}
              >
                {plans.map(plan => (
                  <MenuItem key={plan.id} value={plan.id}>{plan.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedPlan && !selectedDay && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>Choose Workout Day:</Typography>
                <Grid container spacing={1}>
                  {selectedPlan.days.map(day => (
                    <Grid item key={day.id}>
                      <Button variant="outlined" onClick={() => handleDaySelect(day)}>
                        {day.name}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {selectedDay && (
              <Box>
                <Typography variant="h6" color="primary" gutterBottom>
                  {selectedDay.name} - {new Date().toLocaleDateString()}
                </Typography>
                {selectedDay.exercises.map(ex => (
                  <Box key={ex.exercise_id} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold">{ex.name}</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Set</TableCell>
                            <TableCell>Weight (kg)</TableCell>
                            <TableCell>Reps</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sessionLogs[ex.exercise_id]?.map((set, i) => (
                            <TableRow key={i}>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={set.weight}
                                  onChange={(e) => handleLogChange(ex.exercise_id, i, 'weight', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={set.reps}
                                  onChange={(e) => handleLogChange(ex.exercise_id, i, 'reps', e.target.value)}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ))}
                <Button variant="contained" fullWidth onClick={handleSaveSession}>
                  Finish & Save Workout
                </Button>
                <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={() => setSelectedPlanDay(null)}>
                  Cancel
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Workout History</Typography>
          {history.map(session => (
            <Accordion key={session.id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{session.date} - {session.day_name}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Exercise</TableCell>
                        <TableCell align="right">Sets</TableCell>
                        <TableCell align="right">Max Weight</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Simple summary: list exercises and their sets */}
                      {Object.values(session.logs.reduce((acc, log) => {
                        if (!acc[log.exercise_id]) {
                          acc[log.exercise_id] = { name: log.exercise_name, count: 0, maxWeight: 0 };
                        }
                        acc[log.exercise_id].count++;
                        acc[log.exercise_id].maxWeight = Math.max(acc[log.exercise_id].maxWeight, log.weight);
                        return acc;
                      }, {})).map((ex, i) => (
                        <TableRow key={i}>
                          <TableCell>{ex.name}</TableCell>
                          <TableCell align="right">{ex.count}</TableCell>
                          <TableCell align="right">{ex.maxWeight} kg</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}
        </Grid>
      </Grid>
      )}
    </Box>
  );
}
