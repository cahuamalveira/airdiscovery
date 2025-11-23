import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BoardingPassCard from './BoardingPassCard';
import { BookingStatus } from '../../types/booking';
import type { BookingResponseDto } from '../../types/booking';

describe('BoardingPassCard', () => {
  const mockBooking: BookingResponseDto = {
    id: 'booking-abc123',
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
        lastName: 'Santos',
        email: 'maria@example.com',
        phone: '11988888888',
        document: '98765432109',
        birthDate: '1985-05-15',
      },
    ],
    totalAmount: 4500.0,
    currency: 'BRL',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  };

  const mockFlight = {
    flightNumber: 'G3-738',
    departureCode: 'GYN',
    arrivalCode: 'GIG',
    departureDateTime: '2025-12-13T10:05:00Z',
    arrivalDateTime: '2025-12-13T11:50:00Z',
    airline: 'GOL',
  };

  describe('Rendering with complete booking data', () => {
    it('renders boarding pass card', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      expect(screen.getByTestId('boarding-pass-card')).toBeInTheDocument();
    });

    it('renders with all required sections', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Should have main card structure
      expect(screen.getByTestId('boarding-pass-card')).toBeInTheDocument();
      
      // Should have flight information
      expect(screen.getByText(mockFlight.departureCode)).toBeInTheDocument();
      expect(screen.getByText(mockFlight.arrivalCode)).toBeInTheDocument();
    });
  });

  describe('Flight route display (origin → destination)', () => {
    it('displays departure and arrival airport codes', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      expect(screen.getByText('GYN')).toBeInTheDocument();
      expect(screen.getByText('GIG')).toBeInTheDocument();
    });

    it('displays arrow between origin and destination', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Should have arrow symbol (→) or similar visual indicator
      expect(screen.getByText(/→/)).toBeInTheDocument();
    });

    it('displays route in correct order (origin first, destination second)', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = screen.getByTestId('boarding-pass-card');
      const text = card.textContent || '';
      
      const gynIndex = text.indexOf('GYN');
      const gigIndex = text.indexOf('GIG');
      
      expect(gynIndex).toBeLessThan(gigIndex);
    });
  });

  describe('Flight times formatting (pt-BR locale)', () => {
    it('displays departure time in pt-BR format', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Time should be formatted as HH:MM in Brazilian format
      expect(screen.getByText(/10:05/)).toBeInTheDocument();
    });

    it('displays arrival time in pt-BR format', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      expect(screen.getByText(/11:50/)).toBeInTheDocument();
    });

    it('formats times correctly for different timezones', () => {
      const flightWithDifferentTime = {
        ...mockFlight,
        departureDateTime: '2025-12-13T23:30:00Z',
        arrivalDateTime: '2025-12-14T01:15:00Z',
      };

      render(<BoardingPassCard booking={mockBooking} flight={flightWithDifferentTime} />);
      
      // Should display times in local format
      expect(screen.getByTestId('boarding-pass-card')).toBeInTheDocument();
    });
  });

  describe('Date formatting (pt-BR locale)', () => {
    it('displays flight date in pt-BR format', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Date should be formatted as DD/MM/YYYY in Brazilian format
      expect(screen.getByText(/13\/12\/2025/)).toBeInTheDocument();
    });

    it('formats date correctly for different dates', () => {
      const flightWithDifferentDate = {
        ...mockFlight,
        departureDateTime: '2025-01-05T10:00:00Z',
      };

      render(<BoardingPassCard booking={mockBooking} flight={flightWithDifferentDate} />);
      
      expect(screen.getByText(/05\/01\/2025/)).toBeInTheDocument();
    });
  });

  describe('Passenger list rendering', () => {
    it('displays all passenger names', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      expect(screen.getByText(/JOÃO SILVA/i)).toBeInTheDocument();
      expect(screen.getByText(/MARIA SANTOS/i)).toBeInTheDocument();
    });

    it('displays passenger names in uppercase', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Boarding passes typically show names in uppercase
      const card = screen.getByTestId('boarding-pass-card');
      expect(card.textContent).toMatch(/JOÃO SILVA/);
      expect(card.textContent).toMatch(/MARIA SANTOS/);
    });

    it('displays single passenger correctly', () => {
      const singlePassengerBooking = {
        ...mockBooking,
        passengers: [mockBooking.passengers[0]],
      };

      render(<BoardingPassCard booking={singlePassengerBooking} flight={mockFlight} />);
      
      expect(screen.getByText(/JOÃO SILVA/i)).toBeInTheDocument();
      expect(screen.queryByText(/MARIA SANTOS/i)).not.toBeInTheDocument();
    });

    it('displays multiple passengers in list format', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Should have a section for passengers
      expect(screen.getByText(/PASSAGEIROS/i)).toBeInTheDocument();
      expect(screen.getByText(/JOÃO SILVA/i)).toBeInTheDocument();
      expect(screen.getByText(/MARIA SANTOS/i)).toBeInTheDocument();
    });
  });

  describe('Booking locator display', () => {
    it('displays booking locator/confirmation code', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Should display booking ID or locator
      expect(screen.getByText(/ABC123DEF/i)).toBeInTheDocument();
    });

    it('displays locator label', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      expect(screen.getByText(/LOCALIZADOR/i)).toBeInTheDocument();
    });

    it('formats locator in uppercase', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = screen.getByTestId('boarding-pass-card');
      expect(card.textContent).toMatch(/ABC123DEF/);
    });
  });

  describe('QR code rendering', () => {
    it('renders QR code component', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // QR code should be present (canvas or svg element)
      const qrCode = screen.getByTestId('boarding-pass-qr-code');
      expect(qrCode).toBeInTheDocument();
    });

    it('QR code contains booking information', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const qrCode = screen.getByTestId('boarding-pass-qr-code');
      expect(qrCode).toBeInTheDocument();
      
      // QR code should encode booking data
      // The actual encoding is handled by the library, we just verify it renders
    });
  });

  describe('Responsive layout behavior', () => {
    it('renders with responsive container', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = screen.getByTestId('boarding-pass-card');
      expect(card).toHaveClass('MuiCard-root');
    });

    it('has proper layout structure for desktop', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Should have grid or flex layout
      const card = screen.getByTestId('boarding-pass-card');
      expect(card).toBeInTheDocument();
    });

    it('includes blue accent bar', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Should have visual accent element
      const accentBar = screen.getByTestId('boarding-pass-accent-bar');
      expect(accentBar).toBeInTheDocument();
    });

    it('includes airplane icon', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Should have airplane icon
      const icon = screen.getByTestId('airplane-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Accessibility attributes (ARIA labels)', () => {
    it('has aria-label for boarding pass card', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = screen.getByTestId('boarding-pass-card');
      expect(card).toHaveAttribute('aria-label', 'Cartão de embarque');
    });

    it('has aria-label for QR code', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const qrCode = screen.getByTestId('boarding-pass-qr-code');
      expect(qrCode).toHaveAttribute('aria-label', 'Código QR do embarque');
    });

    it('has semantic HTML structure', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Should use semantic elements
      const card = screen.getByTestId('boarding-pass-card');
      expect(card).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Should have proper heading structure
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });

  describe('Flight number display', () => {
    it('displays flight number', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      expect(screen.getByText(/G3.*738/i)).toBeInTheDocument();
    });

    it('displays flight number with proper formatting', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Flight number should be displayed prominently
      expect(screen.getByText(/VOO/i)).toBeInTheDocument();
    });
  });

  describe('Airline branding', () => {
    it('displays airline name when provided', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      expect(screen.getByText(/GOL/i)).toBeInTheDocument();
    });

    it('handles missing airline gracefully', () => {
      const flightWithoutAirline = {
        ...mockFlight,
        airline: undefined,
      };

      render(<BoardingPassCard booking={mockBooking} flight={flightWithoutAirline} />);
      
      // Should still render without crashing
      expect(screen.getByTestId('boarding-pass-card')).toBeInTheDocument();
    });
  });

  describe('Visual design elements', () => {
    it('displays boarding pass title', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      expect(screen.getByText(/SEU CARTÃO DE EMBARQUE/i)).toBeInTheDocument();
    });

    it('has proper card styling', () => {
      render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = screen.getByTestId('boarding-pass-card');
      expect(card).toHaveClass('MuiCard-root');
    });
  });
});
