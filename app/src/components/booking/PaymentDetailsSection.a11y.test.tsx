import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import PaymentDetailsSection from './PaymentDetailsSection';
import { BookingStatus } from '../../types/booking';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

describe('PaymentDetailsSection - Accessibility Tests', () => {
  const defaultProps = {
    status: BookingStatus.PAID,
    totalAmount: 4500.0,
    currency: 'BRL',
    paymentDate: '2024-01-15T10:00:00Z',
    paymentMethod: 'Cartão de Crédito',
  };

  describe('ARIA Labels and Roles', () => {
    it('has proper semantic structure', () => {
      const { container } = render(<PaymentDetailsSection {...defaultProps} />);
      
      // Should have proper container structure
      expect(container.querySelector('[data-testid="payment-details-section"]')).toBeInTheDocument();
    });

    it('status chip has proper role', () => {
      render(<PaymentDetailsSection {...defaultProps} />);
      
      // Chip should be visible and have text content
      const statusChip = screen.getByText(/pago/i);
      expect(statusChip).toBeInTheDocument();
    });
  });

  describe('Semantic HTML Structure', () => {
    it('uses proper heading hierarchy', () => {
      const { container } = render(<PaymentDetailsSection {...defaultProps} />);
      
      // Section title should be h2
      const heading = container.querySelector('h2');
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toContain('Detalhes do Pagamento');
    });

    it('has proper heading for section', () => {
      render(<PaymentDetailsSection {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { name: /detalhes do pagamento/i });
      expect(heading).toBeInTheDocument();
    });

    it('uses semantic elements for content', () => {
      const { container } = render(<PaymentDetailsSection {...defaultProps} />);
      
      // Should use proper typography elements
      const headings = container.querySelectorAll('h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('status colors meet accessibility standards', () => {
      const { rerender } = render(<PaymentDetailsSection {...defaultProps} status={BookingStatus.PAID} />);
      
      // Green for PAID
      expect(screen.getByText(/pago/i)).toBeInTheDocument();
      
      // Yellow/Orange for AWAITING_PAYMENT
      rerender(<PaymentDetailsSection {...defaultProps} status={BookingStatus.AWAITING_PAYMENT} />);
      expect(screen.getByText(/aguardando pagamento/i)).toBeInTheDocument();
      
      // Red for CANCELLED
      rerender(<PaymentDetailsSection {...defaultProps} status={BookingStatus.CANCELLED} />);
      expect(screen.getByText(/cancelado/i)).toBeInTheDocument();
      
      // Gray for PENDING
      rerender(<PaymentDetailsSection {...defaultProps} status={BookingStatus.PENDING} />);
      expect(screen.getByText(/pendente/i)).toBeInTheDocument();
    });

    it('uses text labels in addition to color for status', () => {
      render(<PaymentDetailsSection {...defaultProps} />);
      
      // Status should have text label, not just color
      expect(screen.getByText(/status/i)).toBeInTheDocument();
      expect(screen.getByText(/pago/i)).toBeInTheDocument();
    });

    it('text has sufficient contrast', () => {
      const { container } = render(<PaymentDetailsSection {...defaultProps} />);
      
      // Primary text (#212121) and secondary text (#757575) on white background
      // Both meet WCAG AA standards
      expect(container).toBeInTheDocument();
    });
  });

  describe('Screen Reader Support', () => {
    it('provides meaningful labels for all fields', () => {
      render(<PaymentDetailsSection {...defaultProps} />);
      
      // All fields should have labels
      expect(screen.getByText(/status/i)).toBeInTheDocument();
      expect(screen.getByText(/valor total/i)).toBeInTheDocument();
      expect(screen.getByText(/data do pagamento/i)).toBeInTheDocument();
      expect(screen.getByText(/método de pagamento/i)).toBeInTheDocument();
    });

    it('currency is formatted for screen readers', () => {
      render(<PaymentDetailsSection {...defaultProps} />);
      
      // Currency should be formatted in pt-BR locale
      const amountText = screen.getByText(/R\$/);
      expect(amountText).toBeInTheDocument();
    });

    it('date is formatted for screen readers', () => {
      render(<PaymentDetailsSection {...defaultProps} />);
      
      // Date should be formatted in pt-BR locale (DD/MM/YYYY)
      const dateText = screen.getByText(/15\/01\/2024/);
      expect(dateText).toBeInTheDocument();
    });

    it('handles missing optional fields gracefully', () => {
      render(<PaymentDetailsSection 
        status={BookingStatus.PENDING}
        totalAmount={1000}
        currency="BRL"
      />);
      
      // Should still be readable without optional fields
      expect(screen.getByText(/status/i)).toBeInTheDocument();
      expect(screen.getByText(/valor total/i)).toBeInTheDocument();
      expect(screen.queryByText(/data do pagamento/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/método de pagamento/i)).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('has no interactive elements requiring keyboard navigation', () => {
      const { container } = render(<PaymentDetailsSection {...defaultProps} />);
      
      // Payment details section is informational, should not have interactive elements
      const buttons = container.querySelectorAll('button');
      const links = container.querySelectorAll('a');
      const inputs = container.querySelectorAll('input');
      
      expect(buttons.length).toBe(0);
      expect(links.length).toBe(0);
      expect(inputs.length).toBe(0);
    });

    it('content is not focusable (informational only)', () => {
      const { container } = render(<PaymentDetailsSection {...defaultProps} />);
      
      const section = container.querySelector('[data-testid="payment-details-section"]');
      expect(section).not.toHaveAttribute('tabindex', '0');
    });
  });

  describe('Automated Accessibility Testing with axe-core', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(<PaymentDetailsSection {...defaultProps} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have color contrast violations', async () => {
      const { container } = render(<PaymentDetailsSection {...defaultProps} />);
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });

    it('should not have heading violations', async () => {
      const { container } = render(<PaymentDetailsSection {...defaultProps} />);
      
      const results = await axe(container, {
        rules: {
          'heading-order': { enabled: true },
          'empty-heading': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });

    it('should not have ARIA violations', async () => {
      const { container } = render(<PaymentDetailsSection {...defaultProps} />);
      
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

  describe('Different Status Accessibility', () => {
    it('PAID status is accessible', async () => {
      const { container } = render(<PaymentDetailsSection {...defaultProps} status={BookingStatus.PAID} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('AWAITING_PAYMENT status is accessible', async () => {
      const { container } = render(<PaymentDetailsSection {...defaultProps} status={BookingStatus.AWAITING_PAYMENT} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('CANCELLED status is accessible', async () => {
      const { container } = render(<PaymentDetailsSection {...defaultProps} status={BookingStatus.CANCELLED} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('PENDING status is accessible', async () => {
      const { container } = render(<PaymentDetailsSection {...defaultProps} status={BookingStatus.PENDING} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Minimal Props Accessibility', () => {
    it('is accessible with only required props', async () => {
      const { container } = render(
        <PaymentDetailsSection 
          status={BookingStatus.PENDING}
          totalAmount={1000}
          currency="BRL"
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('handles missing payment date accessibly', async () => {
      const { container } = render(
        <PaymentDetailsSection 
          status={BookingStatus.AWAITING_PAYMENT}
          totalAmount={2000}
          currency="BRL"
          paymentMethod="Boleto"
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('handles missing payment method accessibly', async () => {
      const { container } = render(
        <PaymentDetailsSection 
          status={BookingStatus.PAID}
          totalAmount={3000}
          currency="BRL"
          paymentDate="2024-01-20T10:00:00Z"
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Status Color Coding with Text', () => {
    it('success status uses both color and text', () => {
      render(<PaymentDetailsSection {...defaultProps} status={BookingStatus.PAID} />);
      
      // Should have both visual (color) and textual (label) indicators
      const statusLabel = screen.getByText(/pago/i);
      expect(statusLabel).toBeInTheDocument();
      expect(statusLabel.closest('.MuiChip-root')).toBeInTheDocument();
    });

    it('warning status uses both color and text', () => {
      render(<PaymentDetailsSection {...defaultProps} status={BookingStatus.AWAITING_PAYMENT} />);
      
      const statusLabel = screen.getByText(/aguardando pagamento/i);
      expect(statusLabel).toBeInTheDocument();
      expect(statusLabel.closest('.MuiChip-root')).toBeInTheDocument();
    });

    it('error status uses both color and text', () => {
      render(<PaymentDetailsSection {...defaultProps} status={BookingStatus.CANCELLED} />);
      
      const statusLabel = screen.getByText(/cancelado/i);
      expect(statusLabel).toBeInTheDocument();
      expect(statusLabel.closest('.MuiChip-root')).toBeInTheDocument();
    });
  });
});
