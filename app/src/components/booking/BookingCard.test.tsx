import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BookingCard from './BookingCard';
import { BookingStatus } from '../../types/booking';
import type { BookingResponseDto } from '../../types/booking';

describe('BookingCard', () => {
  const baseBooking: BookingResponseDto = {
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
    totalAmount: 4500.00, // Amount in BRL (R$ 4.500,00)
    currency: 'BRL',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  };

  describe('Rendering with Different Booking Statuses', () => {
    it('renders booking with PAID status', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        status: BookingStatus.PAID,
      };

      render(<BookingCard booking={booking} />);

      expect(screen.getByText('Confirmada')).toBeInTheDocument();
      expect(screen.getByTestId('booking-status-chip')).toHaveClass('MuiChip-colorSuccess');
    });

    it('renders booking with AWAITING_PAYMENT status', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        status: BookingStatus.AWAITING_PAYMENT,
      };

      render(<BookingCard booking={booking} />);

      expect(screen.getByText('Aguardando Pagamento')).toBeInTheDocument();
      expect(screen.getByTestId('booking-status-chip')).toHaveClass('MuiChip-colorWarning');
    });

    it('renders booking with PENDING status', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        status: BookingStatus.PENDING,
      };

      render(<BookingCard booking={booking} />);

      expect(screen.getByText('Pendente')).toBeInTheDocument();
      expect(screen.getByTestId('booking-status-chip')).toHaveClass('MuiChip-colorInfo');
    });

    it('renders booking with CANCELLED status', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        status: BookingStatus.CANCELLED,
      };

      render(<BookingCard booking={booking} />);

      expect(screen.getByText('Cancelada')).toBeInTheDocument();
      expect(screen.getByTestId('booking-status-chip')).toHaveClass('MuiChip-colorError');
    });
  });

  describe('Flight Route Display', () => {
    it('displays flight route correctly', () => {
      render(<BookingCard booking={baseBooking} />);

      // Should display route in format "GRU → JFK" or similar
      expect(screen.getByText(/→/)).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats dates using pt-BR locale', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        createdAt: '2024-01-15T10:00:00Z',
      };

      render(<BookingCard booking={booking} />);

      // Date should be formatted in Brazilian Portuguese format
      // e.g., "15/01/2024" or "15 de janeiro de 2024"
      const dateElement = screen.getByText(/15/);
      expect(dateElement).toBeInTheDocument();
    });

    it('handles missing createdAt date gracefully', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        createdAt: undefined,
      };

      render(<BookingCard booking={booking} />);

      // Should still render without crashing
      expect(screen.getByTestId('booking-card')).toBeInTheDocument();
    });
  });

  describe('Passenger Count Display', () => {
    it('displays correct passenger count for single passenger', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
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
      };

      render(<BookingCard booking={booking} />);

      expect(screen.getByText(/1 passageiro/i)).toBeInTheDocument();
    });

    it('displays correct passenger count for multiple passengers', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
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
            lastName: 'Santos',
            email: 'maria@example.com',
            phone: '11988888888',
            document: '98765432109',
            birthDate: '1985-05-15',
          },
        ],
      };

      render(<BookingCard booking={booking} />);

      expect(screen.getByText(/2 passageiros/i)).toBeInTheDocument();
    });

    it('handles empty passenger list', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        passengers: [],
      };

      render(<BookingCard booking={booking} />);

      expect(screen.getByText(/0 passageiros/i)).toBeInTheDocument();
    });
  });

  describe('Currency Formatting for BRL', () => {
    it('formats amount in Brazilian Real correctly', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        totalAmount: 4500.00, // R$ 4.500,00
        currency: 'BRL',
      };

      render(<BookingCard booking={booking} />);

      // Should display as "R$ 4.500,00" with Brazilian formatting
      expect(screen.getByText(/R\$\s*4\.500,00/)).toBeInTheDocument();
    });

    it('formats small amounts correctly', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        totalAmount: 99.99, // R$ 99,99
        currency: 'BRL',
      };

      render(<BookingCard booking={booking} />);

      expect(screen.getByText(/R\$\s*99,99/)).toBeInTheDocument();
    });

    it('formats large amounts correctly', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        totalAmount: 1234567.89, // R$ 1.234.567,89
        currency: 'BRL',
      };

      render(<BookingCard booking={booking} />);

      expect(screen.getByText(/R\$\s*1\.234\.567,89/)).toBeInTheDocument();
    });

    it('handles zero amount', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        totalAmount: 0,
        currency: 'BRL',
      };

      render(<BookingCard booking={booking} />);

      expect(screen.getByText(/R\$\s*0,00/)).toBeInTheDocument();
    });
  });

  describe('Status Indicator Colors', () => {
    it('displays green indicator for PAID status', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        status: BookingStatus.PAID,
      };

      render(<BookingCard booking={booking} />);

      const statusChip = screen.getByTestId('booking-status-chip');
      expect(statusChip).toHaveClass('MuiChip-colorSuccess');
    });

    it('displays yellow indicator for AWAITING_PAYMENT status', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        status: BookingStatus.AWAITING_PAYMENT,
      };

      render(<BookingCard booking={booking} />);

      const statusChip = screen.getByTestId('booking-status-chip');
      expect(statusChip).toHaveClass('MuiChip-colorWarning');
    });

    it('displays blue indicator for PENDING status', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        status: BookingStatus.PENDING,
      };

      render(<BookingCard booking={booking} />);

      const statusChip = screen.getByTestId('booking-status-chip');
      expect(statusChip).toHaveClass('MuiChip-colorInfo');
    });

    it('displays red indicator for CANCELLED status', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        status: BookingStatus.CANCELLED,
      };

      render(<BookingCard booking={booking} />);

      const statusChip = screen.getByTestId('booking-status-chip');
      expect(statusChip).toHaveClass('MuiChip-colorError');
    });
  });

  describe('Status Labels', () => {
    it('displays correct label for PAID status', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        status: BookingStatus.PAID,
      };

      render(<BookingCard booking={booking} />);

      expect(screen.getByText('Confirmada')).toBeInTheDocument();
    });

    it('displays correct label for AWAITING_PAYMENT status', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        status: BookingStatus.AWAITING_PAYMENT,
      };

      render(<BookingCard booking={booking} />);

      expect(screen.getByText('Aguardando Pagamento')).toBeInTheDocument();
    });

    it('displays correct label for PENDING status', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        status: BookingStatus.PENDING,
      };

      render(<BookingCard booking={booking} />);

      expect(screen.getByText('Pendente')).toBeInTheDocument();
    });

    it('displays correct label for CANCELLED status', () => {
      const booking: BookingResponseDto = {
        ...baseBooking,
        status: BookingStatus.CANCELLED,
      };

      render(<BookingCard booking={booking} />);

      expect(screen.getByText('Cancelada')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders as a Material-UI Card', () => {
      render(<BookingCard booking={baseBooking} />);

      const card = screen.getByTestId('booking-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('MuiCard-root');
    });

    it('renders all required booking information', () => {
      render(<BookingCard booking={baseBooking} />);

      // Should have status
      expect(screen.getByTestId('booking-status-chip')).toBeInTheDocument();

      // Should have passenger count
      expect(screen.getByText(/passageiro/i)).toBeInTheDocument();

      // Should have amount
      expect(screen.getByText(/R\$/)).toBeInTheDocument();

      // Should have booking card container
      expect(screen.getByTestId('booking-card')).toBeInTheDocument();
    });
  });
});
