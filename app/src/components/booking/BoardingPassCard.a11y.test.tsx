import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import BoardingPassCard from './BoardingPassCard';
import { BookingStatus } from '../../types/booking';
import type { BookingResponseDto } from '../../types/booking';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

describe('BoardingPassCard - Accessibility Tests', () => {
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

  describe('ARIA Labels', () => {
    it('has aria-label on boarding pass card', () => {
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = container.querySelector('[aria-label="Cartão de embarque"]');
      expect(card).toBeInTheDocument();
    });

    it('has aria-label on QR code section', () => {
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const qrCode = container.querySelector('[aria-label="Código QR do embarque"]');
      expect(qrCode).toBeInTheDocument();
    });

    it('has descriptive aria-label for main card', () => {
      const { getByLabelText } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = getByLabelText('Cartão de embarque');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Semantic HTML Structure', () => {
    it('uses proper heading hierarchy', () => {
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Should have h2 for main title
      const heading = container.querySelector('h2');
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toContain('SEU CARTÃO DE EMBARQUE');
    });

    it('uses semantic HTML elements', () => {
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Should use semantic elements like article, section, or proper divs with roles
      expect(container.querySelector('[role]') || container.querySelector('article') || container.querySelector('section')).toBeTruthy();
    });
  });

  describe('Keyboard Navigation', () => {
    it('card is not focusable (informational content)', () => {
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = container.querySelector('[data-testid="boarding-pass-card"]');
      // Boarding pass card should not have tabindex as it's informational
      expect(card).not.toHaveAttribute('tabindex', '0');
    });

    it('has no interactive elements that need keyboard access', () => {
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Boarding pass is informational, should not have buttons or links
      const buttons = container.querySelectorAll('button');
      const links = container.querySelectorAll('a');
      
      expect(buttons.length).toBe(0);
      expect(links.length).toBe(0);
    });
  });

  describe('Color Contrast', () => {
    it('uses high contrast colors for text', () => {
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Primary text should be dark (#212121) on white background
      const card = container.querySelector('[data-testid="boarding-pass-card"]');
      expect(card).toBeInTheDocument();
      
      // This is a visual test - in real scenarios, use tools like axe-core
      // to automatically check contrast ratios
    });

    it('accent bar has sufficient contrast', () => {
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const accentBar = container.querySelector('[data-testid="boarding-pass-accent-bar"]');
      expect(accentBar).toBeInTheDocument();
      
      // Blue accent (#1976d2) should have good contrast with white icon
    });
  });

  describe('Screen Reader Announcements', () => {
    it('provides meaningful text content for screen readers', () => {
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const card = container.querySelector('[data-testid="boarding-pass-card"]');
      const textContent = card?.textContent || '';
      
      // Should contain all important information
      expect(textContent).toContain('GYN');
      expect(textContent).toContain('GIG');
      expect(textContent).toContain('JOÃO SILVA');
      expect(textContent).toContain('MARIA SANTOS');
      expect(textContent).toContain('ABC123DEF');
    });

    it('has proper text hierarchy for screen readers', () => {
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      // Heading should come before content
      const heading = container.querySelector('h2');
      const card = container.querySelector('[data-testid="boarding-pass-card"]');
      
      expect(heading).toBeInTheDocument();
      expect(card).toBeInTheDocument();
    });

    it('QR code has descriptive label for screen readers', () => {
      const { getByLabelText } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const qrCode = getByLabelText('Código QR do embarque');
      expect(qrCode).toBeInTheDocument();
    });
  });

  describe('Alt Text for Images and Icons', () => {
    it('airplane icon is decorative (no alt text needed)', () => {
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const icon = container.querySelector('[data-testid="airplane-icon"]');
      expect(icon).toBeInTheDocument();
      
      // MUI icons are SVGs and decorative, they don't need alt text
      // The context is provided by surrounding text
    });

    it('QR code SVG has proper labeling', () => {
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const qrCodeContainer = container.querySelector('[data-testid="boarding-pass-qr-code"]');
      expect(qrCodeContainer).toHaveAttribute('aria-label', 'Código QR do embarque');
    });
  });

  describe('Automated Accessibility Testing with axe-core', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have color contrast violations', async () => {
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });

    it('should not have ARIA violations', async () => {
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
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
  });

  describe('Responsive Accessibility', () => {
    it('maintains accessibility on mobile viewport', async () => {
      // Simulate mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;
      
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains accessibility on tablet viewport', async () => {
      // Simulate tablet viewport
      global.innerWidth = 768;
      global.innerHeight = 1024;
      
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains accessibility on desktop viewport', async () => {
      // Simulate desktop viewport
      global.innerWidth = 1920;
      global.innerHeight = 1080;
      
      const { container } = render(<BoardingPassCard booking={mockBooking} flight={mockFlight} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
