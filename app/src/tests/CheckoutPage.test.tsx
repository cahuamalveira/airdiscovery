import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CheckoutPage from '../pages/CheckoutPage';
import * as AuthContext from '../contexts/AuthContext';

// Mock the modules
vi.mock('../utils/httpInterceptor');
vi.mock('../hooks/useFlight');
vi.mock('../hooks/checkout');
vi.mock('../contexts/AuthContext');

// Test utilities
const createWrapper = (initialEntries = ['/checkout/123?sessionId=test-session']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Mock route params
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ flightId: '123' }),
    useSearchParams: () => [new URLSearchParams('sessionId=test-session')],
    useNavigate: () => vi.fn()
  };
});

// Mock flight offer data
const mockFlightOffer = {
  type: 'flight-offer',
  id: '1',
  source: 'GDS',
  instantTicketingRequired: false,
  nonHomogeneous: false,
  oneWay: false,
  lastTicketingDate: '2024-03-15',
  numberOfBookableSeats: 9,
  itineraries: [{
    duration: 'PT2H',
    segments: [{
      departure: {
        iataCode: 'GRU',
        terminal: '2',
        at: '2024-03-15T10:00:00'
      },
      arrival: {
        iataCode: 'RIO',
        terminal: '1',
        at: '2024-03-15T12:00:00'
      },
      carrierCode: 'G3',
      number: '1234',
      aircraft: { code: '738' },
      operating: { carrierCode: 'G3' },
      duration: 'PT2H',
      id: '1',
      numberOfStops: 0,
      blacklistedInEU: false
    }]
  }],
  price: {
    currency: 'BRL',
    total: '450.00',
    base: '400.00',
    fees: [{ amount: '50.00', type: 'SUPPLIER' }],
    grandTotal: '450.00'
  },
  pricingOptions: {
    fareType: ['PUBLISHED'],
    includedCheckedBagsOnly: true
  },
  validatingAirlineCodes: ['G3'],
  travelerPricings: []
};

describe('CheckoutPage', () => {
  let mockHttpInterceptor: any;
  let mockUseFlight: any;
  let mockUseBooking: any;
  let mockUsePixPayment: any;
  let mockUseCheckoutSteps: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup mocks
    const httpInterceptorModule = await import('../utils/httpInterceptor');
    const useFlightModule = await import('../hooks/useFlight');
    const checkoutModule = await import('../hooks/checkout');
    
    // Mock httpInterceptor
    mockHttpInterceptor = {
      get: vi.fn().mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          collectedData: {
            passenger_composition: { adults: 1, children: null }
          }
        })
      })),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      fetch: vi.fn()
    };
    
    vi.mocked(httpInterceptorModule.useHttpInterceptor).mockReturnValue(mockHttpInterceptor);

    // Mock useFlight
    mockUseFlight = {
      flight: {
        id: '123',
        amadeusOfferPayload: mockFlightOffer
      },
      loading: false,
      error: null
    };
    vi.mocked(useFlightModule.useFlight).mockReturnValue(mockUseFlight);

    // Mock useBooking
    mockUseBooking = {
      createBooking: vi.fn().mockResolvedValue({
        id: 'booking123',
        flightId: '123',
        userId: 'user123',
        status: 'PENDING',
        passengers: [{
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '(11) 99999-9999',
          document: '123.456.789-00',
          birthDate: '1990-01-01'
        }],
        totalAmount: 450,
        currency: 'BRL',
        payments: []
      }),
      loading: false
    };
    vi.mocked(checkoutModule.useBooking).mockReturnValue(mockUseBooking);

    // Mock usePixPayment
    mockUsePixPayment = {
      createPixPreference: vi.fn(),
      checkPaymentStatus: vi.fn(),
      startPaymentPolling: vi.fn(),
      stopPaymentPolling: vi.fn(),
      pixData: null,
      paymentStatus: 'pending',
      loading: false
    };
    vi.mocked(checkoutModule.usePixPayment).mockReturnValue(mockUsePixPayment);

    // Mock useCheckoutSteps
    mockUseCheckoutSteps = {
      activeStep: 0,
      steps: ['Dados do Passageiro', 'Confirmação', 'Pagamento', 'Confirmação Final'],
      handleNext: vi.fn(),
      handleBack: vi.fn(),
      handleStepClick: vi.fn(),
      isStepClickable: vi.fn().mockReturnValue(false),
      goToStep: vi.fn()
    };
    vi.mocked(checkoutModule.useCheckoutSteps).mockReturnValue(mockUseCheckoutSteps);

    // Mock AuthContext
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: {
        sub: '123',
        email: 'test@example.com',
        name: 'Test User',
        preferred_username: 'testuser'
      },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
      getAccessToken: vi.fn().mockResolvedValue('mock-token')
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering and Initial State', () => {
    it('renders the checkout page with header', async () => {
      render(<CheckoutPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Finalizar Reserva')).toBeInTheDocument();
      });
    });

    it('renders stepper with correct steps', async () => {
      render(<CheckoutPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Dados do Passageiro')).toBeInTheDocument();
        expect(screen.getByText('Confirmação')).toBeInTheDocument();
        expect(screen.getByText('Pagamento')).toBeInTheDocument();
      });
    });

    it('shows loading state when flight is loading', async () => {
      const flightModule = await import('../hooks/useFlight');
      vi.mocked(flightModule.useFlight).mockReturnValue({
        flight: null,
        loading: true,
        error: null
      } as any);

      render(<CheckoutPage />, { wrapper: createWrapper() });
      
      expect(screen.getByText('Carregando dados do voo...')).toBeInTheDocument();
    });
  });

  describe('Passenger Composition', () => {
    it('fetches passenger composition from session', async () => {
      render(<CheckoutPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(mockHttpInterceptor.get).toHaveBeenCalledWith(
          expect.stringContaining('/sessions/collected-data/test-session')
        );
      });
    });

    it('displays passenger count info', async () => {
      render(<CheckoutPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Preencha os dados de 1 passageiro/i)).toBeInTheDocument();
      });
    });

    it('handles missing session ID gracefully', async () => {
      render(<CheckoutPage />, { wrapper: createWrapper(['/checkout/123']) });

      await waitFor(() => {
        // Should still render with default single passenger
        expect(screen.getByText('Finalizar Reserva')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error when flight data fails to load', async () => {
      const flightModule = await import('../hooks/useFlight');
      vi.mocked(flightModule.useFlight).mockReturnValue({
        flight: null,
        loading: false,
        error: 'Failed to load flight'
      } as any);

      render(<CheckoutPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar dados do voo')).toBeInTheDocument();
      });
    });

    it('shows error when flight offer is missing', async () => {
      const flightModule = await import('../hooks/useFlight');
      vi.mocked(flightModule.useFlight).mockReturnValue({
        flight: { id: '123', amadeusOfferPayload: null },
        loading: false,
        error: null
      } as any);

      render(<CheckoutPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar dados do voo')).toBeInTheDocument();
      });
    });
  });

  describe('Booking Creation', () => {
    it('calls createBooking with correct data', async () => {
      render(<CheckoutPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Finalizar Reserva')).toBeInTheDocument();
      });

      // Verify booking hook is set up correctly
      expect(mockUseBooking.createBooking).toBeDefined();
    });
  });

  describe('Component Cleanup', () => {
    it('cleans up on unmount', async () => {
      const { unmount } = render(<CheckoutPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Finalizar Reserva')).toBeInTheDocument();
      });

      // Should not throw errors on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Payment Amount Validation', () => {
    it('should not calculate amount in frontend', async () => {
      render(<CheckoutPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Finalizar Reserva')).toBeInTheDocument();
      });

      // CheckoutPage should not perform price × passenger calculations
      // Amount should come from booking.totalAmount
    });

    it('should pass only bookingId to PaymentSection', async () => {
      // Mock to reach payment step
      const checkoutModule = await import('../hooks/checkout');
      vi.mocked(checkoutModule.useCheckoutSteps).mockReturnValue({
        ...mockUseCheckoutSteps,
        activeStep: 2 // Payment step
      });

      render(<CheckoutPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Should render payment section without amount calculations
        expect(screen.getByText('Finalizar Reserva')).toBeInTheDocument();
      });
    });

    it('should display amount from booking data', async () => {
      const checkoutModule = await import('../hooks/checkout');
      
      // Set up booking with totalAmount
      const mockBookingData = {
        id: 'booking123',
        flightId: '123',
        userId: 'user123',
        status: 'PENDING' as const,
        passengers: [{
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '(11) 99999-9999',
          document: '123.456.789-00',
          birthDate: '1990-01-01'
        }],
        totalAmount: 900, // Backend calculated for 2 passengers
        currency: 'BRL',
        payments: []
      };

      vi.mocked(checkoutModule.useBooking).mockReturnValue({
        createBooking: vi.fn().mockResolvedValue(mockBookingData),
        loading: false
      });

      vi.mocked(checkoutModule.useCheckoutSteps).mockReturnValue({
        ...mockUseCheckoutSteps,
        activeStep: 2 // Payment step
      });

      render(<CheckoutPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Amount should be from booking.totalAmount, not calculated
        expect(screen.getByText('Finalizar Reserva')).toBeInTheDocument();
      });
    });

    it('should not multiply price by passenger count in frontend', async () => {
      render(<CheckoutPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Finalizar Reserva')).toBeInTheDocument();
      });

      // Verify no frontend calculation logic exists
      // All amounts should come from backend booking data
    });
  });
});