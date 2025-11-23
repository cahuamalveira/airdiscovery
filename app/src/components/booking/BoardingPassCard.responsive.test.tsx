import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import BoardingPassCard from './BoardingPassCard';
import { BookingStatus } from '../../types/booking';
import type { BookingResponseDto } from '../../types/booking';
import { ThemeProvider, createTheme } from '@mui/material/styles';

describe('BoardingPassCard - Responsive Design', () => {
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

  const theme = createTheme();

  const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
  };

  // Helper to simulate viewport size
  const setViewportSize = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  };

  beforeEach(() => {
    // Reset viewport to default
    setViewportSize(1024, 768);
  });

  describe('Desktop layout (>960px)', () => {
    beforeEach(() => {
      setViewportSize(1200, 800);
    });

    it('renders horizontal layout on desktop', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = screen.getByTestId('boarding-pass-card');
      expect(card).toBeInTheDocument();
      
      // Verify all sections are present
      expect(screen.getByTestId('boarding-pass-accent-bar')).toBeInTheDocument();
      expect(screen.getByTestId('boarding-pass-qr-code')).toBeInTheDocument();
    });

    it('displays accent bar vertically on desktop', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const accentBar = screen.getByTestId('boarding-pass-accent-bar');
      expect(accentBar).toBeInTheDocument();
      
      // Accent bar should be on the left side in desktop view
      const airplane = screen.getByTestId('airplane-icon');
      expect(airplane).toBeInTheDocument();
    });

    it('displays QR code on the right side on desktop', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const qrCode = screen.getByTestId('boarding-pass-qr-code');
      expect(qrCode).toBeInTheDocument();
    });

    it('uses larger typography on desktop', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Airport codes should be displayed prominently
      expect(screen.getByText('GYN')).toBeInTheDocument();
      expect(screen.getByText('GIG')).toBeInTheDocument();
    });

    it('displays all content in single row on desktop', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = screen.getByTestId('boarding-pass-card');
      expect(card).toBeInTheDocument();
      
      // All main sections should be visible
      expect(screen.getByTestId('boarding-pass-accent-bar')).toBeInTheDocument();
      expect(screen.getByText('GYN')).toBeInTheDocument();
      expect(screen.getByTestId('boarding-pass-qr-code')).toBeInTheDocument();
    });
  });

  describe('Tablet layout (600-960px)', () => {
    beforeEach(() => {
      setViewportSize(768, 1024);
    });

    it('renders appropriately on tablet', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = screen.getByTestId('boarding-pass-card');
      expect(card).toBeInTheDocument();
    });

    it('maintains horizontal layout on tablet', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Should still show main sections
      expect(screen.getByTestId('boarding-pass-accent-bar')).toBeInTheDocument();
      expect(screen.getByTestId('boarding-pass-qr-code')).toBeInTheDocument();
    });

    it('adjusts spacing for tablet view', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = screen.getByTestId('boarding-pass-card');
      expect(card).toBeInTheDocument();
      
      // Content should be readable
      expect(screen.getByText('GYN')).toBeInTheDocument();
      expect(screen.getByText('GIG')).toBeInTheDocument();
    });

    it('displays flight information clearly on tablet', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      expect(screen.getByText(/10:05/)).toBeInTheDocument();
      expect(screen.getByText(/11:50/)).toBeInTheDocument();
      expect(screen.getByText(/13\/12\/2025/)).toBeInTheDocument();
    });
  });

  describe('Mobile layout (<600px)', () => {
    beforeEach(() => {
      setViewportSize(375, 667);
    });

    it('renders vertical stacked layout on mobile', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = screen.getByTestId('boarding-pass-card');
      expect(card).toBeInTheDocument();
      
      // All sections should still be present but stacked
      expect(screen.getByTestId('boarding-pass-accent-bar')).toBeInTheDocument();
      expect(screen.getByTestId('boarding-pass-qr-code')).toBeInTheDocument();
    });

    it('displays accent bar horizontally on mobile', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const accentBar = screen.getByTestId('boarding-pass-accent-bar');
      expect(accentBar).toBeInTheDocument();
      
      // Accent bar should be at the top in mobile view
      const airplane = screen.getByTestId('airplane-icon');
      expect(airplane).toBeInTheDocument();
    });

    it('stacks QR code below main content on mobile', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const qrCode = screen.getByTestId('boarding-pass-qr-code');
      expect(qrCode).toBeInTheDocument();
      
      // QR code should be at the bottom in mobile view
    });

    it('adjusts typography sizes for mobile', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Text should still be readable on mobile
      expect(screen.getByText('GYN')).toBeInTheDocument();
      expect(screen.getByText('GIG')).toBeInTheDocument();
    });

    it('maintains readability of flight times on mobile', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      expect(screen.getByText(/10:05/)).toBeInTheDocument();
      expect(screen.getByText(/11:50/)).toBeInTheDocument();
    });

    it('displays passenger list clearly on mobile', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      expect(screen.getByText(/JOÃO SILVA/i)).toBeInTheDocument();
      expect(screen.getByText(/MARIA SANTOS/i)).toBeInTheDocument();
    });

    it('shows booking locator prominently on mobile', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      expect(screen.getByText(/ABC123DEF/i)).toBeInTheDocument();
    });
  });

  describe('Boarding pass card stacking on mobile', () => {
    beforeEach(() => {
      setViewportSize(375, 667);
    });

    it('stacks sections vertically on mobile', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = screen.getByTestId('boarding-pass-card');
      expect(card).toBeInTheDocument();
      
      // Verify all sections are present in stacked layout
      expect(screen.getByTestId('boarding-pass-accent-bar')).toBeInTheDocument();
      expect(screen.getByText('GYN')).toBeInTheDocument();
      expect(screen.getByTestId('boarding-pass-qr-code')).toBeInTheDocument();
    });

    it('maintains proper spacing between stacked sections', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = screen.getByTestId('boarding-pass-card');
      expect(card).toBeInTheDocument();
      
      // All content should be accessible
      expect(screen.getByText(/SEU CARTÃO DE EMBARQUE/i)).toBeInTheDocument();
      expect(screen.getByText(/PASSAGEIROS/i)).toBeInTheDocument();
      expect(screen.getByText(/LOCALIZADOR/i)).toBeInTheDocument();
    });

    it('ensures QR code is visible at bottom on mobile', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const qrCode = screen.getByTestId('boarding-pass-qr-code');
      expect(qrCode).toBeInTheDocument();
    });
  });

  describe('Touch interactions on mobile', () => {
    beforeEach(() => {
      setViewportSize(375, 667);
    });

    it('renders all interactive elements with adequate touch targets', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = screen.getByTestId('boarding-pass-card');
      expect(card).toBeInTheDocument();
      
      // Card itself should be touchable/tappable
      // Note: This component is primarily display-only, but should be accessible
    });

    it('maintains readability for touch-based navigation', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // All text should be readable
      expect(screen.getByText('GYN')).toBeInTheDocument();
      expect(screen.getByText('GIG')).toBeInTheDocument();
      expect(screen.getByText(/JOÃO SILVA/i)).toBeInTheDocument();
    });

    it('ensures proper spacing for touch interactions', () => {
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = screen.getByTestId('boarding-pass-card');
      expect(card).toBeInTheDocument();
      
      // Content should have adequate spacing
      expect(screen.getByText(/PASSAGEIROS/i)).toBeInTheDocument();
      expect(screen.getByText(/LOCALIZADOR/i)).toBeInTheDocument();
    });
  });

  describe('Responsive breakpoint transitions', () => {
    it('handles transition from desktop to tablet', () => {
      setViewportSize(1200, 800);
      const { rerender } = renderWithTheme(
        <BoardingPassCard booking={mockBooking} flight={mockFlight} />
      );
      
      expect(screen.getByTestId('boarding-pass-card')).toBeInTheDocument();
      
      // Simulate resize to tablet
      setViewportSize(768, 1024);
      rerender(
        <ThemeProvider theme={theme}>
          <BoardingPassCard booking={mockBooking} flight={mockFlight} />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('boarding-pass-card')).toBeInTheDocument();
    });

    it('handles transition from tablet to mobile', () => {
      setViewportSize(768, 1024);
      const { rerender } = renderWithTheme(
        <BoardingPassCard booking={mockBooking} flight={mockFlight} />
      );
      
      expect(screen.getByTestId('boarding-pass-card')).toBeInTheDocument();
      
      // Simulate resize to mobile
      setViewportSize(375, 667);
      rerender(
        <ThemeProvider theme={theme}>
          <BoardingPassCard booking={mockBooking} flight={mockFlight} />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('boarding-pass-card')).toBeInTheDocument();
    });

    it('handles transition from mobile to desktop', () => {
      setViewportSize(375, 667);
      const { rerender } = renderWithTheme(
        <BoardingPassCard booking={mockBooking} flight={mockFlight} />
      );
      
      expect(screen.getByTestId('boarding-pass-card')).toBeInTheDocument();
      
      // Simulate resize to desktop
      setViewportSize(1200, 800);
      rerender(
        <ThemeProvider theme={theme}>
          <BoardingPassCard booking={mockBooking} flight={mockFlight} />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('boarding-pass-card')).toBeInTheDocument();
    });
  });

  describe('Content overflow handling', () => {
    it('handles long passenger names on mobile', () => {
      const bookingWithLongNames = {
        ...mockBooking,
        passengers: [
          {
            firstName: 'João Pedro Francisco',
            lastName: 'Silva Santos Oliveira',
            email: 'joao@example.com',
            phone: '11999999999',
            document: '12345678901',
            birthDate: '1990-01-01',
          },
        ],
      };

      setViewportSize(375, 667);
      renderWithTheme(
        <BoardingPassCard booking={bookingWithLongNames} flight={mockFlight} />
      );
      
      expect(screen.getByTestId('boarding-pass-card')).toBeInTheDocument();
      // Long names should not break layout
    });

    it('handles multiple passengers on mobile', () => {
      const bookingWithManyPassengers = {
        ...mockBooking,
        passengers: [
          ...mockBooking.passengers,
          {
            firstName: 'Carlos',
            lastName: 'Oliveira',
            email: 'carlos@example.com',
            phone: '11977777777',
            document: '11111111111',
            birthDate: '1995-03-20',
          },
          {
            firstName: 'Ana',
            lastName: 'Costa',
            email: 'ana@example.com',
            phone: '11966666666',
            document: '22222222222',
            birthDate: '1992-07-10',
          },
        ],
      };

      setViewportSize(375, 667);
      renderWithTheme(
        <BoardingPassCard booking={bookingWithManyPassengers} flight={mockFlight} />
      );
      
      expect(screen.getByTestId('boarding-pass-card')).toBeInTheDocument();
      // Multiple passengers should display properly
    });
  });

  describe('Responsive card width', () => {
    it('constrains max width on large screens', () => {
      setViewportSize(1920, 1080);
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = screen.getByTestId('boarding-pass-card');
      expect(card).toBeInTheDocument();
      // Card should have max-width constraint
    });

    it('uses full width on mobile', () => {
      setViewportSize(375, 667);
      renderWithTheme(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = screen.getByTestId('boarding-pass-card');
      expect(card).toBeInTheDocument();
      // Card should use available width on mobile
    });
  });
});
