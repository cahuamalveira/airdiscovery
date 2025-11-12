import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CheckoutPage from '../pages/CheckoutPage';
import { AuthContext } from '../contexts/AuthContext';
import type { AuthContextType } from '../types/auth';

// Mock the API hooks
vi.mock('../hooks/useHttpInterceptor', () => ({
  useHttpInterceptor: () => ({
    post: vi.fn(),
    get: vi.fn(),
  })
}));

// Mock Auth context
const mockAuthContext: AuthContextType = {
  user: {
    sub: '123',
    email: 'test@example.com',
    name: 'Test User',
    preferred_username: 'testuser'
  },
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false
};

// Test utilities
const createWrapper = (initialEntries = ['/checkout?flightId=123']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

// Mock flight data
const mockFlightData = {
  id: '123',
  airline: 'GOL',
  flightNumber: 'G3 1234',
  origin: 'GRU',
  destination: 'RIO',
  departure: '2024-03-15T10:00:00Z',
  arrival: '2024-03-15T12:00:00Z',
  price: 450.00,
  currency: 'BRL',
  duration: '2h 00m',
  aircraft: 'Boeing 737'
};

describe('CheckoutPage', () => {
  let mockPost: any;
  let mockGet: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup API mocks
    const useHttpInterceptor = vi.mocked(
      await import('../hooks/useHttpInterceptor')
    ).useHttpInterceptor;
    
    mockPost = vi.fn();
    mockGet = vi.fn();
    
    useHttpInterceptor.mockReturnValue({
      post: mockPost,
      get: mockGet
    });

    // Mock flight data fetch
    mockGet.mockResolvedValueOnce({
      data: mockFlightData
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering and Initial State', () => {
    it('renders the checkout page with stepper', async () => {
      render(<CheckoutPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Checkout')).toBeInTheDocument();
        expect(screen.getByText('Detalhes do Voo')).toBeInTheDocument();
        expect(screen.getByText('Informações do Passageiro')).toBeInTheDocument();
        expect(screen.getByText('Pagamento')).toBeInTheDocument();
      });
    });

    it('displays flight information correctly', async () => {
      render(<CheckoutPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('GOL G3 1234')).toBeInTheDocument();
        expect(screen.getByText('GRU → RIO')).toBeInTheDocument();
        expect(screen.getByText('R$ 450,00')).toBeInTheDocument();
        expect(screen.getByText('2h 00m')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      render(<CheckoutPage />, { wrapper: createWrapper() });
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates required passenger information fields', async () => {
      render(<CheckoutPage />, { wrapper: createWrapper() });
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Detalhes do Voo')).toBeInTheDocument();
      });

      // Navigate to passenger info step
      const nextButton = screen.getByRole('button', { name: /próximo/i });
      await user.click(nextButton);

      // Try to proceed without filling required fields
      const continueButton = screen.getByRole('button', { name: /continuar/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
        expect(screen.getByText('Sobrenome é obrigatório')).toBeInTheDocument();
        expect(screen.getByText('CPF é obrigatório')).toBeInTheDocument();
        expect(screen.getByText('E-mail é obrigatório')).toBeInTheDocument();
      });
    });

    it('validates CPF format', async () => {
      render(<CheckoutPage />, { wrapper: createWrapper() });
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Detalhes do Voo')).toBeInTheDocument();
      });

      // Navigate to passenger info step
      const nextButton = screen.getByRole('button', { name: /próximo/i });
      await user.click(nextButton);

      // Enter invalid CPF
      const cpfInput = screen.getByLabelText(/cpf/i);
      await user.type(cpfInput, '123456789');

      const continueButton = screen.getByRole('button', { name: /continuar/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('CPF inválido')).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      render(<CheckoutPage />, { wrapper: createWrapper() });
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Detalhes do Voo')).toBeInTheDocument();
      });

      // Navigate to passenger info step
      const nextButton = screen.getByRole('button', { name: /próximo/i });
      await user.click(nextButton);

      // Enter invalid email
      const emailInput = screen.getByLabelText(/e-mail/i);
      await user.type(emailInput, 'invalid-email');

      const continueButton = screen.getByRole('button', { name: /continuar/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('E-mail inválido')).toBeInTheDocument();
      });
    });

    it('accepts valid passenger information', async () => {
      render(<CheckoutPage />, { wrapper: createWrapper() });
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Detalhes do Voo')).toBeInTheDocument();
      });

      // Navigate to passenger info step
      const nextButton = screen.getByRole('button', { name: /próximo/i });
      await user.click(nextButton);

      // Fill valid passenger information
      await user.type(screen.getByLabelText(/nome/i), 'João');
      await user.type(screen.getByLabelText(/sobrenome/i), 'Silva');
      await user.type(screen.getByLabelText(/cpf/i), '12345678901');
      await user.type(screen.getByLabelText(/e-mail/i), 'joao@example.com');
      await user.type(screen.getByLabelText(/telefone/i), '11999999999');

      const continueButton = screen.getByRole('button', { name: /continuar/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Pagamento')).toBeInTheDocument();
      });
    });
  });

  describe('Payment Flow', () => {
    const setupPaymentStep = async () => {
      const user = userEvent.setup();
      render(<CheckoutPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Detalhes do Voo')).toBeInTheDocument();
      });

      // Navigate to passenger info
      let nextButton = screen.getByRole('button', { name: /próximo/i });
      await user.click(nextButton);

      // Fill passenger info
      await user.type(screen.getByLabelText(/nome/i), 'João');
      await user.type(screen.getByLabelText(/sobrenome/i), 'Silva');
      await user.type(screen.getByLabelText(/cpf/i), '12345678901');
      await user.type(screen.getByLabelText(/e-mail/i), 'joao@example.com');

      // Continue to payment
      const continueButton = screen.getByRole('button', { name: /continuar/i });
      await user.click(continueButton);

      return user;
    };

    it('creates booking and shows QR code on payment', async () => {
      const user = await setupPaymentStep();

      // Mock booking creation and payment preference
      mockPost
        .mockResolvedValueOnce({
          data: { 
            id: 'booking123',
            status: 'PENDING_PAYMENT',
            totalPrice: 450.00
          }
        })
        .mockResolvedValueOnce({
          data: {
            id: 'preference123',
            qrCode: 'data:image/png;base64,mockqrcode',
            qrCodeString: '00020126123456789'
          }
        });

      await waitFor(() => {
        expect(screen.getByText('Pagamento')).toBeInTheDocument();
      });

      // Click pay button
      const payButton = screen.getByRole('button', { name: /finalizar reserva/i });
      await user.click(payButton);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/bookings', expect.objectContaining({
          flightId: '123',
          passenger: expect.objectContaining({
            firstName: 'João',
            lastName: 'Silva',
            cpf: '12345678901',
            email: 'joao@example.com'
          })
        }));
      });

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/payments/create-preference', {
          bookingId: 'booking123'
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/escaneie o qr code/i)).toBeInTheDocument();
        expect(screen.getByAltText(/qr code/i)).toBeInTheDocument();
      });
    });

    it('polls payment status and shows success message', async () => {
      const user = await setupPaymentStep();

      // Mock booking creation, payment preference, and status polling
      mockPost
        .mockResolvedValueOnce({
          data: { 
            id: 'booking123',
            status: 'PENDING_PAYMENT',
            totalPrice: 450.00
          }
        })
        .mockResolvedValueOnce({
          data: {
            id: 'preference123',
            qrCode: 'data:image/png;base64,mockqrcode',
            qrCodeString: '00020126123456789'
          }
        });

      // Mock payment status polling
      mockGet
        .mockResolvedValueOnce({ data: mockFlightData }) // Initial flight fetch
        .mockResolvedValueOnce({ 
          data: { status: 'PENDING_PAYMENT' }
        })
        .mockResolvedValueOnce({ 
          data: { status: 'CONFIRMED' }
        });

      const payButton = screen.getByRole('button', { name: /finalizar reserva/i });
      await user.click(payButton);

      // Wait for QR code to appear
      await waitFor(() => {
        expect(screen.getByAltText(/qr code/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Wait for payment confirmation (should poll and find confirmed status)
      await waitFor(() => {
        expect(screen.getByText(/pagamento confirmado/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('handles payment errors gracefully', async () => {
      const user = await setupPaymentStep();

      // Mock booking creation success but payment preference failure
      mockPost
        .mockResolvedValueOnce({
          data: { 
            id: 'booking123',
            status: 'PENDING_PAYMENT',
            totalPrice: 450.00
          }
        })
        .mockRejectedValueOnce(new Error('Payment service unavailable'));

      const payButton = screen.getByRole('button', { name: /finalizar reserva/i });
      await user.click(payButton);

      await waitFor(() => {
        expect(screen.getByText(/erro ao processar pagamento/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('allows going back to previous steps', async () => {
      const user = userEvent.setup();
      render(<CheckoutPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Detalhes do Voo')).toBeInTheDocument();
      });

      // Go to step 2
      const nextButton = screen.getByRole('button', { name: /próximo/i });
      await user.click(nextButton);

      expect(screen.getByText('Informações do Passageiro')).toBeInTheDocument();

      // Go back to step 1
      const backButton = screen.getByRole('button', { name: /voltar/i });
      await user.click(backButton);

      expect(screen.getByText('Detalhes do Voo')).toBeInTheDocument();
    });

    it('redirects to home when no flight ID provided', () => {
      render(<CheckoutPage />, { 
        wrapper: createWrapper(['/checkout']) 
      });

      // Should redirect since no flightId in URL
      expect(window.location.pathname).toBe('/checkout');
    });
  });

  describe('Price Calculation', () => {
    it('displays correct total price with taxes', async () => {
      render(<CheckoutPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('R$ 450,00')).toBeInTheDocument();
        // Check for tax breakdown (assuming 10% tax)
        expect(screen.getByText(/taxas/i)).toBeInTheDocument();
        expect(screen.getByText('R$ 495,00')).toBeInTheDocument(); // 450 + 45 tax
      });
    });
  });
});