import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import Sleep from './Sleep';
import api from '../api';

jest.mock('../api');

// Mock Recharts
jest.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    Line: ({ name }) => <div data-testid="line-element">{name}</div>,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    Legend: () => <div />,
  };
});

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
    api.get.mockImplementation((url) => {
      if (url === '/api/sleep')
        return Promise.resolve({ data: mockSleepHistory });
      return Promise.resolve({ data: [] });
    });
    api.post.mockResolvedValue({ data: { message: 'Success' } });
    api.delete.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders sleep history table with data', async () => {
    render(<Sleep />);

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
    render(<Sleep />);
    await screen.findByText('2023-10-20');

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
    fireEvent.click(saveButton);

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

  test('deletes a sleep entry', async () => {
    window.confirm = jest.fn(() => true);
    render(<Sleep />);

    // MUI IconButton renders as a <button>; find all error-coloured buttons in the table
    // by querying within each TableRow. Since the component renders DeleteIcon inside the
    // only <button> per row, the first button inside each row body cell is the delete action.
    const tableRows = await screen.findAllByRole('row');
    // Skip the header row (index 0); click the delete button in the first data row
    const firstDataRow = tableRows[1];
    const deleteBtn = within(firstDataRow).getByRole('button');
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this entry?'
    );
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/sleep/2');
    });
  });

  test('syncs with Google Fit', async () => {
    render(<Sleep />);
    await screen.findByText('Sleep Analysis');

    const syncBtn = screen.getByText(/Sync Google Fit/i);
    fireEvent.click(syncBtn);

    expect(screen.getByText(/Syncing…/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
    const syncCall = api.post.mock.calls.find((call) =>
      call[0].includes('/api/fit/sync-sleep')
    );
    expect(syncCall).toBeDefined();
    expect(await screen.findByText('Success')).toBeInTheDocument();
  });

  test('switches displayed statistic in trend chart', async () => {
    render(<Sleep />);

    // Get all line charts (there might be multiple) and verify at least one exists
    const lineCharts = await screen.findAllByTestId('line-chart');
    expect(lineCharts.length).toBeGreaterThan(0);

    const linesBefore = screen.getAllByTestId('line-element');
    expect(linesBefore.some((el) => el.textContent === 'RHR (bpm)')).toBe(true);

    const select = screen.getByLabelText(/Select Statistic/i);
    fireEvent.mouseDown(select);

    const option = await screen.findByRole('option', {
      name: 'Deep Sleep (mins)',
    });
    fireEvent.click(option);

    const linesAfter = screen.getAllByTestId('line-element');
    expect(
      linesAfter.some((el) => el.textContent === 'Deep Sleep (mins)')
    ).toBe(true);
  });
});
