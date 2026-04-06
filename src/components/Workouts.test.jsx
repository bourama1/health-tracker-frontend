import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Workouts from './Workouts';
import api from '../api';

jest.mock('../api');

// Mock ExerciseLibrary to decouple Workouts tests from ExerciseLibrary internals
jest.mock('./ExerciseLibrary', () => ({ onAddExercise, showAdd }) => (
  <div data-testid="mock-exercise-library">
    <button
      onClick={() =>
        onAddExercise?.({
          id: 'ex1',
          name: 'Exercise 1',
          primary_muscles: 'chest',
        })
      }
    >
      Add Exercise 1
    </button>
  </div>
));

const mockPlans = [
  {
    id: 1,
    name: 'Test Plan',
    days: [
      {
        id: 10,
        name: 'Day 1',
        exercises: [
          {
            exercise_id: 'ex1',
            name: 'Exercise 1',
            sets: 3,
            reps: 10,
            primary_muscles: 'chest',
            exercise_type: 'weighted',
          },
        ],
      },
    ],
  },
];

describe('Workouts Component', () => {
  beforeEach(() => {
    api.get.mockImplementation((url) => {
      if (url === '/api/workouts/plans')
        return Promise.resolve({ data: mockPlans });
      if (url === '/api/workouts/sessions')
        return Promise.resolve({ data: [] });
      if (url === '/api/workouts/stats')
        return Promise.resolve({
          data: {
            totalSessions: 0,
            totalSets: 0,
            totalPRs: 0,
            recentPRs: [],
            muscleVolume: [],
          },
        });
      if (url.includes('/last-for-day/'))
        return Promise.resolve({ data: null });
      if (url.includes('/exercises/suggestion/'))
        return Promise.resolve({ data: { suggested_weight: 50 } });
      return Promise.resolve({ data: [] });
    });
    api.post.mockResolvedValue({ data: { success: true } });
    api.delete.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders workout plans', async () => {
    render(<Workouts />);
    expect(screen.getByText(/Workout Tracking/i)).toBeInTheDocument();
    expect(await screen.findByText('Test Plan')).toBeInTheDocument();
  });

  test('creates a new plan using PlanBuilder', async () => {
    render(<Workouts />);

    fireEvent.click(screen.getByText(/Create New Plan/i));

    fireEvent.change(screen.getByLabelText(/Plan Name/i), {
      target: { value: 'New Strength Plan' },
    });

    fireEvent.click(screen.getByText(/Browse Exercise Library/i));
    fireEvent.click(screen.getByText('Add Exercise 1'));
    fireEvent.click(screen.getByText(/Back to Plan/i));

    expect(screen.getByText('Exercise 1')).toBeInTheDocument();

    const saveBtn = screen.getByText(/Save Plan/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/workouts/plans',
        expect.objectContaining({
          name: 'New Strength Plan',
        })
      );
    });
  });

  test('logs a session using ActiveWorkout', async () => {
    render(<Workouts />);

    // Wait for plans to load before clicking
    fireEvent.click(await screen.findByText('Test Plan'));
    fireEvent.click(await screen.findByText('Day 1'));

    expect(await screen.findByText(/Day 1 — /i)).toBeInTheDocument();

    // Weight, Reps, RPE for Set 1
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '60' } }); // weight
    fireEvent.change(inputs[1], { target: { value: '12' } }); // reps

    const finishBtn = screen.getByText(/Finish & Save/i);
    fireEvent.click(finishBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/workouts/sessions',
        expect.objectContaining({
          day_id: 10,
          logs: expect.arrayContaining([
            expect.objectContaining({ weight: 60, reps: 12 }),
          ]),
        })
      );
    });
  });

  test('renders StatsPanel with stats data', async () => {
    const mockStats = {
      totalSessions: 10,
      totalSets: 100,
      totalPRs: 5,
      recentPRs: [
        { name: 'Bench Press', weight: 100, reps: 5, date: '2023-01-01' },
      ],
      muscleVolume: [{ muscle: 'chest', volume: 5000 }],
    };
    api.get.mockImplementation((url) => {
      if (url === '/api/workouts/stats')
        return Promise.resolve({ data: mockStats });
      return Promise.resolve({ data: [] });
    });

    render(<Workouts />);

    fireEvent.click(screen.getByText('Stats'));

    expect(await screen.findByText('10')).toBeInTheDocument();
    expect(screen.getByText('Total Sessions')).toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  test('renders HistoryPanel with session data', async () => {
    const mockHistory = [
      {
        id: 1,
        date: '2023-10-25',
        day_name: 'Chest Day',
        plan_name: 'Bulk Plan',
        logs: [
          {
            exercise_id: 'ex1',
            exercise_name: 'Bench Press',
            weight: 80,
            reps: 10,
            is_pr: true,
          },
        ],
      },
    ];
    api.get.mockImplementation((url) => {
      if (url === '/api/workouts/sessions?limit=30')
        return Promise.resolve({ data: mockHistory });
      return Promise.resolve({ data: [] });
    });

    render(<Workouts />);

    fireEvent.click(screen.getByText('History'));

    expect(await screen.findByText(/2023-10-25/)).toBeInTheDocument();
    expect(await screen.findByText(/Chest Day/i)).toBeInTheDocument();
  });

  test('WeeklyVolumeSummary calculates set counts correctly', async () => {
    render(<Workouts />);

    fireEvent.click(screen.getByText(/Create New Plan/i));

    fireEvent.click(screen.getByText(/Browse Exercise Library/i));
    fireEvent.click(screen.getByText('Add Exercise 1'));
    fireEvent.click(screen.getByText(/Back to Plan/i));

    expect(await screen.findByText('3 sets')).toBeInTheDocument();
    expect(screen.getAllByText(/chest/i).length).toBeGreaterThan(0);
  });
});
