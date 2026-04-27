import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    vo2_max: 45,
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
    vo2_max: 46,
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
    render(<Measurements />);

    const dateElement = await screen.findByText('2023-01-01');
    expect(dateElement).toBeInTheDocument();

    // Check for the data values
    expect(screen.getAllByText('100').length).toBeGreaterThan(0);
    expect(screen.getAllByText('85').length).toBeGreaterThan(0);
    expect(screen.getAllByText('35').length).toBeGreaterThan(0);
    expect(screen.getAllByText('28').length).toBeGreaterThan(0);
    expect(screen.getAllByText('38').length).toBeGreaterThan(0);
    expect(screen.getAllByText('60').length).toBeGreaterThan(0);
    expect(screen.getAllByText('45').length).toBeGreaterThan(0);
  });

  test('submits form correctly with new fields', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    render(<Measurements />);

    const weightInput = await screen.findByLabelText(/Weight/i);
    const forearmInput = await screen.findByLabelText(/Forearm/i);
    const calfInput = await screen.findByLabelText(/Calf/i);
    const thighInput = await screen.findByLabelText(/Thigh/i);

    fireEvent.change(weightInput, { target: { value: '82' } });
    fireEvent.change(forearmInput, { target: { value: '29' } });
    fireEvent.change(calfInput, { target: { value: '39' } });
    fireEvent.change(thighInput, { target: { value: '61' } });

    const saveButton = screen.getByRole('button', { name: /Save Entry/i });
    fireEvent.click(saveButton);

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
    expect(
      await screen.findByText('Measurement entry saved!')
    ).toBeInTheDocument();
  });

  test('renders graph and allows switching measurement type', async () => {
    render(<Measurements />);

    // Wait for data to load
    await screen.findByText('2023-01-01');

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
    fireEvent.click(option);

    const linesAfter = screen.getAllByTestId('line-element');
    expect(linesAfter.some((el) => el.textContent === 'Body Fat (%)')).toBe(
      true
    );
  });

  test('handles form submission error', async () => {
    api.post.mockRejectedValue(new Error('Server Error'));
    render(<Measurements />);

    const weightInput = await screen.findByLabelText(/Weight/i);
    fireEvent.change(weightInput, { target: { value: '82' } });

    const saveButton = screen.getByRole('button', { name: /Save Entry/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to save measurement')
      ).toBeInTheDocument();
    });
  });

  test('handles entry deletion', async () => {
    window.confirm = jest.fn(() => true);
    api.delete.mockResolvedValue({ data: { success: true } });

    render(<Measurements />);

    const deleteButtons = await screen.findAllByLabelText('delete measurement');
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(api.delete).toHaveBeenCalledWith('/api/measurements/1');
    await waitFor(() => {
      expect(screen.getByText('Entry deleted')).toBeInTheDocument();
    });
  });
});
