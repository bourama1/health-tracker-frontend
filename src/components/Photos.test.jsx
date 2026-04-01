import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import Photos from './Photos';
import axios from '../api';

jest.mock('../api');

const mockDates = [{ date: '2023-01-01' }, { date: '2023-01-15' }];
const mockPhotos = {
  date: '2023-01-01',
  front_path: 'https://lh3.googleusercontent.com/front',
  side_path: 'https://lh3.googleusercontent.com/side',
  back_path: 'https://lh3.googleusercontent.com/back',
  front_google_id: 'g1',
  side_google_id: 'g2',
  back_google_id: 'g3',
};

const mockGooglePhotos = {
  mediaItems: [
    { id: 'g1', baseUrl: 'https://lh3.googleusercontent.com/g1' },
    { id: 'g2', baseUrl: 'https://lh3.googleusercontent.com/g2' },
  ]
};

describe('Photos Component', () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/auth/status') {
        return Promise.resolve({ data: { authenticated: true } });
      }
      if (url === '/api/photos/dates') {
        return Promise.resolve({ data: mockDates });
      }
      if (url.startsWith('/api/photos/')) {
        return Promise.resolve({ data: mockPhotos });
      }
      if (url === '/api/photos/google-photos') {
        return Promise.resolve({ data: mockGooglePhotos });
      }
      return Promise.reject(new Error('not found'));
    });
    axios.post.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly and fetches dates when authenticated', async () => {
    await act(async () => {
      render(<Photos />);
    });
    expect(screen.getByText(/Progress Photos \(Google Photos\)/i)).toBeInTheDocument();

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

    expect(
      await screen.findByText('2023-01-01', { selector: 'h6' })
    ).toBeInTheDocument();

    const images = await screen.findAllByRole('img');
    // 3 images in selection preview + 3 images in view = 6
    // Actually, initially selection is empty.
    const frontImage = images.find(
      (img) => img.getAttribute('alt') === 'front'
    );
    expect(frontImage).toHaveAttribute('src', 'https://lh3.googleusercontent.com/front');
  });

  test('shows login screen when not authenticated', async () => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/auth/status') {
        return Promise.resolve({ data: { authenticated: false } });
      }
      return Promise.reject(new Error('not found'));
    });

    await act(async () => {
      render(<Photos />);
    });

    expect(screen.getByText(/Connect to Google Photos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
  });
});
