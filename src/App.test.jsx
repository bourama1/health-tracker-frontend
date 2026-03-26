import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import axios from 'axios';

jest.mock('axios');

test('renders dashboard title', () => {
  axios.get.mockResolvedValue({ data: [] });
  render(<App />);
  const linkElement = screen.getByText(/Personal Health Dashboard/i);
  expect(linkElement).toBeInTheDocument();
});

test('navigates to different tabs', () => {
  axios.get.mockResolvedValue({ data: [] });
  render(<App />);

  // Default tab is Workouts
  expect(screen.getByText(/Workout & Step Tracking/i)).toBeInTheDocument();

  // Click on Measurements tab
  const measurementsTab = screen.getByRole('button', { name: /Measurements/i });
  fireEvent.click(measurementsTab);
  expect(screen.getByText(/Body Measurements/i)).toBeInTheDocument();

  // Click on Photos tab
  const photosTab = screen.getByRole('button', { name: /Photos/i });
  fireEvent.click(photosTab);
  expect(screen.getByText(/Progress Photos Comparison/i)).toBeInTheDocument();

  // Click on Sleep tab
  const sleepTab = screen.getByRole('button', { name: /Sleep/i });
  fireEvent.click(sleepTab);
  expect(screen.getByText(/Sleep & Recovery Tracking/i)).toBeInTheDocument();
});
