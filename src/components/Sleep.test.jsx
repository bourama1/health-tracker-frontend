import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Sleep from './Sleep';
import axios from 'axios';

jest.mock('axios');

const mockSleepHistory = [
  {
    id: 1,
    date: '2023-10-20',
    bedtime: '23:30',
    wake_time: '07:30',
    rhr: 58,
    sleep_score: 82,
    deep_sleep_minutes: 85,
    rem_sleep_minutes: 110,
  },
  {
    id: 2,
    date: '2023-10-21',
    bedtime: '23:00',
    wake_time: '07:00',
    rhr: 56,
    sleep_score: 88,
    deep_sleep_minutes: 95,
    rem_sleep_minutes: 125,
  },
];

describe('Sleep Component', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockSleepHistory });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders sleep history table with data', async () => {
    await act(async () => {
      render(<Sleep />);
    });

    expect(await screen.findByText('2023-10-20')).toBeInTheDocument();
    expect(screen.getByText('23:30')).toBeInTheDocument();
    expect(screen.getByText('07:30')).toBeInTheDocument();
    expect(screen.getByText('58')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('1:25')).toBeInTheDocument();
    expect(screen.getByText('1:50')).toBeInTheDocument();

    expect(screen.getByText('2023-10-21')).toBeInTheDocument();
    expect(screen.getByText('88')).toBeInTheDocument();
  });

  test('submits sleep form correctly', async () => {
    axios.post.mockResolvedValue({ data: { message: 'Sleep data saved successfully' } });
    await act(async () => {
      render(<Sleep />);
    });

    fireEvent.change(screen.getByLabelText(/Date/i), {
      target: { value: '2023-10-22' },
    });
    fireEvent.change(screen.getByLabelText(/Bedtime/i), {
      target: { value: '22:30' },
    });
    fireEvent.change(screen.getByLabelText(/Wake Time/i), {
      target: { value: '06:30' },
    });
    fireEvent.change(screen.getByLabelText(/RHR/i), {
      target: { value: '54' },
    });
    fireEvent.change(screen.getByLabelText(/Sleep Score/i), {
      target: { value: '92' },
    });
    fireEvent.change(screen.getByLabelText(/Deep Sleep/i), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByLabelText(/REM Sleep/i), {
      target: { value: '130' },
    });

    const saveButton = screen.getByRole('button', { name: /Save Entry/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/sleep',
        expect.objectContaining({
          date: '2023-10-22',
          bedtime: '22:30',
          wake_time: '06:30',
          rhr: '54',
          sleep_score: '92',
          deep_sleep_minutes: '100',
          rem_sleep_minutes: '130',
        })
      );
    });
  });
});
