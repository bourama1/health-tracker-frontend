import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Measurements from './Measurements';
import axios from 'axios';

jest.mock('axios');

// Mock Recharts
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    Line: () => <div />,
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
];

describe('Measurements Component', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockHistory });
  });

  test('renders history table with data including new fields', async () => {
    render(<Measurements />);

    expect(await screen.findByText('2023-01-01')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
    expect(screen.getByText('38')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  test('submits form correctly with new fields', async () => {
    axios.post.mockResolvedValue({ data: { success: true } });
    render(<Measurements />);

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
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
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
});
