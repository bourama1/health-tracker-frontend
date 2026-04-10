import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import Measurements from './Measurements';
import api from '../api';

jest.mock('../api');

// Mock Recharts
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
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

const mockHistory = [
  {
    id: 1,
    date: '2023-01-01',
    bodyweight: 80,
    body_fat: 15,
    chest: 100,
    waist: 85,
    biceps: 35,
    forearm: 28,
    calf: 38,
    thigh: 60,
  },
  {
    id: 2,
    date: '2023-01-15',
    bodyweight: 79,
    body_fat: 14.5,
    chest: 99,
    waist: 84,
    biceps: 35.5,
    forearm: 28.5,
    calf: 38.5,
    thigh: 60.5,
  },
];

describe('Measurements Component', () => {
  beforeEach(() => {
    api.get.mockResolvedValue({ data: mockHistory });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders history table with data including new fields', async () => {
    await act(async () => {
      render(<Measurements />);
    });

    const dateElement = await screen.findByText('2023-01-01');
    expect(dateElement).toBeInTheDocument();

    // Check for the data values - they appear in the document (may appear multiple times in sparklines)
    expect(screen.getAllByText('100').length).toBeGreaterThan(0);
    expect(screen.getAllByText('85').length).toBeGreaterThan(0);
    expect(screen.getAllByText('35').length).toBeGreaterThan(0);
    expect(screen.getAllByText('28').length).toBeGreaterThan(0);
    expect(screen.getAllByText('38').length).toBeGreaterThan(0);
    expect(screen.getAllByText('60').length).toBeGreaterThan(0);
  });

  test('submits form correctly with new fields', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    await act(async () => {
      render(<Measurements />);
    });

    fireEvent.change(screen.getByLabelText(/Weight/i), {
      target: { value: '82' },
    });
    fireEvent.change(screen.getByLabelText(/Forearm/i), {
      target: { value: '29' },
    });
    fireEvent.change(screen.getByLabelText(/Calf/i), {
      target: { value: '39' },
    });
    fireEvent.change(screen.getByLabelText(/Thigh/i), {
      target: { value: '61' },
    });

    const saveButton = screen.getByRole('button', { name: /Save Entry/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/measurements',
        expect.objectContaining({
          bodyweight: '82',
          forearm: '29',
          calf: '39',
          thigh: '61',
        })
      );
    });
  });

  test('renders graph and allows switching measurement type', async () => {
    await act(async () => {
      render(<Measurements />);
    });

    // Get all line charts and use the first one (main chart, not sparklines)
    const lineCharts = await screen.findAllByTestId('line-chart');
    expect(lineCharts.length).toBeGreaterThan(0);

    // Default measurement is Bodyweight (kg) — check among all rendered line elements
    const linesBefore = screen.getAllByTestId('line-element');
    expect(linesBefore.some((el) => el.textContent === 'Bodyweight (kg)')).toBe(
      true
    );

    // Switch to Body Fat (%)
    const select = screen.getByRole('combobox', {
      name: /Select Measurement/i,
    });
    fireEvent.mouseDown(select);

    const option = await screen.findByRole('option', { name: 'Body Fat (%)' });
    await act(async () => {
      fireEvent.click(option);
    });

    const linesAfter = screen.getAllByTestId('line-element');
    expect(linesAfter.some((el) => el.textContent === 'Body Fat (%)')).toBe(
      true
    );
  });

  test('handles form submission error', async () => {
    window.alert = jest.fn();
    api.post.mockRejectedValue(new Error('Server Error'));
    await act(async () => {
      render(<Measurements />);
    });

    fireEvent.change(screen.getByLabelText(/Weight/i), {
      target: { value: '82' },
    });

    const saveButton = screen.getByRole('button', { name: /Save Entry/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to save measurement');
    });
  });
});
