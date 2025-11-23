import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import FlightSearch from '../pages/FlightSearch';
import * as AuthContext from '../contexts/AuthContext';
import type { AuthContextType } from '../types/auth';

// Mock AuthContext
vi.mock('../contexts/AuthContext');

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock date-fns functions
vi.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => {
    if (formatStr === 'yyyy-MM-dd') {
      return date.toISOString().split('T')[0];
    }
    return date.toLocaleDateString();
  },
  addYears: (date: Date, years: number) => {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  },
  addDays: (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
}));

// Mock AuthContext for authenticated user
const mockAuthenticatedContext: AuthContextType = {
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

// Mock AuthContext for unauthenticated user
const mockUnauthenticatedContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false
};

// Test utilities
const createWrapper = (authContext = mockAuthenticatedContext, initialEntries = ['/search']) => {
  // Mock useAuth hook
  vi.mocked(AuthContext.useAuth).mockReturnValue(authContext as any);
  
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );
};

describe.skip('FlightSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering and Initial State', () => {
    it('renders the flight search page with form fields', () => {
      render(<FlightSearch />, { wrapper: createWrapper() });

      expect(screen.getByText('Buscar Voos')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('De onde você vai partir?')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Para onde você vai?')).toBeInTheDocument();
      expect(screen.getByText('Buscar Voos')).toBeInTheDocument();
    });

    it('extracts destination from URL parameters', () => {
      render(<FlightSearch />, { 
        wrapper: createWrapper(mockAuthenticatedContext, ['/search?destination=Rio de Janeiro'])
      });

      // The destination field should be populated from URL
      expect(screen.getByDisplayValue('Rio de Janeiro')).toBeInTheDocument();
    });
  });

  describe('Flight Search Functionality', () => {
    it('performs flight search and displays results', async () => {
      const user = userEvent.setup();
      render(<FlightSearch />, { wrapper: createWrapper() });

      // Fill search form
      const originInput = screen.getByPlaceholderText('De onde você vai partir?');
      const destinationInput = screen.getByPlaceholderText('Para onde você vai?');
      
      await user.type(originInput, 'São Paulo');
      await user.type(destinationInput, 'Rio de Janeiro');

      // Click search button
      const searchButton = screen.getByRole('button', { name: /buscar voos/i });
      await user.click(searchButton);

      // Should show loading state
      expect(screen.getByText('Buscando...')).toBeInTheDocument();

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText(/voos encontrados/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      // Should display flight cards
      expect(screen.getAllByText('Selecionar Voo')).toHaveLength(expect.any(Number));
    });

    it('shows no results message when no flights found', async () => {
      const user = userEvent.setup();
      render(<FlightSearch />, { wrapper: createWrapper() });

      // Search for a route that won't have results
      const originInput = screen.getByPlaceholderText('De onde você vai partir?');
      const destinationInput = screen.getByPlaceholderText('Para onde você vai?');
      
      await user.type(originInput, 'NonExistentCity');
      await user.type(destinationInput, 'AnotherNonExistentCity');

      const searchButton = screen.getByRole('button', { name: /buscar voos/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/nenhum voo encontrado/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Flight Selection', () => {
    const setupFlightResults = async () => {
      const user = userEvent.setup();
      render(<FlightSearch />, { wrapper: createWrapper() });

      // Fill and search
      const originInput = screen.getByPlaceholderText('De onde você vai partir?');
      const destinationInput = screen.getByPlaceholderText('Para onde você vai?');
      
      await user.type(originInput, 'São Paulo');
      await user.type(destinationInput, 'Rio de Janeiro');

      const searchButton = screen.getByRole('button', { name: /buscar voos/i });
      await user.click(searchButton);

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText(/voos encontrados/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      return user;
    };

    it('navigates to checkout when authenticated user selects flight', async () => {
      const user = await setupFlightResults();

      // Click first "Selecionar Voo" button
      const selectButtons = screen.getAllByText('Selecionar Voo');
      await user.click(selectButtons[0]);

      // Should navigate to checkout with flight ID
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/^\/checkout\/flight-\d+\/any$/),
        expect.objectContaining({
          state: expect.objectContaining({
            flightDetails: expect.any(Object),
            selectedDate: null
          })
        })
      );
    });

    it('redirects to auth when unauthenticated user tries to select flight', async () => {
      const user = userEvent.setup();
      render(<FlightSearch />, { wrapper: createWrapper(mockUnauthenticatedContext) });

      // Fill and search
      const originInput = screen.getByPlaceholderText('De onde você vai partir?');
      const destinationInput = screen.getByPlaceholderText('Para onde você vai?');
      
      await user.type(originInput, 'São Paulo');
      await user.type(destinationInput, 'Rio de Janeiro');

      const searchButton = screen.getByRole('button', { name: /buscar voos/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/voos encontrados/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      // Click select flight
      const selectButtons = screen.getAllByText('Selecionar Voo');
      await user.click(selectButtons[0]);

      // Should redirect to auth
      expect(mockNavigate).toHaveBeenCalledWith('/auth');
    });

    it('includes selected date in navigation when date is chosen', async () => {
      const user = userEvent.setup();
      render(<FlightSearch />, { wrapper: createWrapper() });

      // Fill form including date
      const originInput = screen.getByPlaceholderText('De onde você vai partir?');
      const destinationInput = screen.getByPlaceholderText('Para onde você vai?');
      
      await user.type(originInput, 'São Paulo');
      await user.type(destinationInput, 'Rio de Janeiro');

      // Set a date (you may need to adjust this based on your DatePicker implementation)
      const dateInput = screen.getByLabelText(/data/i);
      fireEvent.change(dateInput, { target: { value: '2024-03-15' } });

      const searchButton = screen.getByRole('button', { name: /buscar voos/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/voos encontrados/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      const selectButtons = screen.getAllByText('Selecionar Voo');
      await user.click(selectButtons[0]);

      // Should include the selected date
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/^\/checkout\/flight-\d+\/2024-03-15$/),
        expect.any(Object)
      );
    });
  });

  describe('Wishlist Functionality', () => {
    const setupFlightResults = async () => {
      const user = userEvent.setup();
      render(<FlightSearch />, { wrapper: createWrapper() });

      const originInput = screen.getByPlaceholderText('De onde você vai partir?');
      const destinationInput = screen.getByPlaceholderText('Para onde você vai?');
      
      await user.type(originInput, 'São Paulo');
      await user.type(destinationInput, 'Rio de Janeiro');

      const searchButton = screen.getByRole('button', { name: /buscar voos/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/voos encontrados/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      return user;
    };

    it('saves flight to wishlist when authenticated', async () => {
      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      const user = await setupFlightResults();

      // Click "Salvar" button
      const saveButtons = screen.getAllByText('Salvar');
      await user.click(saveButtons[0]);

      // Should show success alert
      expect(alertSpy).toHaveBeenCalledWith('Voo adicionado à lista de desejos!');

      // Check localStorage
      const savedFlights = JSON.parse(localStorage.getItem('savedFlights') || '[]');
      expect(savedFlights).toHaveLength(1);
      expect(savedFlights[0]).toMatchObject({
        id: expect.any(String),
        origin: expect.any(String),
        destination: expect.any(String),
        date: 'any'
      });

      alertSpy.mockRestore();
    });

    it('prevents duplicate saves to wishlist', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      const user = await setupFlightResults();

      const saveButtons = screen.getAllByText('Salvar');
      
      // Save flight first time
      await user.click(saveButtons[0]);
      expect(alertSpy).toHaveBeenCalledWith('Voo adicionado à lista de desejos!');

      // Try to save same flight again
      await user.click(saveButtons[0]);
      expect(alertSpy).toHaveBeenLastCalledWith('Este voo já está na sua lista de desejos.');

      alertSpy.mockRestore();
    });

    it('redirects to auth when unauthenticated user tries to save flight', async () => {
      const user = userEvent.setup();
      render(<FlightSearch />, { wrapper: createWrapper(mockUnauthenticatedContext) });

      const originInput = screen.getByPlaceholderText('De onde você vai partir?');
      const destinationInput = screen.getByPlaceholderText('Para onde você vai?');
      
      await user.type(originInput, 'São Paulo');
      await user.type(destinationInput, 'Rio de Janeiro');

      const searchButton = screen.getByRole('button', { name: /buscar voos/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/voos encontrados/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      // Click save
      const saveButtons = screen.getAllByText('Salvar');
      await user.click(saveButtons[0]);

      // Should redirect to auth
      expect(mockNavigate).toHaveBeenCalledWith('/auth');
    });
  });

  describe('Flight Information Display', () => {
    it('displays flight information correctly', async () => {
      const user = userEvent.setup();
      render(<FlightSearch />, { wrapper: createWrapper() });

      const originInput = screen.getByPlaceholderText('De onde você vai partir?');
      const destinationInput = screen.getByPlaceholderText('Para onde você vai?');
      
      await user.type(originInput, 'São Paulo');
      await user.type(destinationInput, 'Rio de Janeiro');

      const searchButton = screen.getByRole('button', { name: /buscar voos/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/voos encontrados/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      // Should display price
      expect(screen.getAllByText(/R\$ 500,00/)).toHaveLength(expect.any(Number));
      
      // Should display duration
      expect(screen.getAllByText(/Duração:/)).toHaveLength(expect.any(Number));

      // Should display airline information
      expect(screen.getAllByText(/GOL|LATAM|Azul/)).toHaveLength(expect.any(Number));
    });
  });

  describe('Form Validation', () => {
    it('handles empty search gracefully', async () => {
      const user = userEvent.setup();
      render(<FlightSearch />, { wrapper: createWrapper() });

      // Search without filling any fields
      const searchButton = screen.getByRole('button', { name: /buscar voos/i });
      await user.click(searchButton);

      await waitFor(() => {
        // Should still perform search (returns all flights or filtered results)
        expect(screen.getByText(/voos encontrados/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});