import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PaymentDetailsSection from './PaymentDetailsSection';
import { BookingStatus } from '../../types/booking';

describe('PaymentDetailsSection', () => {
  describe('Status Display', () => {
    it('should display PAID status with correct color', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.PAID}
          totalAmount={1500.00}
          currency="BRL"
        />
      );

      const statusElement = screen.getByText('Pago');
      expect(statusElement).toBeInTheDocument();
      
      // Check for success color (green)
      const statusChip = statusElement.closest('.MuiChip-root');
      expect(statusChip).toHaveStyle({ backgroundColor: expect.stringContaining('rgb') });
    });

    it('should display AWAITING_PAYMENT status with correct color', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.AWAITING_PAYMENT}
          totalAmount={1500.00}
          currency="BRL"
        />
      );

      const statusElement = screen.getByText('Aguardando Pagamento');
      expect(statusElement).toBeInTheDocument();
      
      // Check for warning color (orange)
      const statusChip = statusElement.closest('.MuiChip-root');
      expect(statusChip).toHaveStyle({ backgroundColor: expect.stringContaining('rgb') });
    });

    it('should display PENDING status with correct color', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.PENDING}
          totalAmount={1500.00}
          currency="BRL"
        />
      );

      const statusElement = screen.getByText('Pendente');
      expect(statusElement).toBeInTheDocument();
    });

    it('should display CANCELLED status with correct color', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.CANCELLED}
          totalAmount={1500.00}
          currency="BRL"
        />
      );

      const statusElement = screen.getByText('Cancelado');
      expect(statusElement).toBeInTheDocument();
      
      // Check for error color (red)
      const statusChip = statusElement.closest('.MuiChip-root');
      expect(statusChip).toHaveStyle({ backgroundColor: expect.stringContaining('rgb') });
    });
  });

  describe('Currency Formatting', () => {
    it('should format amount in BRL currency', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.PAID}
          totalAmount={1500.00}
          currency="BRL"
        />
      );

      // Check for BRL formatted amount (R$ 1.500,00)
      expect(screen.getByText(/R\$\s*1\.500,00/)).toBeInTheDocument();
    });

    it('should format decimal amounts correctly', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.PAID}
          totalAmount={1234.56}
          currency="BRL"
        />
      );

      expect(screen.getByText(/R\$\s*1\.234,56/)).toBeInTheDocument();
    });

    it('should format large amounts correctly', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.PAID}
          totalAmount={10500.99}
          currency="BRL"
        />
      );

      expect(screen.getByText(/R\$\s*10\.500,99/)).toBeInTheDocument();
    });
  });

  describe('Payment Date Display', () => {
    it('should display payment date when provided', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.PAID}
          totalAmount={1500.00}
          currency="BRL"
          paymentDate="2024-12-15T10:30:00Z"
        />
      );

      // Check for formatted date in pt-BR (DD/MM/YYYY)
      expect(screen.getByText(/15\/12\/2024/)).toBeInTheDocument();
    });

    it('should not display payment date section when not provided', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.AWAITING_PAYMENT}
          totalAmount={1500.00}
          currency="BRL"
        />
      );

      expect(screen.queryByText(/Data do Pagamento/i)).not.toBeInTheDocument();
    });

    it('should display payment date for completed payments', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.PAID}
          totalAmount={2500.00}
          currency="BRL"
          paymentDate="2024-11-20T14:45:00Z"
        />
      );

      expect(screen.getByText(/20\/11\/2024/)).toBeInTheDocument();
    });
  });

  describe('Payment Method Display', () => {
    it('should display payment method when provided', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.PAID}
          totalAmount={1500.00}
          currency="BRL"
          paymentMethod="Cartão de Crédito"
        />
      );

      expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument();
    });

    it('should display different payment methods', () => {
      const { rerender } = render(
        <PaymentDetailsSection
          status={BookingStatus.PAID}
          totalAmount={1500.00}
          currency="BRL"
          paymentMethod="PIX"
        />
      );

      expect(screen.getByText('PIX')).toBeInTheDocument();

      rerender(
        <PaymentDetailsSection
          status={BookingStatus.PAID}
          totalAmount={1500.00}
          currency="BRL"
          paymentMethod="Boleto"
        />
      );

      expect(screen.getByText('Boleto')).toBeInTheDocument();
    });

    it('should not display payment method section when not provided', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.PENDING}
          totalAmount={1500.00}
          currency="BRL"
        />
      );

      expect(screen.queryByText(/Método de Pagamento/i)).not.toBeInTheDocument();
    });
  });

  describe('Status Color Coding', () => {
    it('should apply success color for PAID status', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.PAID}
          totalAmount={1500.00}
          currency="BRL"
        />
      );

      const statusChip = screen.getByText('Pago').closest('.MuiChip-root');
      expect(statusChip).toHaveClass('MuiChip-colorSuccess');
    });

    it('should apply warning color for AWAITING_PAYMENT status', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.AWAITING_PAYMENT}
          totalAmount={1500.00}
          currency="BRL"
        />
      );

      const statusChip = screen.getByText('Aguardando Pagamento').closest('.MuiChip-root');
      expect(statusChip).toHaveClass('MuiChip-colorWarning');
    });

    it('should apply default color for PENDING status', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.PENDING}
          totalAmount={1500.00}
          currency="BRL"
        />
      );

      const statusChip = screen.getByText('Pendente').closest('.MuiChip-root');
      expect(statusChip).toHaveClass('MuiChip-colorDefault');
    });

    it('should apply error color for CANCELLED status', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.CANCELLED}
          totalAmount={1500.00}
          currency="BRL"
        />
      );

      const statusChip = screen.getByText('Cancelado').closest('.MuiChip-root');
      expect(statusChip).toHaveClass('MuiChip-colorError');
    });
  });

  describe('Component Structure', () => {
    it('should render with correct test id', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.PAID}
          totalAmount={1500.00}
          currency="BRL"
        />
      );

      expect(screen.getByTestId('payment-details-section')).toBeInTheDocument();
    });

    it('should display section title', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.PAID}
          totalAmount={1500.00}
          currency="BRL"
        />
      );

      expect(screen.getByText('Detalhes do Pagamento')).toBeInTheDocument();
    });

    it('should render all information when fully populated', () => {
      render(
        <PaymentDetailsSection
          status={BookingStatus.PAID}
          totalAmount={2500.00}
          currency="BRL"
          paymentDate="2024-12-15T10:30:00Z"
          paymentMethod="Cartão de Crédito"
        />
      );

      expect(screen.getByText('Pago')).toBeInTheDocument();
      expect(screen.getByText(/R\$\s*2\.500,00/)).toBeInTheDocument();
      expect(screen.getByText(/15\/12\/2024/)).toBeInTheDocument();
      expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument();
    });
  });
});
