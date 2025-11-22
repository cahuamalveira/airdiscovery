import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import BookingHistoryPage from './BookingHistoryPage';
import * as useBookingHistoryModule from '../hooks/useBookingHistory';
import { BookingStatus } from '../types/booking';
import type { BookingResponseDto } from '../types/booking';

// Mock the useBookingHistory hook
vi.mock('../hooks/useBookingHistory');

// Mock BookingCard component to simplify testing
vi.mock('../components/booking/BookingCard', () => ({
  default: ({ booking }: { booking: BookingResponseDto }) => (
    <div data-testid={`booking-card-${booking.id}`}>
      <span>Booking {booking.id}</span>
      <span>{booking.status}</span>
    </div>
  ),
}));

describe('BookingHistoryPage', () => {
  const mockBookings: BookingResponseDto[] = [
    {
      id: 'booking-1',
      flightId: 'flight-1',
      userId: 'user-1',
      status: BookingStatus.PAID,
      passengers: [
        {
          firstName: 'João',
          lastName: 'Silva',
          email: 'joao@example.com',
          phone: '11999999999',
          document: '12345678901',
          birthDate: '1990-01-01',
        },
      ],
      totalAmount: 450000,
      currency: 'BRL',
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
    },
    {
      id: 'booking-2',
      flightId: 'flight-2',
      userId: 'user-1',
      status: BookingStatus.AWAITING_PAYMENT,
      passengers: [
        {
          firstName: 'Maria',
          lastName: 'Santos',
          email: 'maria@example.com',
          phone: '11988888888',
          document: '98765432109',
          birthDate: '1985-05-15',
        },
      ],
      totalAmount: 320000,
      currency: 'BRL',
      createdAt: '2024-01-15T14:30:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
    },
    {
      id: 'booking-3',
      flightId: 'flight-3',
      userId: 'user-1',
      status: BookingStatus.PAID,
      passengers: [
        {
          firstName: 'Pedro',
          lastName: 'Costa',
          email: 'pedro@example.com',
          phone: '11977777777',
          document: '11122233344',
          birthDate: '1992-03-10',
        },
      ],
      totalAmount: 280000,
      currency: 'BRL',
      createdAt: '2024-01-10T08:15:00Z',
      updatedAt: '2024-01-10T08:15:00Z',
    },
  ];

  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  describe('Loading State', () => {
    it('displays CircularProgress spinner while loading', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: [],
        isLoading: true,
        isError: false,
        error: null,
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText(/minhas reservas/i)).not.toBeInTheDocument();
    });

    it('does not display booking cards while loading', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: [],
        isLoading: true,
        isError: false,
        error: null,
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      expect(screen.queryByTestId(/booking-card/)).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error message when fetch fails', () => {
      const error = new Error('Network Error');
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: [],
        isLoading: false,
        isError: true,
        error,
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      expect(screen.getByText(/não foi possível carregar suas reservas/i)).toBeInTheDocument();
    });

    it('displays retry button on error', () => {
      const error = new Error('Network Error');
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: [],
        isLoading: false,
        isError: true,
        error,
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('calls refetch when retry button is clicked', async () => {
      const user = userEvent.setup();
      const error = new Error('Network Error');
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: [],
        isLoading: false,
        isError: true,
        error,
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
      await user.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('does not display booking cards on error', () => {
      const error = new Error('Network Error');
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: [],
        isLoading: false,
        isError: true,
        error,
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      expect(screen.queryByTestId(/booking-card/)).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('displays friendly message when no bookings exist', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: [],
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      expect(screen.getByText(/você ainda não possui reservas/i)).toBeInTheDocument();
    });

    it('displays link to flight search when no bookings exist', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: [],
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      const searchLink = screen.getByRole('link', { name: /buscar voos/i });
      expect(searchLink).toBeInTheDocument();
      expect(searchLink).toHaveAttribute('href', '/search');
    });

    it('does not display pagination controls when no bookings exist', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: [],
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      expect(screen.queryByRole('button', { name: /anterior/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /próxima/i })).not.toBeInTheDocument();
    });
  });

  describe('Successful Data Display', () => {
    it('displays list of BookingCard components', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 3,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      expect(screen.getByTestId('booking-card-booking-1')).toBeInTheDocument();
      expect(screen.getByTestId('booking-card-booking-2')).toBeInTheDocument();
      expect(screen.getByTestId('booking-card-booking-3')).toBeInTheDocument();
    });

    it('displays correct number of booking cards', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 3,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      const bookingCards = screen.getAllByTestId(/booking-card-/);
      expect(bookingCards).toHaveLength(3);
    });

    it('displays page title', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 3,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      expect(screen.getByText(/minhas reservas/i)).toBeInTheDocument();
    });

    it('does not display loading spinner when data is loaded', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 3,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('does not display error message when data is loaded', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 3,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      expect(screen.queryByText(/não foi possível carregar/i)).not.toBeInTheDocument();
    });
  });

  describe('Pagination Controls', () => {
    it('displays Previous button', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      expect(screen.getByRole('button', { name: /anterior/i })).toBeInTheDocument();
    });

    it('displays Next button', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      expect(screen.getByRole('button', { name: /próxima/i })).toBeInTheDocument();
    });

    it('displays page indicator', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      expect(screen.getByText(/página 2 de 3/i)).toBeInTheDocument();
    });

    it('disables Previous button on first page', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 25,
          page: 1,
          limit: 10,
          totalPages: 3,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      const previousButton = screen.getByRole('button', { name: /anterior/i });
      expect(previousButton).toBeDisabled();
    });

    it('disables Next button on last page', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 25,
          page: 3,
          limit: 10,
          totalPages: 3,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      const nextButton = screen.getByRole('button', { name: /próxima/i });
      expect(nextButton).toBeDisabled();
    });

    it('enables Previous button when not on first page', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      const previousButton = screen.getByRole('button', { name: /anterior/i });
      expect(previousButton).not.toBeDisabled();
    });

    it('enables Next button when not on last page', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      const nextButton = screen.getByRole('button', { name: /próxima/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('does not display pagination when only one page exists', () => {
      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 3,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      expect(screen.queryByRole('button', { name: /anterior/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /próxima/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/página/i)).not.toBeInTheDocument();
    });
  });

  describe('Bookings Sorted by Date', () => {
    it('displays bookings sorted by date in descending order', () => {
      // Mock bookings with different dates
      const unsortedBookings: BookingResponseDto[] = [
        {
          ...mockBookings[0],
          id: 'booking-old',
          createdAt: '2024-01-10T08:15:00Z', // Oldest
        },
        {
          ...mockBookings[1],
          id: 'booking-newest',
          createdAt: '2024-01-20T10:00:00Z', // Newest
        },
        {
          ...mockBookings[2],
          id: 'booking-middle',
          createdAt: '2024-01-15T14:30:00Z', // Middle
        },
      ];

      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: unsortedBookings,
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 3,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      const bookingCards = screen.getAllByTestId(/booking-card-/);
      
      // Verify the order: newest first
      expect(bookingCards[0]).toHaveAttribute('data-testid', 'booking-card-booking-newest');
      expect(bookingCards[1]).toHaveAttribute('data-testid', 'booking-card-booking-middle');
      expect(bookingCards[2]).toHaveAttribute('data-testid', 'booking-card-booking-old');
    });

    it('handles bookings with missing createdAt dates', () => {
      const bookingsWithMissingDates: BookingResponseDto[] = [
        {
          ...mockBookings[0],
          id: 'booking-with-date',
          createdAt: '2024-01-20T10:00:00Z',
        },
        {
          ...mockBookings[1],
          id: 'booking-no-date',
          createdAt: undefined,
        },
      ];

      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: bookingsWithMissingDates,
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      // Should still render without crashing
      expect(screen.getByTestId('booking-card-booking-with-date')).toBeInTheDocument();
      expect(screen.getByTestId('booking-card-booking-no-date')).toBeInTheDocument();
    });

    it('maintains sort order with same-day bookings', () => {
      const sameDayBookings: BookingResponseDto[] = [
        {
          ...mockBookings[0],
          id: 'booking-morning',
          createdAt: '2024-01-15T08:00:00Z',
        },
        {
          ...mockBookings[1],
          id: 'booking-afternoon',
          createdAt: '2024-01-15T14:00:00Z',
        },
        {
          ...mockBookings[2],
          id: 'booking-evening',
          createdAt: '2024-01-15T20:00:00Z',
        },
      ];

      vi.mocked(useBookingHistoryModule.useBookingHistory).mockReturnValue({
        bookings: sameDayBookings,
        isLoading: false,
        isError: false,
        error: null,
        meta: {
          total: 3,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
        refetch: mockRefetch,
      });

      renderWithRouter(<BookingHistoryPage />);

      const bookingCards = screen.getAllByTestId(/booking-card-/);
      
      // Verify evening (latest) comes first
      expect(bookingCards[0]).toHaveAttribute('data-testid', 'booking-card-booking-evening');
      expect(bookingCards[1]).toHaveAttribute('data-testid', 'booking-card-booking-afternoon');
      expect(bookingCards[2]).toHaveAttribute('data-testid', 'booking-card-booking-morning');
    });
  });
});
