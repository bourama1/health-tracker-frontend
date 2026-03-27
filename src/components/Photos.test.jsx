import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Photos from './Photos';
import axios from 'axios';

jest.mock('axios');

const mockDates = [{ date: '2023-01-01' }, { date: '2023-01-15' }];
const mockPhotos = {
  date: '2023-01-01',
  front_path: 'uploads/2023-01-01-front.jpg',
  side_path: 'uploads/2023-01-01-side.jpg',
  back_path: 'uploads/2023-01-01-back.jpg',
};

describe('Photos Component', () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/photos/dates') {
        return Promise.resolve({ data: mockDates });
      }
      if (url.startsWith('/api/photos/')) {
        return Promise.resolve({ data: mockPhotos });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly and fetches dates', async () => {
    await act(async () => {
      render(<Photos />);
    });
    expect(screen.getByText(/Progress Photos/i)).toBeInTheDocument();

    const date1Select = screen.getByLabelText(/Date 1/i);
    fireEvent.mouseDown(date1Select);

    expect(await screen.findByText('2023-01-01')).toBeInTheDocument();
    expect(await screen.findByText('2023-01-15')).toBeInTheDocument();
  });

  test('selecting a date fetches and displays photos', async () => {
    await act(async () => {
      render(<Photos />);
    });

    const date1Select = screen.getByRole('combobox', { name: /Date 1/i });
    fireEvent.mouseDown(date1Select);

    const option1 = await screen.findByRole('option', { name: '2023-01-01' });
    await act(async () => {
      fireEvent.click(option1);
    });

    expect(await screen.findByText('2023-01-01', { selector: 'h6' })).toBeInTheDocument();

    const images = await screen.findAllByRole('img');
    expect(images.length).toBeGreaterThanOrEqual(3);
    const frontImage = images.find(img => img.getAttribute('alt') === 'front');
    expect(frontImage).toHaveAttribute('src', '/uploads/2023-01-01-front.jpg');
  });

  test('uploads photos correctly', async () => {
    window.alert = jest.fn();
    axios.post.mockResolvedValue({ data: { success: true } });

    let container;
    await act(async () => {
      const result = render(<Photos />);
      container = result.container;
    });

    const frontInput = container.querySelector('input[name="front"]');
    const sideInput = container.querySelector('input[name="side"]');
    const backInput = container.querySelector('input[name="back"]');

    const file = new File(['hello'], 'hello.png', { type: 'image/png' });

    await act(async () => {
      fireEvent.change(frontInput, { target: { files: [file] } });
      fireEvent.change(sideInput, { target: { files: [file] } });
      fireEvent.change(backInput, { target: { files: [file] } });
    });

    const saveButton = screen.getByRole('button', { name: /Save Photos/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Photos uploaded successfully');
    });
  });

  test('displays comparison view when two dates are selected', async () => {
    await act(async () => {
      render(<Photos />);
    });

    // Select Date 1
    const date1Select = screen.getByRole('combobox', { name: /Date 1/i });
    fireEvent.mouseDown(date1Select);
    const option1 = await screen.findByRole('option', { name: '2023-01-01' });
    await act(async () => {
      fireEvent.click(option1);
    });

    // Select Date 2
    const date2Select = screen.getByRole('combobox', { name: /Date 2 \(Compare\)/i });
    fireEvent.mouseDown(date2Select);
    const option2 = await screen.findByRole('option', { name: '2023-01-15' });
    await act(async () => {
      fireEvent.click(option2);
    });

    const dateHeaders = await screen.findAllByRole('heading', { level: 6 });
    expect(dateHeaders.some(h => h.textContent === '2023-01-01')).toBe(true);
    expect(dateHeaders.some(h => h.textContent === '2023-01-15')).toBe(true);

    const images = await screen.findAllByRole('img');
    expect(images).toHaveLength(6);
  });
});
