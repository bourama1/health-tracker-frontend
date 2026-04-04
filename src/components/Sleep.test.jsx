import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import Sleep from './Sleep';
import api from '../api';

jest.mock('../api');

const mockSleepHistory = [
  {
    id: 1,
    date: '2023-10-20',
    bedtime: '23:30',
    wake_time: '07:30',
    rhr: 58,
    deep_sleep_minutes: 85,
    rem_sleep_minutes: 110,
    light_minutes: 240,
    awake_minutes: 45,
  },
  {
    id: 2,
    date: '2023-10-21',
    bedtime: '23:00',
    wake_time: '07:00',
    rhr: 56,
    deep_sleep_minutes: 95,
    rem_sleep_minutes: 125,
    light_minutes: 250,
    awake_minutes: 30,
  },
];

describe('Sleep Component', () => {
  beforeEach(() => {
    api.get.mockResolvedValue({ data: mockSleepHistory });
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
    expect(screen.getByText('1:25')).toBeInTheDocument();
    expect(screen.getByText('1:50')).toBeInTheDocument();
    expect(screen.getByText('4:00')).toBeInTheDocument();
    expect(screen.getByText('0:45')).toBeInTheDocument();

    expect(screen.getByText('2023-10-21')).toBeInTheDocument();
  });

  test('submits sleep form correctly', async () => {
    api.post.mockResolvedValue({
      data: { message: 'Sleep data saved successfully' },
    });
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
    fireEvent.change(screen.getByLabelText(/Deep \(h:mm\)/i), {
      target: { value: '1:40' },
    });
    fireEvent.change(screen.getByLabelText(/REM \(h:mm\)/i), {
      target: { value: '2:10' },
    });
    fireEvent.change(screen.getByLabelText(/Light \(h:mm\)/i), {
      target: { value: '4:30' },
    });
    fireEvent.change(screen.getByLabelText(/Awake \(h:mm\)/i), {
      target: { value: '0:45' },
    });

    const saveButton = screen.getByRole('button', { name: /Save Entry/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/sleep',
        expect.objectContaining({
          date: '2023-10-22',
          bedtime: '22:30',
          wake_time: '06:30',
          rhr: '54',
          deep_sleep_minutes: 100,
          rem_sleep_minutes: 130,
          light_minutes: 270,
          awake_minutes: 45,
        })
      );
    });
  });
});
