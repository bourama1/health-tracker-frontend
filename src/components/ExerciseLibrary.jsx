import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import Body from '../vendor/body-highlighter';
import axios from '../api';

// ─── Muscle chip colours ─────────────────────────────────────────────────────

const MUSCLE_COLORS = {
  chest: '#e57373',
  shoulders: '#ff8a65',
  biceps: '#ffb74d',
  triceps: '#ffd54f',
  forearms: '#fff176',
  abdominals: '#aed581',
  lats: '#4fc3f7',
  'middle back': '#4dd0e1',
  'lower back': '#4db6ac',
  traps: '#81c784',
  quadriceps: '#9575cd',
  hamstrings: '#7986cb',
  glutes: '#f06292',
  calves: '#a1887f',
  neck: '#90a4ae',
  adductors: '#ce93d8',
  abductors: '#f48fb1',
};

const BODY_MAP_MAPPING = {
  'trapezius-left-front': 'traps',
  'trapezius-right-front': 'traps',
  'trapezius-left-back': 'traps',
  'trapezius-right-back': 'traps',
  'upper-back-left': 'middle back',
  'upper-back-right': 'middle back',
  'lower-back-left': 'lower back',
  'lower-back-right': 'lower back',
  'chest-left': 'chest',
  'chest-right': 'chest',
  'biceps-left': 'biceps',
  'biceps-right': 'biceps',
  'triceps-left-front': 'triceps',
  'triceps-right-front': 'triceps',
  'triceps-left-back': 'triceps',
  'triceps-right-back': 'triceps',
  'forearm-left-front': 'forearms',
  'forearm-right-front': 'forearms',
  'forearm-left-back': 'forearms',
  'forearm-right-back': 'forearms',
  'deltoids-left-front': 'shoulders',
  'deltoids-right-front': 'shoulders',
  'deltoids-left-back': 'shoulders',
  'deltoids-right-back': 'shoulders',
  'abs-upper': 'abdominals',
  'abs-lower': 'abdominals',
  'obliques-left': 'abdominals',
  'obliques-right': 'abdominals',
  'adductors-left-front': 'adductors',
  'adductors-right-front': 'adductors',
  'adductors-left-back': 'adductors',
  'adductors-right-back': 'adductors',
  'hamstring-left': 'hamstrings',
  'hamstring-right': 'hamstrings',
  'quadriceps-left': 'quadriceps',
  'quadriceps-right': 'quadriceps',
  'calves-left-front': 'calves',
  'calves-right-front': 'calves',
  'calves-left-back': 'calves',
  'calves-right-back': 'calves',
  'gluteal-left': 'glutes',
  'gluteal-right': 'glutes',
  'neck-left-front': 'neck',
  'neck-right-front': 'neck',
  'neck-left-back': 'neck',
  'neck-right-back': 'neck',
};

function BodyMapFilter({ selectedMuscle, onMuscleClick, muscles }) {
  const [view, setView] = useState('front');
  const theme = useTheme();

  // Highlight muscles that map to the selected muscle
  const data = selectedMuscle
    ? Object.keys(BODY_MAP_MAPPING)
        .filter(
          (slug) => BODY_MAP_MAPPING[slug] === selectedMuscle.toLowerCase()
        )
        .map((slug) => ({
          slug: slug,
          intensity: 1,
        }))
    : [];

  const handleModelClick = (b) => {
    const slug = b.slug;
    const mapped = BODY_MAP_MAPPING[slug];
    if (mapped) {
      // Find the actual muscle name from filters to maintain case
      const actualMuscle = (muscles || []).find(
        (m) => m.toLowerCase() === mapped.toLowerCase()
      );
      onMuscleClick(actualMuscle || mapped);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          alignItems: 'center',
        }}
      >
        <Box sx={{ flexShrink: 0, textAlign: 'center' }}>
          <Typography variant="subtitle2" gutterBottom>
            Body Map Explorer
          </Typography>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, v) => v && setView(v)}
            size="small"
            sx={{
              mb: 2,
              '& .MuiToggleButton-root': {
                borderColor: 'divider',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                },
              },
            }}
          >
            <ToggleButton value="front">Front</ToggleButton>
            <ToggleButton value="back">Back</ToggleButton>
          </ToggleButtonGroup>
          <Box
            sx={{
              width: 200,
              height: 320,
              mx: 'auto',
              // Note: teambuildr component uses SVG Path internally, so hover styling might need adjustment
              '& path': { cursor: 'pointer', transition: 'fill 0.2s' },
              '& path:hover': { opacity: 0.7 },
            }}
          >
            <Body
              side={view}
              data={data}
              onBodyPartPress={handleModelClick}
              colors={['#2196f3', '#2196f3']}
              scale={0.8}
              theme={theme.palette.mode}
            />
          </Box>
        </Box>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ display: { xs: 'none', md: 'block' } }}
        />

        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: 'block' }}
          >
            Click a muscle on the body to filter, or select from the list:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {(muscles || []).map((m) => {
              const active = selectedMuscle === m;
              const color = MUSCLE_COLORS[m?.toLowerCase()] || '#90a4ae';
              return (
                <Chip
                  key={m}
                  label={m}
                  size="small"
                  onClick={() => onMuscleClick(m)}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: active ? color : 'transparent',
                    color: active ? '#fff' : color,
                    borderColor: color,
                    border: '1px solid',
                    fontWeight: active ? 700 : 400,
                    fontSize: '0.7rem',
                    '&:hover': { opacity: 0.85 },
                  }}
                />
              );
            })}
          </Box>
          {selectedMuscle && (
            <Button
              size="small"
              onClick={() => onMuscleClick(selectedMuscle)}
              sx={{ mt: 1.5 }}
              color="inherit"
            >
              Clear Muscle Filter
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

function MuscleChip({ muscle, isPrimary }) {
  const color = MUSCLE_COLORS[muscle?.toLowerCase()] || '#90a4ae';
  return (
    <Chip
      label={muscle}
      size="small"
      sx={{
        bgcolor: isPrimary ? color : 'transparent',
        color: isPrimary ? '#fff' : color,
        borderColor: color,
        border: isPrimary ? 'none' : '1px solid',
        fontWeight: isPrimary ? 600 : 400,
        fontSize: '0.7rem',
        height: 20,
        mr: 0.4,
        mb: 0.4,
      }}
    />
  );
}

// ─── Level badge ─────────────────────────────────────────────────────────────

const LEVEL_COLOR = {
  beginner: 'success',
  intermediate: 'warning',
  expert: 'error',
};

// ─── Exercise Detail Dialog ──────────────────────────────────────────────────

function ExerciseDetail({ exerciseId, open, onClose, onAddToDay }) {
  const [ex, setEx] = useState(null);
  useEffect(() => {
    if (!open || !exerciseId) return;
    setEx(null);
    axios
      .get(`/api/workouts/exercises/${exerciseId}`)
      .then((r) => setEx(r.data))
      .catch(console.error);
  }, [open, exerciseId]);

  const IMAGE_BASE =
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
    >
      {!ex ? (
        <DialogContent
          sx={{ display: 'flex', justifyContent: 'center', py: 6 }}
        >
          <CircularProgress />
        </DialogContent>
      ) : (
        <>
          <DialogTitle sx={{ pr: 6 }}>
            {ex.name}
            <IconButton
              onClick={onClose}
              sx={{ position: 'absolute', right: 8, top: 8 }}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {/* Images */}
            {ex.images && ex.images.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  mb: 2,
                  overflow: 'hidden',
                  borderRadius: 1,
                }}
              >
                {ex.images.slice(0, 2).map((img, i) => (
                  <Box
                    key={i}
                    component="img"
                    src={`${IMAGE_BASE}${img}`}
                    alt={`${ex.name} ${i + 1}`}
                    sx={{
                      width: '50%',
                      borderRadius: 1,
                      objectFit: 'cover',
                      maxHeight: 180,
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Meta chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
              {ex.level && (
                <Chip
                  label={ex.level}
                  size="small"
                  color={LEVEL_COLOR[ex.level] || 'default'}
                />
              )}
              {ex.category && (
                <Chip label={ex.category} size="small" variant="outlined" />
              )}
              {ex.mechanic && (
                <Chip label={ex.mechanic} size="small" variant="outlined" />
              )}
              {ex.force && (
                <Chip
                  label={`force: ${ex.force}`}
                  size="small"
                  variant="outlined"
                />
              )}
              {ex.equipment && (
                <Chip
                  label={ex.equipment}
                  size="small"
                  icon={<FitnessCenterIcon sx={{ fontSize: 14 }} />}
                  variant="outlined"
                />
              )}
            </Box>

            {/* Muscles */}
            <Typography variant="subtitle2" gutterBottom>
              Primary Muscles
            </Typography>
            <Box sx={{ mb: 1 }}>
              {(ex.primary_muscles || '')
                .split(',')
                .map((m) => m.trim())
                .filter(Boolean)
                .map((m, i) => (
                  <MuscleChip key={i} muscle={m} isPrimary />
                ))}
            </Box>
            {ex.secondary_muscles && ex.secondary_muscles.trim() && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Secondary Muscles
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {ex.secondary_muscles
                    .split(',')
                    .map((m) => m.trim())
                    .filter(Boolean)
                    .map((m, i) => (
                      <MuscleChip key={i} muscle={m} isPrimary={false} />
                    ))}
                </Box>
              </>
            )}

            {/* Instructions */}
            {ex.instructions && ex.instructions.length > 0 && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Instructions
                </Typography>
                <Box component="ol" sx={{ pl: 2.5, mt: 0 }}>
                  {(Array.isArray(ex.instructions)
                    ? ex.instructions
                    : [ex.instructions]
                  ).map((step, i) => (
                    <Typography
                      key={i}
                      component="li"
                      variant="body2"
                      sx={{ mb: 0.8, lineHeight: 1.5 }}
                    >
                      {step}
                    </Typography>
                  ))}
                </Box>
              </>
            )}
          </DialogContent>
          {onAddToDay && (
            <DialogActions>
              <Button
                onClick={() => {
                  onAddToDay(ex);
                  onClose();
                }}
                variant="contained"
              >
                Add to Workout Day
              </Button>
              <Button onClick={onClose}>Close</Button>
            </DialogActions>
          )}
          {!onAddToDay && (
            <DialogActions>
              <Button onClick={onClose}>Close</Button>
            </DialogActions>
          )}
        </>
      )}
    </Dialog>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

function ExerciseCard({ exercise, onClick, onAdd, showAdd }) {
  const primaryMuscles = (exercise.primary_muscles || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  const secondaryMuscles = (exercise.secondary_muscles || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);

  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 1.5,
        cursor: 'pointer',
        height: '100%',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        '&:hover': { borderColor: 'primary.main', boxShadow: 2 },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 0.5,
        }}
      >
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ lineHeight: 1.3, flex: 1, mr: 1 }}
        >
          {exercise.name}
        </Typography>
        {exercise.level && (
          <Chip
            label={exercise.level}
            size="small"
            color={LEVEL_COLOR[exercise.level] || 'default'}
            sx={{ fontSize: '0.6rem', height: 18, flexShrink: 0 }}
          />
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          flex: 1,
          alignContent: 'flex-start',
        }}
      >
        {primaryMuscles.map((m, i) => (
          <MuscleChip key={i} muscle={m} isPrimary />
        ))}
        {secondaryMuscles.slice(0, 2).map((m, i) => (
          <MuscleChip key={i} muscle={m} isPrimary={false} />
        ))}
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 0.5,
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ maxWidth: '70%' }}
        >
          {[exercise.equipment, exercise.mechanic].filter(Boolean).join(' · ')}
        </Typography>
        {showAdd && (
          <Tooltip title="Add to day">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onAdd(exercise);
              }}
              sx={{ p: 0.3 }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>
                +
              </span>
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
}

// ─── Main ExerciseLibrary ─────────────────────────────────────────────────────

export default function ExerciseLibrary({ onAddExercise, showAdd = false }) {
  const [exercises, setExercises] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    muscle: '',
    equipment: '',
    level: '',
    mechanic: '',
    force: '',
    category: '',
  });
  const [detailId, setDetailId] = useState(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 48;

  // Fetch filter options once
  useEffect(() => {
    axios
      .get('/api/workouts/exercises/filters')
      .then((r) => setFilters(r.data))
      .catch(console.error);
  }, []);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    const params = { search };
    Object.entries(activeFilters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    try {
      const r = await axios.get('/api/workouts/exercises', { params });
      setExercises(r.data);
      setPage(0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [search, activeFilters]);

  useEffect(() => {
    const timer = setTimeout(fetchExercises, 300);
    return () => clearTimeout(timer);
  }, [fetchExercises]);

  const setFilter = (key, val) =>
    setActiveFilters((prev) => ({
      ...prev,
      [key]: prev[key] === val ? '' : val,
    }));

  const clearFilters = () => {
    setActiveFilters({
      muscle: '',
      equipment: '',
      level: '',
      mechanic: '',
      force: '',
      category: '',
    });
    setSearch('');
  };

  const activeFilterCount =
    Object.values(activeFilters).filter(Boolean).length + (search ? 1 : 0);
  const paged = exercises.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(exercises.length / PAGE_SIZE);

  return (
    <Box>
      {/* Search + filter bar */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          mb: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <TextField
          size="small"
          placeholder="Search exercises, muscles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 220, flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {[
          { key: 'muscle', label: 'Muscle', options: filters.muscles },
          { key: 'equipment', label: 'Equipment', options: filters.equipment },
          { key: 'level', label: 'Level', options: filters.levels },
          { key: 'category', label: 'Category', options: filters.categories },
          { key: 'mechanic', label: 'Mechanic', options: filters.mechanics },
        ].map(({ key, label, options }) => (
          <FormControl key={key} size="small" sx={{ minWidth: 130 }}>
            <InputLabel>{label}</InputLabel>
            <Select
              value={activeFilters[key]}
              label={label}
              onChange={(e) =>
                setActiveFilters((prev) => ({ ...prev, [key]: e.target.value }))
              }
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {(options || []).map((o) => (
                <MenuItem key={o} value={o}>
                  {o}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}

        {activeFilterCount > 0 && (
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={clearFilters}
          >
            Clear ({activeFilterCount})
          </Button>
        )}
      </Box>

      {/* Body Map Filter */}
      <BodyMapFilter
        selectedMuscle={activeFilters.muscle}
        onMuscleClick={(m) => setFilter('muscle', m)}
        muscles={filters.muscles}
      />

      {/* Results count + pagination */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Loading…' : `${exercises.length} exercises`}
          {exercises.length > PAGE_SIZE &&
            ` · showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, exercises.length)}`}
        </Typography>
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button
              size="small"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </Button>
            <Typography variant="body2" sx={{ lineHeight: '30px', px: 1 }}>
              {page + 1} / {totalPages}
            </Typography>
            <Button
              size="small"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </Button>
          </Box>
        )}
      </Box>

      {/* Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : paged.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          No exercises found. Try adjusting your filters.
        </Typography>
      ) : (
        <Grid container spacing={1.5}>
          {paged.map((ex) => (
            <Grid key={ex.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <ExerciseCard
                exercise={ex}
                onClick={() => setDetailId(ex.id)}
                onAdd={onAddExercise}
                showAdd={showAdd}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Detail dialog */}
      <ExerciseDetail
        exerciseId={detailId}
        open={!!detailId}
        onClose={() => setDetailId(null)}
        onAddToDay={
          showAdd
            ? (ex) => {
                onAddExercise?.(ex);
              }
            : null
        }
      />
    </Box>
  );
}

export { ExerciseDetail };
