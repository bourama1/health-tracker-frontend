import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Workouts from './Workouts';
import axios from 'axios';

jest.mock('axios');

const mockExercises = [
  { id: 'ex1', name: 'Exercise 1', primary_muscles: 'chest' },
  { id: 'ex2', name: 'Exercise 2', primary_muscles: 'back' },
];

const mockPlans = [
  {
    id: 1,
    name: 'Test Plan',
    days: [
      {
        id: 10,
        name: 'Day 1',
        exercises: [{ exercise_id: 'ex1', name: 'Exercise 1', sets: 3, reps: 10 }]
      }
    ]
  }
];

describe('Workouts Component', () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/workouts/exercises') return Promise.resolve({ data: mockExercises });
      if (url === '/api/workouts/plans') return Promise.resolve({ data: mockPlans });
      if (url === '/api/workouts/sessions') return Promise.resolve({ data: [] });
      return Promise.reject(new Error('not found'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders workout plans and exercises', async () => {
    await act(async () => {
      render(<Workouts />);
    });

    expect(screen.getByText(/Workout Tracking/i)).toBeInTheDocument();
    
    // Check if plans are loaded in select
    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    expect(await screen.findByText('Test Plan')).toBeInTheDocument();
  });

  test('switches to create plan mode', async () => {
    await act(async () => {
      render(<Workouts />);
    });

    const createBtn = screen.getByText(/Create New Plan/i);
    fireEvent.click(createBtn);

    expect(screen.getByText(/Create New Workout Plan/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Plan Name/i)).toBeInTheDocument();
  });
});
