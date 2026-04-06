import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  within,
} from '@testing-library/react';
import ExerciseLibrary from './ExerciseLibrary';
import axios from '../api';

jest.mock('../api');

const mockFilters = {
  muscles: ['Chest', 'Back', 'Legs'],
  equipment: ['Dumbbell', 'Barbell', 'Machine'],
  levels: ['beginner', 'intermediate', 'expert'],
  categories: ['strength', 'stretching'],
  mechanics: ['compound', 'isolation'],
};

const mockExercises = Array.from({ length: 50 }, (_, i) => ({
  id: `ex${i + 1}`,
  name: `Exercise ${i + 1}`,
  level: i % 3 === 0 ? 'beginner' : 'intermediate',
  primary_muscles: i % 2 === 0 ? 'Chest' : 'Back',
  equipment: 'Dumbbell',
  mechanic: 'compound',
}));

describe('ExerciseLibrary Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    axios.get.mockImplementation((url) => {
      if (url === '/api/workouts/exercises/filters') {
        return Promise.resolve({ data: mockFilters });
      }
      if (url === '/api/workouts/exercises') {
        return Promise.resolve({ data: mockExercises });
      }
      if (url.startsWith('/api/workouts/exercises/')) {
        const id = url.split('/').pop();
        const ex = mockExercises.find((e) => e.id === id) || mockExercises[0];
        return Promise.resolve({
          data: {
            ...ex,
            instructions: ['Step 1', 'Step 2'],
            images: ['img1.jpg', 'img2.jpg'],
          },
        });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('renders search and filters, and fetches data', async () => {
    render(<ExerciseLibrary />);

    expect(
      screen.getByPlaceholderText(/Search exercises, muscles…/i)
    ).toBeInTheDocument();

    // Muscles filters (quick pills)
    await waitFor(() => {
      expect(screen.getByText('Chest')).toBeInTheDocument();
    });

    expect(await screen.findByText('Exercise 1')).toBeInTheDocument();
  });

  test('search functionality with debounce', async () => {
    render(<ExerciseLibrary />);

    const searchInput = screen.getByPlaceholderText(
      /Search exercises, muscles…/i
    );
    fireEvent.change(searchInput, { target: { value: 'Bench' } });

    // Should not have called API immediately
    expect(axios.get).not.toHaveBeenCalledWith(
      '/api/workouts/exercises',
      expect.objectContaining({
        params: expect.objectContaining({ search: 'Bench' }),
      })
    );

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        '/api/workouts/exercises',
        expect.objectContaining({
          params: expect.objectContaining({ search: 'Bench' }),
        })
      );
    });
  });

  test('quick muscle filter chips', async () => {
    render(<ExerciseLibrary />);

    const chestChip = await screen.findByRole('button', { name: 'Chest' });
    fireEvent.click(chestChip);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        '/api/workouts/exercises',
        expect.objectContaining({
          params: expect.objectContaining({ muscle: 'Chest' }),
        })
      );
    });
  });

  test('pagination functionality', async () => {
    render(<ExerciseLibrary />);

    await screen.findByText('Exercise 1');

    // PAGE_SIZE is 48, total is 50. Should have 2 pages.
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    const nextBtn = screen.getByText('Next →');
    fireEvent.click(nextBtn);

    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(screen.getByText('Exercise 49')).toBeInTheDocument();
  });

  test('opening ExerciseDetail dialog', async () => {
    render(<ExerciseLibrary />);

    const exerciseCard = await screen.findByText('Exercise 1');
    fireEvent.click(exerciseCard);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/workouts/exercises/ex1');
    });

    expect(await screen.findByText('Instructions')).toBeInTheDocument();

    // Two "close" buttons exist: an icon button (aria-label="close") and a text "Close" button.
    // Use the icon button specifically to avoid ambiguity.
    const dialog = screen.getByRole('dialog');
    const closeBtn = within(dialog).getByRole('button', { name: 'close' });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Instructions')).not.toBeInTheDocument();
    });
  });
});
