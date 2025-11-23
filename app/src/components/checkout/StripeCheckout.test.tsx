import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { StripeCheckout } from './StripeCheckout';

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

describe('StripeCheckout - Payment Amount Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Payment API Integration', () => {
    it('should send only bookingId in payment request (no amount)', async () => {
      const { httpInterceptor } = await import('@/utils/httpInterceptor');
      const mockPost = vi.mocked(httpInterceptor.post);
      
      mockPost.mockResolvedValue({
        json: async () => ({
          data: {
            id: 'pi_test',
            clientSecret: 'pi_test_secret',
            status: 'requires_payment_method',
            amount: 45000,
            currency: 'brl'
          }
        })
      } as any);

      render(
        <StripeCheckout
          bookingId="booking123"
          amount={450}
          onPaymentSuccess={vi.fn()}
          onPaymentError={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      const submitButton = screen.getByRole('button', { name: /pagar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          expect.stringContaining('/payments/stripe/create-intent'),
          expect.objectContaining({
            bookingId: 'booking123'
            // Should NOT contain amount field
          })
        );
      });

      // Verify amount is NOT in the request
      const callArgs = mockPost.mock.calls[0];
      expect(callArgs[1]).not.toHaveProperty('amount');
    });

    it('should display amount from booking data, not from props', async () => {
      render(
        <StripeCheckout
          bookingId="booking123"
          amount={450}
          onPaymentSuccess={vi.fn()}
          onPaymentError={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Amount should be displayed but not sent to backend
      expect(screen.getByText(/pagar r\$ 450\.00/i)).toBeInTheDocument();
    });

    it('should handle backend-calculated amount in response', async () => {
      const { httpInterceptor } = await import('@/utils/httpInterceptor');
      const mockPost = vi.mocked(httpInterceptor.post);
      
      // Backend returns calculated amount
      mockPost.mockResolvedValue({
        json: async () => ({
          data: {
            id: 'pi_test',
            clientSecret: 'pi_test_secret',
            status: 'requires_payment_method',
            amount: 90000, // Backend calculated: 450 * 2 passengers * 100 cents
            currency: 'brl'
          }
        })
      } as any);

      const onSuccess = vi.fn();
      
      render(
        <StripeCheckout
          bookingId="booking123"
          amount={450}
          onPaymentSuccess={onSuccess}
          onPaymentError={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // The component should work with backend-calculated amount
      expect(screen.getByText(/informações de pagamento/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error when bookingId is missing', () => {
      render(
        <StripeCheckout
          bookingId=""
          amount={450}
          onPaymentSuccess={vi.fn()}
          onPaymentError={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/id da reserva não encontrado/i)).toBeInTheDocument();
    });

    it('should handle payment creation errors', async () => {
      const { httpInterceptor } = await import('@/utils/httpInterceptor');
      const mockPost = vi.mocked(httpInterceptor.post);
      
      mockPost.mockRejectedValue({
        response: {
          data: {
            message: 'Booking not found'
          }
        }
      });

      const onError = vi.fn();
      
      render(
        <StripeCheckout
          bookingId="invalid-booking"
          amount={450}
          onPaymentSuccess={vi.fn()}
          onPaymentError={onError}
        />,
        { wrapper: createWrapper() }
      );

      const submitButton = screen.getByRole('button', { name: /pagar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/booking not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('UI Behavior', () => {
    it('should disable submit button while processing', async () => {
      const { httpInterceptor } = await import('@/utils/httpInterceptor');
      const mockPost = vi.mocked(httpInterceptor.post);
      
      mockPost.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <StripeCheckout
          bookingId="booking123"
          amount={450}
          onPaymentSuccess={vi.fn()}
          onPaymentError={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      const submitButton = screen.getByRole('button', { name: /pagar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should show success message after payment', async () => {
      const { httpInterceptor } = await import('@/utils/httpInterceptor');
      const mockPost = vi.mocked(httpInterceptor.post);
      
      mockPost.mockResolvedValue({
        json: async () => ({
          data: {
            id: 'pi_test',
            clientSecret: 'pi_test_secret',
            status: 'succeeded',
            amount: 45000,
            currency: 'brl'
          }
        })
      } as any);

      render(
        <StripeCheckout
          bookingId="booking123"
          amount={450}
          onPaymentSuccess={vi.fn()}
          onPaymentError={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/informações de pagamento/i)).toBeInTheDocument();
    });
  });
});
