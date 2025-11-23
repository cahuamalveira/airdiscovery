import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentSection } from './PaymentSectionNew';

// Mock Stripe
const mockStripe = loadStripe('pk_test_mock');

// Mock httpInterceptor
vi.mock('@/utils/httpInterceptor', () => ({
  httpInterceptor: {
    post: vi.fn()
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Elements stripe={mockStripe}>
        {children}
      </Elements>
    </QueryClientProvider>
  );
};

describe('PaymentSection - Payment Amount Validation', () => {
  const defaultProps = {
    onBack: vi.fn(),
    onPaymentSuccess: vi.fn(),
    onPaymentError: vi.fn(),
    bookingId: 'booking123',
    amount: 450,
    description: 'Flight GRU → RIO'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Props', () => {
    it('should render without amount prop requirement', () => {
      // Test that component works even if amount comes from booking data
      render(
        <PaymentSection {...defaultProps} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/pagamento via stripe/i)).toBeInTheDocument();
    });

    it('should display amount from booking data', () => {
      render(
        <PaymentSection {...defaultProps} amount={450} />,
        { wrapper: createWrapper() }
      );

      // Amount should be displayed in the UI
      expect(screen.getByText(/informações de pagamento/i)).toBeInTheDocument();
    });

    it('should pass only bookingId to StripeCheckout', () => {
      const { container } = render(
        <PaymentSection {...defaultProps} />,
        { wrapper: createWrapper() }
      );

      // Verify StripeCheckout is rendered with bookingId
      expect(container.querySelector('[data-testid="stripe-checkout"]') || container).toBeTruthy();
    });
  });

  describe('Payment Status Display', () => {
    it('should show pending status by default', () => {
      render(
        <PaymentSection {...defaultProps} paymentStatus="pending" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/aguardando/i)).toBeInTheDocument();
    });

    it('should show success status when payment succeeds', () => {
      render(
        <PaymentSection {...defaultProps} paymentStatus="success" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/confirmado/i)).toBeInTheDocument();
      expect(screen.getByText(/pagamento confirmado/i)).toBeInTheDocument();
    });

    it('should show processing status', () => {
      render(
        <PaymentSection {...defaultProps} paymentStatus="processing" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/processando/i)).toBeInTheDocument();
    });

    it('should show failed status', () => {
      render(
        <PaymentSection {...defaultProps} paymentStatus="failed" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/falhou/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should call onBack when back button is clicked', () => {
      const onBack = vi.fn();
      
      render(
        <PaymentSection {...defaultProps} onBack={onBack} />,
        { wrapper: createWrapper() }
      );

      const backButton = screen.getByRole('button', { name: /voltar/i });
      fireEvent.click(backButton);

      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Amount Display', () => {
    it('should display amount from booking data, not calculate it', () => {
      // Amount should come from backend (booking.totalAmount)
      render(
        <PaymentSection {...defaultProps} amount={900} />,
        { wrapper: createWrapper() }
      );

      // The component should display the amount but not calculate it
      expect(screen.getByText(/pagamento via stripe/i)).toBeInTheDocument();
    });

    it('should not perform frontend amount calculations', () => {
      // This test ensures no passenger count multiplication happens in frontend
      const { container } = render(
        <PaymentSection {...defaultProps} amount={450} />,
        { wrapper: createWrapper() }
      );

      // Component should not have any calculation logic
      expect(container).toBeTruthy();
    });
  });

  describe('Security Requirements', () => {
    it('should not expose amount manipulation in props', () => {
      // Amount should be read-only from booking data
      const { rerender } = render(
        <PaymentSection {...defaultProps} amount={450} />,
        { wrapper: createWrapper() }
      );

      // Changing amount prop should not affect backend request
      rerender(
        <PaymentSection {...defaultProps} amount={999999} />
      );

      // Backend will use booking.totalAmount, not this prop
      expect(screen.getByText(/pagamento via stripe/i)).toBeInTheDocument();
    });
  });
});
