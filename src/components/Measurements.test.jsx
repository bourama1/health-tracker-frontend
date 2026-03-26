import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Measurements from './Measurements';
import axios from 'axios';

jest.mock('axios');

const mockHistory = [
  {
    id: 1,
    date: '2023-01-01',
    bodyweight: 80,
    body_fat: 15,
    chest: 100,
    waist: 85,
    biceps: 35,
  },
];

describe('Measurements Component', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockHistory });
  });

  test('renders history table with data', async () => {
    render(<Measurements />);

    expect(await screen.findByText('2023-01-01')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
  });

  test('submits form correctly', async () => {
    axios.post.mockResolvedValue({ data: { success: true } });
    render(<Measurements />);

    fireEvent.change(screen.getByLabelText(/Weight/i), { target: { value: '82' } });
    fireEvent.change(screen.getByLabelText(/Body Fat %/i), { target: { value: '16' } });

    const saveButton = screen.getByRole('button', { name: /Save Entry/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/measurements', expect.objectContaining({
        bodyweight: '82',
        body_fat: '16',
      }));
    });
  });
});
