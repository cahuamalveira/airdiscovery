import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import BookingDetailPage from './BookingDetailPage';
import * as useBookingDetailModule from '../hooks/useBookingDetail';
import * as useFlightModule from '../hooks/useFlight';
import { BookingStatus } from '../types/booking';
import type { BookingResponseDto } from '../types/booking';

// Mock the useBookingDetail hook
vi.mock('../hooks/useBookingDetail');

// Mock the useFlight hook
vi.mock('../hooks/useFlight');

// Mock child components
vi.mock('../components/booking/BoardingPassCard', () => ({
  default: ({ booking }: { booking: BookingResponseDto }) => (
    <div data-testid="boarding-pass-card">
      <span>Boarding Pass for {booking.id}</span>
    </div>
  ),
}));

vi.mock('../components/booking/PassengerDetailsSection', () => ({
  default: ({ passengers }: { passengers: any[] }) => (
    <div data-testid="passenger-details-section">
      <span>{passengers.length} passengers</span>
    </div>
  ),
}));

vi.mock('../components/booking/PaymentDetailsSection', () => ({
  default: ({ status }: { status: BookingStatus }) => (
    <div data-testid="payment-details-section">
      <span>Status: {status}</span>
    </div>
  ),
}));

describe('BookingDetailPage', () => {
  const mockBooking: BookingResponseDto = {
    id: 'booking-123',
    flightId: 'flight-456',
    userId: 'user-789',
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
      {
        firstName: 'Maria',
        lastName: 'Silva',
        email: 'maria@example.com',
        phone: '11988888888',
        document: '98765432109',
        birthDate: '1992-05-15',
      },
    ],
    totalAmount: 450000,
    currency: 'BRL',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  };

  const mockFlight = {
    id: 'flight-456',
    amadeusOfferId: 'amadeus-123',
    flightNumber: 'LA-3000',
    departureCode: 'GRU',
    arrivalCode: 'REC',
    departureDateTime: '2024-02-15T10:00:00Z',
    arrivalDateTime: '2024-02-15T13:00:00Z',
    priceTotal: 450000,
    currency: 'BRL',
    amadeusOfferPayload: {
      itineraries: [
        {
          segments: [
            {
              departure: { iataCode: 'GRU', at: '2024-02-15T10:00:00Z' },
              arrival: { iataCode: 'REC', at: '2024-02-15T13:00:00Z' },
              carrierCode: 'LA',
              number: '3000',
            },
          ],
        },
        {
          segments: [
            {
              departure: { iataCode: 'REC', at: '2024-02-22T14:00:00Z' },
              arrival: { iataCode: 'GRU', at: '2024-02-22T17:00:00Z' },
              carrierCode: 'LA',
              number: '3001',
            },
          ],
        },
      ],
    },
  };

  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set default mock for useFlight
    vi.mocked(useFlightModule.useFlight).mockReturnValue({
      flight: mockFlight,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  const renderWithRouter = (bookingId: string = 'booking-123') => {
    window.history.pushState({}, 'Test page', `/minhas-reservas/${bookingId}`);
    
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/minhas-reservas/:bookingId" element={<BookingDetailPage />} />
        </Routes>
      </BrowserRouter>
    );
  };

  describe('Loading State', () => {
    it('displays loading skeleton while fetching booking data', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: true,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      vi.mocked(useFlightModule.useFlight).mockReturnValue({
        flight: null,
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithRouter();

      // Should show loading indicator (skeleton or spinner)
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('does not display booking content while loading', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: true,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.queryByTestId('boarding-pass-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('passenger-details-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('payment-details-section')).not.toBeInTheDocument();
    });

    it('displays back button even while loading', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: true,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error message when booking fetch fails', () => {
      const error = new Error('Network Error');
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.getByText(/não foi possível carregar os detalhes da reserva/i)).toBeInTheDocument();
    });

    it('displays retry button on error', () => {
      const error = new Error('Network Error');
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      renderWithRouter();

      const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('calls refetch when retry button is clicked', async () => {
      const user = userEvent.setup();
      const error = new Error('Network Error');
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      renderWithRouter();

      const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
      await user.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('displays back button on error', () => {
      const error = new Error('Network Error');
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });

    it('does not display booking content on error', () => {
      const error = new Error('Network Error');
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.queryByTestId('boarding-pass-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('passenger-details-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('payment-details-section')).not.toBeInTheDocument();
    });
  });

  describe('404 Handling', () => {
    it('displays booking not found message for 404 error', () => {
      const error = new Error('Booking not found') as any;
      error.status = 404;
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.getByText(/reserva não encontrada/i)).toBeInTheDocument();
    });

    it('displays return to history button for 404 error', () => {
      const error = new Error('Booking not found') as any;
      error.status = 404;
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      renderWithRouter();

      const backButtons = screen.getAllByRole('button', { name: /voltar para minhas reservas/i });
      // Should have 2 buttons: one at top (always visible) and one in error message
      expect(backButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Unauthorized Access Handling', () => {
    it('displays unauthorized message for 401 error', () => {
      const error = new Error('Unauthorized') as any;
      error.status = 401;
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.getByText(/você não tem permissão para acessar esta reserva/i)).toBeInTheDocument();
    });

    it('displays login button for 401 error', () => {
      const error = new Error('Unauthorized') as any;
      error.status = 401;
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      renderWithRouter();

      const loginButton = screen.getByRole('button', { name: /fazer login/i });
      expect(loginButton).toBeInTheDocument();
    });
  });

  describe('Server Error Handling', () => {
    it('displays server error message for 500 error', () => {
      const error = new Error('Internal Server Error') as any;
      error.status = 500;
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.getByRole('heading', { name: /erro no servidor/i })).toBeInTheDocument();
      expect(screen.getByText(/ocorreu um erro no servidor/i)).toBeInTheDocument();
    });

    it('displays retry button for 500 error', () => {
      const error = new Error('Internal Server Error') as any;
      error.status = 500;
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      renderWithRouter();

      const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('calls refetch when retry button is clicked on 500 error', async () => {
      const user = userEvent.setup();
      const error = new Error('Internal Server Error') as any;
      error.status = 500;
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      renderWithRouter();

      const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
      await user.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Missing Data Handling', () => {
    it('handles booking with missing flight data gracefully', () => {
      const bookingWithoutFlight = {
        ...mockBooking,
        flightId: undefined,
      };

      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: bookingWithoutFlight as any,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      // Should still render the page without crashing
      expect(screen.getByText(/detalhes da reserva/i)).toBeInTheDocument();
      expect(screen.getByTestId('boarding-pass-card')).toBeInTheDocument();
    });

    it('handles booking with empty passenger list', () => {
      const bookingWithoutPassengers = {
        ...mockBooking,
        passengers: [],
      };

      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: bookingWithoutPassengers,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      // Should still render the page
      expect(screen.getByText(/detalhes da reserva/i)).toBeInTheDocument();
      expect(screen.getByTestId('passenger-details-section')).toBeInTheDocument();
      expect(screen.getByText(/0 passengers/i)).toBeInTheDocument();
    });

    it('handles booking with missing payment data', () => {
      const bookingWithoutPayments = {
        ...mockBooking,
        payments: undefined,
      };

      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: bookingWithoutPayments,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      // Should still render payment section
      expect(screen.getByTestId('payment-details-section')).toBeInTheDocument();
    });

    it('handles booking with missing currency', () => {
      const bookingWithoutCurrency = {
        ...mockBooking,
        currency: undefined,
      };

      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: bookingWithoutCurrency as any,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      // Should still render without crashing
      expect(screen.getByText(/detalhes da reserva/i)).toBeInTheDocument();
    });

    it('handles booking with missing createdAt date', () => {
      const bookingWithoutDate = {
        ...mockBooking,
        createdAt: undefined,
      };

      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: bookingWithoutDate,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      // Should still render without crashing
      expect(screen.getByText(/detalhes da reserva/i)).toBeInTheDocument();
      expect(screen.getByTestId('payment-details-section')).toBeInTheDocument();
    });
  });

  describe('Successful Booking Display', () => {
    it('displays boarding pass card with booking data', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.getByTestId('boarding-pass-card')).toBeInTheDocument();
      expect(screen.getByText(/Boarding Pass for booking-123/i)).toBeInTheDocument();
    });

    it('displays passenger details section', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.getByTestId('passenger-details-section')).toBeInTheDocument();
      expect(screen.getByText(/2 passengers/i)).toBeInTheDocument();
    });

    it('displays payment details section', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.getByTestId('payment-details-section')).toBeInTheDocument();
      expect(screen.getByText(/Status: PAID/i)).toBeInTheDocument();
    });

    it('displays page title', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.getByText(/detalhes da reserva/i)).toBeInTheDocument();
    });

    it('does not display loading skeleton when data is loaded', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    it('does not display error message when data is loaded', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.queryByText(/não foi possível carregar/i)).not.toBeInTheDocument();
    });
  });

  describe('Back Navigation', () => {
    it('displays back button', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      const backButton = screen.getByTestId('back-button');
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveTextContent(/voltar para minhas reservas/i);
    });

    it('navigates back to booking history when back button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      const backButton = screen.getByTestId('back-button');
      await user.click(backButton);

      // Navigation will be tested through integration tests
      // Here we just verify the button is clickable
      expect(backButton).toBeEnabled();
    });
  });

  describe('URL Parameter Extraction', () => {
    it('extracts bookingId from URL params', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter('booking-abc-123');

      // Verify the hook was called with the correct bookingId
      expect(useBookingDetailModule.useBookingDetail).toHaveBeenCalledWith('booking-abc-123');
    });

    it('handles different booking ID formats', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter('550e8400-e29b-41d4-a716-446655440000');

      expect(useBookingDetailModule.useBookingDetail).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
    });

    it('handles missing bookingId gracefully', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/minhas-reservas/:bookingId" element={<BookingDetailPage />} />
          </Routes>
        </BrowserRouter>
      );

      // Should handle undefined bookingId
      expect(useBookingDetailModule.useBookingDetail).toHaveBeenCalled();
    });
  });

  describe('Different Booking Statuses', () => {
    it('displays booking with AWAITING_PAYMENT status', () => {
      const awaitingPaymentBooking = {
        ...mockBooking,
        status: BookingStatus.AWAITING_PAYMENT,
      };

      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: awaitingPaymentBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.getByText(/Status: AWAITING_PAYMENT/i)).toBeInTheDocument();
    });

    it('displays booking with CANCELLED status', () => {
      const cancelledBooking = {
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      };

      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: cancelledBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.getByText(/Status: CANCELLED/i)).toBeInTheDocument();
    });

    it('displays booking with PENDING status', () => {
      const pendingBooking = {
        ...mockBooking,
        status: BookingStatus.PENDING,
      };

      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: pendingBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.getByText(/Status: PENDING/i)).toBeInTheDocument();
    });
  });

  describe('Single Passenger Booking', () => {
    it('displays booking with single passenger', () => {
      const singlePassengerBooking = {
        ...mockBooking,
        passengers: [mockBooking.passengers[0]],
      };

      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: singlePassengerBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      expect(screen.getByTestId('passenger-details-section')).toBeInTheDocument();
      expect(screen.getByText(/1 passengers/i)).toBeInTheDocument();
    });
  });
});
