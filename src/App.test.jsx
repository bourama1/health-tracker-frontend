import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import api from './api';

jest.mock('./api');

test('renders dashboard title', async () => {
  api.get.mockImplementation((url) => {
    if (url === '/api/auth/status') {
      return Promise.resolve({ data: { authenticated: true } });
    }
    return Promise.resolve({ data: [] });
  });
  render(<App />);
  const linkElement = await screen.findByText(/Personal Health Dashboard/i);
  expect(linkElement).toBeInTheDocument();
});

test('navigates to different tabs', async () => {
  api.get.mockImplementation((url) => {
    if (url === '/api/auth/status') {
      return Promise.resolve({ data: { authenticated: true } });
    }
    return Promise.resolve({ data: [] });
  });
  render(<App />);

  // Default tab is Workouts
  expect(await screen.findByText(/Workout Tracking/i)).toBeInTheDocument();

  // Click on Measurements tab
  const measurementsTab = screen.getByRole('button', { name: /Measurements/i });
  fireEvent.click(measurementsTab);
  expect(await screen.findByText(/Body Measurements/i)).toBeInTheDocument();

  // Click on Photos tab
  const photosTab = screen.getByRole('button', { name: /Photos/i });
  fireEvent.click(photosTab);
  expect(await screen.findByText(/Progress Photos/i)).toBeInTheDocument();

  // Click on Sleep tab
  const sleepTab = screen.getByRole('button', { name: /Sleep/i });
  fireEvent.click(sleepTab);
  expect(await screen.findByText(/Sleep Tracking/i)).toBeInTheDocument();
});
