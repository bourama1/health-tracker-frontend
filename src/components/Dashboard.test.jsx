import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import api from '../api';

jest.mock('../api');

const mockSleep = [
  {
    id: 1,
    date: new Date().toLocaleDateString('en-CA'),
    bedtime: '22:00',
    wake_time: '06:00',
    rhr: 60,
    deep_sleep_minutes: 90,
    rem_sleep_minutes: 90,
    light_minutes: 300,
    awake_minutes: 30,
  },
];

const mockMeasurements = [
  {
    id: 1,
    date: new Date().toLocaleDateString('en-CA'),
    bodyweight: 80,
    body_fat: 15,
    waist: 85,
    chest: 100,
    biceps: 35,
  },
];

const mockWorkouts = [
  {
    id: 1,
    date: new Date().toLocaleDateString('en-CA'),
    day_name: 'Leg Day',
    plan_name: 'PPL',
    logs: [
      { exercise_id: '1', exercise_name: 'Squat', weight: 100, reps: 5 },
      { exercise_id: '1', exercise_name: 'Squat', weight: 100, reps: 5 },
    ],
  },
];

const mockPlans = [
  {
    id: 1,
    name: 'PPL',
    days: [{ id: 1, name: 'Leg Day', exercises: [] }],
  },
];

const mockPhotoDates = [{ date: new Date().toLocaleDateString('en-CA') }];

describe('Dashboard Component', () => {
  beforeEach(() => {
    api.get.mockImplementation((url) => {
      if (url === '/api/sleep') return Promise.resolve({ data: mockSleep });
      if (url === '/api/measurements')
        return Promise.resolve({ data: mockMeasurements });
      if (url.includes('/api/workouts/sessions'))
        return Promise.resolve({ data: mockWorkouts });
      if (url === '/api/workouts/plans')
        return Promise.resolve({ data: mockPlans });
      if (url === '/api/photos/dates')
        return Promise.resolve({ data: mockPhotoDates });
      return Promise.resolve({ data: [] });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard with calendar and data', async () => {
    render(<Dashboard onNavigate={() => {}} />);

    // Month name should be visible
    const monthName = new Date().toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    expect(await screen.findByText(monthName)).toBeInTheDocument();

    // Data details should be visible
    expect(screen.getByText('Leg Day')).toBeInTheDocument();
    expect(screen.getByText('80kg')).toBeInTheDocument();
    expect(screen.getByText('8:00')).toBeInTheDocument();
  });

  test('opens measurements dialog', async () => {
    render(<Dashboard onNavigate={() => {}} />);

    // Use aria-label to find the button
    const editButton = await screen.findByRole('button', {
      name: /Edit measurements/i,
    });
    fireEvent.click(editButton);

    expect(screen.getByText(/Measurements —/i)).toBeInTheDocument();
  });

  test('opens photos dialog', async () => {
    render(<Dashboard onNavigate={() => {}} />);

    // Use aria-label to find the button
    const editButton = await screen.findByRole('button', {
      name: /Edit photos/i,
    });
    fireEvent.click(editButton);

    expect(screen.getByText(/Upload Photos —/i)).toBeInTheDocument();
  });

  test('handles sleep sync', async () => {
    api.post.mockResolvedValue({ data: { message: 'Synced' } });
    render(<Dashboard onNavigate={() => {}} />);

    const syncButton = await screen.findByRole('button', { name: /Sync Fit/i });
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/fit/sync-sleep')
      );
    });
  });
});
