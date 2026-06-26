import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  IconButton,
  Snackbar,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import axios from '../api';

const MEAL_NAMES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const MACRO_COLORS = {
  protein: '#8884d8',
  carbohydrates: '#82ca9d',
  fat: '#ff7300',
};

const PIE_COLORS = ['#8884d8', '#82ca9d', '#ff7300', '#ffc658'];

const macroDefs = [
  { key: 'protein', label: 'Protein', unit: 'g', color: MACRO_COLORS.protein },
  {
    key: 'carbohydrates',
    label: 'Carbs',
    unit: 'g',
    color: MACRO_COLORS.carbohydrates,
  },
  { key: 'fat', label: 'Fat', unit: 'g', color: MACRO_COLORS.fat },
  { key: 'fiber', label: 'Fiber', unit: 'g', color: '#ffc658' },
  { key: 'sugar', label: 'Sugar', unit: 'g', color: '#e91e63' },
];

const EMPTY_FORM = {
  meal_name: 'Breakfast',
  food_name: '',
  energy_value: '',
  protein: '',
  carbohydrates: '',
  fat: '',
  fiber: '',
  sugar: '',
  serving_size: '',
  serving_unit: '',
};

export default function Nutrition() {
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
    .toISOString()
    .split('T')[0];

  const [meals, setMeals] = useState([]);
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState('daily');

  // Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  // MFP state
  const [mfpUsername, setMfpUsername] = useState('');
  const [mfpFrom, setMfpFrom] = useState(thirtyDaysAgo);
  const [mfpTo, setMfpTo] = useState(todayStr);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  const fetchMeals = useCallback(async () => {
    try {
      const [mealRes, summaryRes] = await Promise.all([
        axios.get(`/api/nutrition/diary?from=${thirtyDaysAgo}&to=${todayStr}`),
        axios.get(
          `/api/nutrition/summary?from=${thirtyDaysAgo}&to=${todayStr}`
        ),
      ]);
      setMeals(mealRes.data.items || []);
      setDiaries(summaryRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching nutrition data:', err);
      setError('Failed to load nutrition data');
      setLoading(false);
    }
  }, [thirtyDaysAgo, todayStr]);

  // Load saved MFP username
  useEffect(() => {
    axios
      .get('/api/user/settings')
      .then((res) => {
        if (res.data.mfp_username) setMfpUsername(res.data.mfp_username);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  // Filter meals for selected date
  const dayMeals = useMemo(
    () => meals.filter((m) => m.date === selectedDate),
    [meals, selectedDate]
  );

  // Daily totals for the selected date
  const dayTotals = useMemo(() => {
    const t = {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
    };
    dayMeals.forEach((m) => {
      const nc = m.nutritional_contents || {};
      t.calories += nc.energy?.value || 0;
      t.protein += nc.protein || 0;
      t.carbohydrates += nc.carbohydrates || 0;
      t.fat += nc.fat || 0;
      t.fiber += nc.fiber || 0;
      t.sugar += nc.sugar || 0;
    });
    return t;
  }, [dayMeals]);

  // Chart data (uses selected date's totals for pie, or trend for bar)
  const chartData = useMemo(() => {
    if (viewMode === 'daily') {
      const macroPie = [
        { name: 'Protein', value: dayTotals.protein },
        { name: 'Carbs', value: dayTotals.carbohydrates },
        { name: 'Fat', value: dayTotals.fat },
      ].filter((d) => d.value > 0);
      return { type: 'pie', data: macroPie };
    }
    const grouped = {};
    (diaries || []).forEach((d) => {
      grouped[d.date] = {
        date: d.date,
        calories: d.calories || 0,
        protein: d.protein || 0,
        carbohydrates: d.carbohydrates || 0,
        fat: d.fat || 0,
      };
    });
    const sorted = Object.values(grouped).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    return { type: 'bar', data: sorted };
  }, [viewMode, dayTotals, diaries]);

  // Open dialog to add food
  const openAddDialog = (mealName) => {
    setFormData({
      ...EMPTY_FORM,
      meal_name: mealName || 'Breakfast',
    });
    setDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/nutrition/diary', {
        date: selectedDate,
        meal_name: formData.meal_name,
        food_name: formData.food_name,
        energy_value: Number(formData.energy_value) || 0,
        protein: Number(formData.protein) || 0,
        carbohydrates: Number(formData.carbohydrates) || 0,
        fat: Number(formData.fat) || 0,
        fiber: Number(formData.fiber) || 0,
        sugar: Number(formData.sugar) || 0,
        serving_size: Number(formData.serving_size) || 0,
        serving_unit: formData.serving_unit,
      });
      fetchMeals();
      setDialogOpen(false);
      setFormData({ ...EMPTY_FORM });
      showSnackbar('Meal saved!');
    } catch (err) {
      showSnackbar('Failed to save meal', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await axios.delete(`/api/nutrition/diary/${id}`);
      fetchMeals();
      showSnackbar('Entry deleted');
    } catch (error) {
      showSnackbar('Failed to delete entry', 'error');
    }
  };

  const handleMfpImport = async () => {
    if (!mfpUsername) {
      showSnackbar('Enter your MFP username', 'warning');
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const res = await axios.post('/api/nutrition/mfp/import', {
        username: mfpUsername,
        from: mfpFrom,
        to: mfpTo,
      });
      setImportResult(res.data);
      showSnackbar(res.data.message);
      fetchMeals();
    } catch (err) {
      const msg = err.response?.data?.error || 'Import failed';
      showSnackbar(msg, 'error');
      setImportResult({ error: msg });
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="h4">Nutrition</Typography>
        <TextField
          label="Date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          size="small"
          InputLabelProps={{ shrink: true }}
          sx={{ width: 180 }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
        {/* Left: Food list grouped by meal */}
        <Grid
          size={{ xs: 12, md: 5 }}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {/* Summary Card */}
          <Paper sx={{ p: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography variant="h6">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString(
                  'en-US',
                  { weekday: 'short', month: 'short', day: 'numeric' }
                )}
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {Math.round(dayTotals.calories)}{' '}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  kcal
                </Typography>
              </Typography>
            </Box>
            <Grid container spacing={1}>
              {[
                { key: 'protein', label: 'P', color: MACRO_COLORS.protein },
                {
                  key: 'carbohydrates',
                  label: 'C',
                  color: MACRO_COLORS.carbohydrates,
                },
                { key: 'fat', label: 'F', color: MACRO_COLORS.fat },
                { key: 'fiber', label: 'Fib', color: '#ffc658' },
                { key: 'sugar', label: 'Sug', color: '#e91e63' },
              ].map((m) => (
                <Grid key={m.key} size={12 / 5}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {m.label}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" color={m.color}>
                    {Math.round(dayTotals[m.key])}g
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Meals List */}
          {MEAL_NAMES.map((name) => {
            const items = dayMeals.filter((m) => m.diary_meal === name);
            return (
              <Paper key={name} sx={{ p: 1.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    {name}
                  </Typography>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => openAddDialog(name)}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
                {items.length === 0 ? (
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ display: 'block', py: 1, textAlign: 'center' }}
                  >
                    No foods logged
                  </Typography>
                ) : (
                  items.map((m) => (
                    <Paper key={m.id} variant="outlined" sx={{ p: 1, mb: 0.5 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {m.food_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {Math.round(
                              m.nutritional_contents?.energy?.value || 0
                            )}{' '}
                            kcal
                            {m.nutritional_contents?.protein
                              ? ` · P${Math.round(m.nutritional_contents.protein)}`
                              : ''}
                            {m.nutritional_contents?.carbohydrates
                              ? ` C${Math.round(m.nutritional_contents.carbohydrates)}`
                              : ''}
                            {m.nutritional_contents?.fat
                              ? ` F${Math.round(m.nutritional_contents.fat)}`
                              : ''}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(m.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))
                )}
              </Paper>
            );
          })}

          {/* Quick Add Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openAddDialog(null)}
          >
            Add Food
          </Button>
        </Grid>

        {/* Right: Charts */}
        <Grid
          size={{ xs: 12, md: 7 }}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {/* Macro bars */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Macros
            </Typography>
            {macroDefs.map((m) => (
              <Box key={m.key} sx={{ mb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 0.5,
                  }}
                >
                  <Typography variant="caption">{m.label}</Typography>
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color={m.color}
                  >
                    {Math.round(dayTotals[m.key])}g
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((dayTotals[m.key] / 100) * 100, 100)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': { bgcolor: m.color },
                  }}
                />
              </Box>
            ))}
          </Paper>

          {/* Chart */}
          <Paper
            sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1 }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Typography variant="h6">
                {viewMode === 'daily' ? 'Macro Split' : 'Macro Trends'}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>View</InputLabel>
                <Select
                  value={viewMode}
                  label="View"
                  onChange={(e) => setViewMode(e.target.value)}
                >
                  <MenuItem value="daily">Daily - Pie</MenuItem>
                  <MenuItem value="trend">Trend - Bar</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1, minHeight: 200 }}>
              {chartData.type === 'pie' ? (
                chartData.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {chartData.data.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${Math.round(v)}g`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box
                    sx={{
                      height: 300,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography color="text.secondary">
                      No meals logged
                    </Typography>
                  </Box>
                )
              ) : chartData.data.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="protein"
                      name="Protein"
                      stackId="a"
                      fill={MACRO_COLORS.protein}
                    />
                    <Bar
                      dataKey="carbohydrates"
                      name="Carbs"
                      stackId="a"
                      fill={MACRO_COLORS.carbohydrates}
                    />
                    <Bar
                      dataKey="fat"
                      name="Fat"
                      stackId="a"
                      fill={MACRO_COLORS.fat}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  sx={{
                    height: 300,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography color="text.secondary">No data yet</Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* MFP Import */}
          <Paper>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudDownloadIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Import from MyFitnessPal
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Import food diary entries from a public MFP profile. Username
                  will be saved for auto-sync.
                </Typography>
                <Grid container spacing={2} alignItems="flex-end">
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      label="MFP Username"
                      value={mfpUsername}
                      onChange={(e) => setMfpUsername(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      label="From"
                      type="date"
                      value={mfpFrom}
                      onChange={(e) => setMfpFrom(e.target.value)}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      label="To"
                      type="date"
                      value={mfpTo}
                      onChange={(e) => setMfpTo(e.target.value)}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleMfpImport}
                      disabled={importing}
                      startIcon={
                        importing ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <CloudDownloadIcon />
                        )
                      }
                    >
                      {importing ? 'Importing...' : 'Import'}
                    </Button>
                  </Grid>
                </Grid>
                {importResult && (
                  <Box sx={{ mt: 2 }}>
                    {importResult.error ? (
                      <Alert severity="error">{importResult.error}</Alert>
                    ) : (
                      <Alert severity="success">
                        Imported {importResult.total_imported} entries
                        {importResult.total_skipped > 0
                          ? ` (${importResult.total_skipped} duplicates skipped)`
                          : ''}
                      </Alert>
                    )}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Food Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Food - {selectedDate}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }} required>
              <InputLabel>Meal</InputLabel>
              <Select
                name="meal_name"
                value={formData.meal_name}
                label="Meal"
                onChange={handleInputChange}
              >
                {MEAL_NAMES.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Food Name"
              name="food_name"
              value={formData.food_name}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Calories"
              name="energy_value"
              type="number"
              value={formData.energy_value}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={4}>
                <TextField
                  fullWidth
                  label="Protein (g)"
                  name="protein"
                  type="number"
                  value={formData.protein}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid size={4}>
                <TextField
                  fullWidth
                  label="Carbs (g)"
                  name="carbohydrates"
                  type="number"
                  value={formData.carbohydrates}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid size={4}>
                <TextField
                  fullWidth
                  label="Fat (g)"
                  name="fat"
                  type="number"
                  value={formData.fat}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Fiber (g)"
                  name="fiber"
                  type="number"
                  value={formData.fiber}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Sugar (g)"
                  name="sugar"
                  type="number"
                  value={formData.sugar}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Servings"
                  name="serving_size"
                  type="number"
                  value={formData.serving_size}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Unit"
                  name="serving_unit"
                  value={formData.serving_unit}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
