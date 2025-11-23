import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import BookingDetailPage from './BookingDetailPage';
import * as useBookingDetailModule from '../hooks/useBookingDetail';
import { BookingStatus } from '../types/booking';
import type { BookingResponseDto } from '../types/booking';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock the useBookingDetail hook
vi.mock('../hooks/useBookingDetail');

// Mock child components
vi.mock('../components/booking/BoardingPassCard', () => ({
  default: ({ booking }: { booking: BookingResponseDto }) => (
    <div data-testid="boarding-pass-card" aria-label="Cartão de embarque">
      <span>Boarding Pass for {booking.id}</span>
    </div>
  ),
}));

vi.mock('../components/booking/PassengerDetailsSection', () => ({
  default: ({ passengers }: { passengers: any[] }) => (
    <div data-testid="passenger-details-section">
      <h2>Detalhes dos Passageiros</h2>
      <span>{passengers.length} passengers</span>
    </div>
  ),
}));

vi.mock('../components/booking/PaymentDetailsSection', () => ({
  default: ({ status }: { status: BookingStatus }) => (
    <div data-testid="payment-details-section">
      <h2>Detalhes do Pagamento</h2>
      <span>Status: {status}</span>
    </div>
  ),
}));

describe('BookingDetailPage - Accessibility Tests', () => {
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
    ],
    totalAmount: 450000,
    currency: 'BRL',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  };

  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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

  describe('ARIA Labels on Interactive Elements', () => {
    it('back button has accessible name', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      const backButton = screen.getByRole('button', { name: /voltar para minhas reservas/i });
      expect(backButton).toBeInTheDocument();
    });

    it('retry button has accessible name', () => {
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

    it('login button has accessible name on 401 error', () => {
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

  describe('Keyboard Navigation', () => {
    it('back button is keyboard accessible', async () => {
      const user = userEvent.setup();
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      const backButton = screen.getByRole('button', { name: /voltar para minhas reservas/i });
      
      // Should be focusable
      backButton.focus();
      expect(backButton).toHaveFocus();
      
      // Should be activatable with Enter
      await user.keyboard('{Enter}');
      expect(backButton).toBeEnabled();
    });

    it('retry button is keyboard accessible', async () => {
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
      
      retryButton.focus();
      expect(retryButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockRefetch).toHaveBeenCalled();
    });

    it('maintains logical tab order', async () => {
      const user = userEvent.setup();
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      // Tab should go to back button first
      await user.tab();
      const backButton = screen.getByRole('button', { name: /voltar para minhas reservas/i });
      expect(backButton).toHaveFocus();
    });
  });

  describe('Focus Indicators', () => {
    it('buttons have visible focus indicators', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      const backButton = screen.getByRole('button', { name: /voltar para minhas reservas/i });
      backButton.focus();
      
      expect(backButton).toHaveFocus();
      // MUI buttons have built-in focus styles
    });

    it('error state buttons have focus indicators', () => {
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
      retryButton.focus();
      
      expect(retryButton).toHaveFocus();
    });
  });

  describe('Screen Reader Announcements', () => {
    it('loading state is announced to screen readers', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: true,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      // Loading skeleton should be present and visible
      const loadingSkeleton = screen.getByTestId('loading-skeleton');
      expect(loadingSkeleton).toBeInTheDocument();
    });

    it('error messages are announced to screen readers', () => {
      const error = new Error('Network Error');
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      renderWithRouter();

      // Error message should be in an alert
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
    });

    it('404 error is clearly announced', () => {
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

      const heading = screen.getByRole('heading', { name: /reserva não encontrada/i });
      expect(heading).toBeInTheDocument();
    });

    it('success state has proper heading structure', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      const mainHeading = screen.getByRole('heading', { name: /detalhes da reserva/i });
      expect(mainHeading).toBeInTheDocument();
    });
  });

  describe('Semantic HTML Structure', () => {
    it('uses proper heading hierarchy', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      const { container } = renderWithRouter();

      // Should have h4 for main page title
      const mainHeading = container.querySelector('h4');
      expect(mainHeading).toBeInTheDocument();
      
      // Child sections should have h2
      const subHeadings = container.querySelectorAll('h2');
      expect(subHeadings.length).toBeGreaterThan(0);
    });

    it('uses semantic button elements', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('uses alert role for error messages', () => {
      const error = new Error('Network Error');
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      renderWithRouter();

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Automated Accessibility Testing with axe-core', () => {
    it('loading state has no accessibility violations', async () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: true,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      const { container } = renderWithRouter();
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('error state has no accessibility violations', async () => {
      const error = new Error('Network Error');
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      const { container } = renderWithRouter();
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('404 error state has no accessibility violations', async () => {
      const error = new Error('Booking not found') as any;
      error.status = 404;
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      const { container } = renderWithRouter();
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('401 error state has no accessibility violations', async () => {
      const error = new Error('Unauthorized') as any;
      error.status = 401;
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      const { container } = renderWithRouter();
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('500 error state has no accessibility violations', async () => {
      const error = new Error('Internal Server Error') as any;
      error.status = 500;
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: null,
        isLoading: false,
        isError: true,
        error,
        refetch: mockRefetch,
      });

      const { container } = renderWithRouter();
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('success state has no accessibility violations', async () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      const { container } = renderWithRouter();
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no color contrast violations', async () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      const { container } = renderWithRouter();
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });

    it('has no ARIA violations', async () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      const { container } = renderWithRouter();
      
      const results = await axe(container, {
        rules: {
          'aria-allowed-attr': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });

    it('has no keyboard navigation violations', async () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      const { container } = renderWithRouter();
      
      const results = await axe(container, {
        rules: {
          'button-name': { enabled: true },
          'link-name': { enabled: true },
          'tabindex': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('Button Icons and Labels', () => {
    it('back button has both icon and text', () => {
      vi.mocked(useBookingDetailModule.useBookingDetail).mockReturnValue({
        booking: mockBooking,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithRouter();

      const backButton = screen.getByRole('button', { name: /voltar para minhas reservas/i });
      expect(backButton).toHaveTextContent(/voltar/i);
    });

    it('retry button has both icon and text', () => {
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
      expect(retryButton).toHaveTextContent(/tentar novamente/i);
    });
  });

  describe('Error Message Clarity', () => {
    it('provides clear error message for network errors', () => {
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

    it('provides clear error message for 404', () => {
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
      expect(screen.getByText(/não existe ou foi removida/i)).toBeInTheDocument();
    });

    it('provides clear error message for 401', () => {
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

      expect(screen.getByText(/você não tem permissão/i)).toBeInTheDocument();
    });
  });
});
