import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import api from '../api';

jest.mock('../api');

const testDate = new Date('2026-04-24T12:00:00');
const todayStr = '2026-04-24';

const mockSleep = [
  {
    id: 1,
    date: todayStr,
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
    date: todayStr,
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
    date: todayStr,
    day_name: 'Leg Day',
    plan_name: 'PPL',
    logs: [
      {
        exercise_id: '1',
        exercise_name: 'Squat',
        weight: 100,
        reps: 5,
        primary_muscles: 'quadriceps',
      },
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

const mockPhotoDates = [{ date: todayStr }];

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
      if (url === '/api/workouts/last-trained-muscles')
        return Promise.resolve({ data: {} });
      if (url.includes('/api/ultrahuman/sync'))
        return Promise.resolve({ data: { message: 'Synced' } });
      return Promise.resolve({ data: [] });
    });
    api.post.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard with calendar and data', async () => {
    render(<Dashboard onNavigate={() => {}} today={testDate} />);

    // Wait for data to load
    expect(await screen.findByText('Leg Day')).toBeInTheDocument();

    // Month name should be visible
    expect(screen.getByText(/April 2026/i)).toBeInTheDocument();

    // Data details should be visible
    expect(screen.getByText('80kg')).toBeInTheDocument();
    expect(screen.getByText('8:00')).toBeInTheDocument();
  });

  test('opens measurements dialog', async () => {
    render(<Dashboard onNavigate={() => {}} today={testDate} />);
    await screen.findByText('Leg Day');

    // Find "Edit" button in Measurements card using aria-label
    const editButton = await screen.findByLabelText('Edit measurements');
    fireEvent.click(editButton);

    expect(screen.getByText(/Update Measurements/i)).toBeInTheDocument();
  });

  test('opens photos dialog', async () => {
    render(<Dashboard onNavigate={() => {}} today={testDate} />);
    await screen.findByText('Leg Day');

    // Find "Edit" button in Photos card using aria-label
    const editButton = await screen.findByLabelText('Edit photos');
    fireEvent.click(editButton);

    expect(screen.getByText(/Progress Photos/i)).toBeInTheDocument();
  });

  test('handles sleep sync', async () => {
    api.post.mockResolvedValue({ data: { message: 'Synced' } });
    render(<Dashboard onNavigate={() => {}} today={testDate} />);
    await screen.findByText('Leg Day');

    const syncButton = await screen.findByRole('button', { name: /Sync Fit/i });
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/fit/sync-sleep')
      );
    });
  });
});
