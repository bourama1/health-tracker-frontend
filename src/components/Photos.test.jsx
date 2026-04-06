import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Photos from './Photos';
import axios from '../api';

jest.mock('../api');

const mockDates = [{ date: '2023-01-01' }, { date: '2023-01-15' }];
const mockPhotos = {
  date: '2023-01-01',
  front_path: 'https://res.cloudinary.com/demo/front',
  side_path: 'https://res.cloudinary.com/demo/side',
  back_path: 'https://res.cloudinary.com/demo/back',
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
      return Promise.reject(new Error('not found'));
    });
    axios.post.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly and fetches dates when authenticated', async () => {
    render(<Photos />);

    // Wait for auth check to complete before asserting on main UI
    expect(
      await screen.findByText(/Progress Photos \(Cloudinary\)/i)
    ).toBeInTheDocument();

    const date1Select = screen.getByLabelText(/Date 1/i);
    fireEvent.mouseDown(date1Select);

    expect(await screen.findByText('2023-01-01')).toBeInTheDocument();
    expect(await screen.findByText('2023-01-15')).toBeInTheDocument();
  });

  test('selecting a date fetches and displays photos', async () => {
    render(<Photos />);

    // Wait for auth check to complete before interacting
    const date1Select = await screen.findByRole('combobox', {
      name: /Date 1/i,
    });
    fireEvent.mouseDown(date1Select);

    const option1 = await screen.findByRole('option', { name: '2023-01-01' });
    fireEvent.click(option1);

    expect(
      await screen.findByText('2023-01-01', { selector: 'h6' })
    ).toBeInTheDocument();

    const images = await screen.findAllByRole('img');
    // 3 images in selection preview + 3 images in view = 6
    // Actually, initially selection is empty.
    const frontImage = images.find(
      (img) => img.getAttribute('alt') === 'front'
    );
    expect(frontImage).toHaveAttribute(
      'src',
      'https://res.cloudinary.com/demo/front'
    );
  });

  test('comparing two dates fetches both sets of photos', async () => {
    render(<Photos />);

    // Wait for auth check to complete before interacting
    const date1Select = await screen.findByRole('combobox', {
      name: /Date 1/i,
    });
    fireEvent.mouseDown(date1Select);
    fireEvent.click(await screen.findByRole('option', { name: '2023-01-01' }));

    const date2Select = screen.getByRole('combobox', { name: /Date 2/i });
    fireEvent.mouseDown(date2Select);
    fireEvent.click(await screen.findByRole('option', { name: '2023-01-15' }));

    expect(
      await screen.findByText('2023-01-01', { selector: 'h6' })
    ).toBeInTheDocument();
    expect(
      await screen.findByText('2023-01-15', { selector: 'h6' })
    ).toBeInTheDocument();
  });

  test('handles photo selection and upload', async () => {
    window.alert = jest.fn();
    render(<Photos />);

    // Wait for auth check to complete before interacting
    expect(await screen.findByText(/Upload New Photos/i)).toBeInTheDocument();

    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    // The inputs are hidden (display:none) — the component exposes data-testid for each
    const frontInput = screen.getByTestId('front-file-input');
    fireEvent.change(frontInput, { target: { files: [file] } });

    const uploadBtn = screen.getByRole('button', {
      name: /Upload to Cloudinary/i,
    });
    expect(uploadBtn).not.toBeDisabled();

    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/photos',
        expect.any(FormData),
        expect.any(Object)
      );
    });
    expect(window.alert).toHaveBeenCalledWith(
      'Photos uploaded successfully to Cloudinary'
    );
  });

  test('shows login screen when not authenticated', async () => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/auth/status') {
        return Promise.resolve({ data: { authenticated: false } });
      }
      return Promise.reject(new Error('not found'));
    });

    render(<Photos />);

    expect(
      await screen.findByText(/Sign in to Track Progress/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Sign in with Google/i })
    ).toBeInTheDocument();
  });
});
