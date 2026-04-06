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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
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

      {/* Quick muscle filter pills */}
      {filters.muscles && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {filters.muscles.map((m) => {
            const active = activeFilters.muscle === m;
            const color = MUSCLE_COLORS[m?.toLowerCase()] || '#90a4ae';
            return (
              <Chip
                key={m}
                label={m}
                size="small"
                onClick={() => setFilter('muscle', m)}
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
      )}

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
