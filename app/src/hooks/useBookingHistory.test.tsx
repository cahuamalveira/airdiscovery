import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBookingHistory } from './useBookingHistory';
import * as bookingApi from '../services/bookingApi';
import type { BookingHistoryResponse, BookingStatus } from '../types/booking';
import React from 'react';

// Mock the bookingApi module
vi.mock('../services/bookingApi');

describe('useBookingHistory', () => {
  let queryClient: QueryClient;

  const mockBookingData: BookingHistoryResponse = {
    statusCode: 200,
    message: 'Reservas encontradas',
    data: [
      {
        id: 'booking-1',
        flightId: 'flight-1',
        userId: 'user-1',
        status: 'PAID' as BookingStatus,
        passengers: [
          {
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao@example.com',
            phone: '11999999999',
            document: '12345678901',
            birthDate: '1990-01-01',
          },
        ],
        totalAmount: 45000,
        currency: 'BRL',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'booking-2',
        flightId: 'flight-2',
        userId: 'user-1',
        status: 'AWAITING_PAYMENT' as BookingStatus,
        passengers: [
          {
            firstName: 'Maria',
            lastName: 'Santos',
            email: 'maria@example.com',
            phone: '11988888888',
            document: '98765432109',
            birthDate: '1985-05-15',
          },
        ],
        totalAmount: 32000,
        currency: 'BRL',
        createdAt: '2024-01-10T14:30:00Z',
        updatedAt: '2024-01-10T14:30:00Z',
      },
    ],
    meta: {
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    // Create a new QueryClient for each test to ensure isolation
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retry for tests by default
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Data Fetching', () => {
    it('should fetch bookings successfully', async () => {
      vi.mocked(bookingApi.getBookings).mockResolvedValueOnce(mockBookingData);

      const { result } = renderHook(() => useBookingHistory(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.bookings).toEqual([]);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.bookings).toEqual(mockBookingData.data);
      expect(result.current.meta).toEqual(mockBookingData.meta);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle empty booking list', async () => {
      const emptyResponse: BookingHistoryResponse = {
        statusCode: 200,
        message: 'Nenhuma reserva encontrada',
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      };

      vi.mocked(bookingApi.getBookings).mockResolvedValueOnce(emptyResponse);

      const { result } = renderHook(() => useBookingHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.bookings).toEqual([]);
      expect(result.current.meta.total).toBe(0);
      expect(result.current.isError).toBe(false);
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching', async () => {
      vi.mocked(bookingApi.getBookings).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockBookingData), 100))
      );

      const { result } = renderHook(() => useBookingHistory(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.bookings).toEqual([]);
      expect(result.current.isError).toBe(false);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.bookings).toEqual(mockBookingData.data);
    });
  });

  describe('Error State', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      vi.mocked(bookingApi.getBookings).mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useBookingHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.bookings).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle 500 server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      };
      vi.mocked(bookingApi.getBookings).mockRejectedValueOnce(serverError);

      const { result } = renderHook(() => useBookingHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.bookings).toEqual([]);
    });

    it('should handle 401 authentication errors', async () => {
      const authError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };
      vi.mocked(bookingApi.getBookings).mockRejectedValueOnce(authError);

      const { result } = renderHook(() => useBookingHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Pagination Parameters', () => {
    it('should fetch bookings with default pagination parameters', async () => {
      vi.mocked(bookingApi.getBookings).mockResolvedValueOnce(mockBookingData);

      renderHook(() => useBookingHistory(), { wrapper });

      await waitFor(() => {
        expect(bookingApi.getBookings).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
        });
      });
    });

    it('should fetch bookings with custom page parameter', async () => {
      vi.mocked(bookingApi.getBookings).mockResolvedValueOnce(mockBookingData);

      renderHook(() => useBookingHistory({ page: 2 }), { wrapper });

      await waitFor(() => {
        expect(bookingApi.getBookings).toHaveBeenCalledWith({
          page: 2,
          limit: 10,
        });
      });
    });

    it('should fetch bookings with custom limit parameter', async () => {
      vi.mocked(bookingApi.getBookings).mockResolvedValueOnce(mockBookingData);

      renderHook(() => useBookingHistory({ limit: 5 }), { wrapper });

      await waitFor(() => {
        expect(bookingApi.getBookings).toHaveBeenCalledWith({
          page: 1,
          limit: 5,
        });
      });
    });

    it('should fetch bookings with both custom page and limit', async () => {
      vi.mocked(bookingApi.getBookings).mockResolvedValueOnce(mockBookingData);

      renderHook(() => useBookingHistory({ page: 3, limit: 20 }), { wrapper });

      await waitFor(() => {
        expect(bookingApi.getBookings).toHaveBeenCalledWith({
          page: 3,
          limit: 20,
        });
      });
    });

    it('should fetch bookings with status filter', async () => {
      vi.mocked(bookingApi.getBookings).mockResolvedValueOnce(mockBookingData);

      renderHook(() => useBookingHistory({ status: 'PAID' as BookingStatus }), { wrapper });

      await waitFor(() => {
        expect(bookingApi.getBookings).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          status: 'PAID',
        });
      });
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network failures', async () => {
      // Create a new QueryClient with retry enabled for this test
      const retryQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1, // Retry once
            retryDelay: 0, // No delay for faster tests
          },
        },
      });

      const retryWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={retryQueryClient}>{children}</QueryClientProvider>
      );

      const networkError = new Error('Network Error');
      vi.mocked(bookingApi.getBookings)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(mockBookingData);

      const { result } = renderHook(() => useBookingHistory(), { wrapper: retryWrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have retried and succeeded
      expect(bookingApi.getBookings).toHaveBeenCalledTimes(2);
      expect(result.current.bookings).toEqual(mockBookingData.data);
      expect(result.current.isError).toBe(false);

      retryQueryClient.clear();
    });

    it('should not retry on 4xx client errors', async () => {
      // Create a new QueryClient with custom retry logic
      const retryQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error: any) => {
              // Skip retry for 4xx errors
              if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false;
              }
              return failureCount < 1;
            },
            retryDelay: 0,
          },
        },
      });

      const retryWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={retryQueryClient}>{children}</QueryClientProvider>
      );

      const clientError = {
        response: {
          status: 404,
          data: { message: 'Not Found' },
        },
      };
      vi.mocked(bookingApi.getBookings).mockRejectedValueOnce(clientError);

      const { result } = renderHook(() => useBookingHistory(), { wrapper: retryWrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should not have retried
      expect(bookingApi.getBookings).toHaveBeenCalledTimes(1);
      expect(result.current.error).toBeTruthy();

      retryQueryClient.clear();
    });

    it('should retry on 5xx server errors', async () => {
      // Create a new QueryClient with retry enabled
      const retryQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            retryDelay: 0,
          },
        },
      });

      const retryWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={retryQueryClient}>{children}</QueryClientProvider>
      );

      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      };
      vi.mocked(bookingApi.getBookings)
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce(mockBookingData);

      const { result } = renderHook(() => useBookingHistory(), { wrapper: retryWrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have retried and succeeded
      expect(bookingApi.getBookings).toHaveBeenCalledTimes(2);
      expect(result.current.bookings).toEqual(mockBookingData.data);

      retryQueryClient.clear();
    });
  });

  describe('Cache Behavior', () => {
    it('should cache data with 5 minute staleTime', async () => {
      // Create a QueryClient with 5 minute staleTime
      const cacheQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: false,
          },
        },
      });

      const cacheWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={cacheQueryClient}>{children}</QueryClientProvider>
      );

      vi.mocked(bookingApi.getBookings).mockResolvedValue(mockBookingData);

      // First render
      const { result: result1 } = renderHook(() => useBookingHistory(), { wrapper: cacheWrapper });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      expect(bookingApi.getBookings).toHaveBeenCalledTimes(1);
      expect(result1.current.bookings).toEqual(mockBookingData.data);

      // Second render with same parameters - should use cache
      const { result: result2 } = renderHook(() => useBookingHistory(), { wrapper: cacheWrapper });

      // Should immediately have data from cache
      expect(result2.current.bookings).toEqual(mockBookingData.data);
      expect(result2.current.isLoading).toBe(false);

      // Should not have made another API call
      expect(bookingApi.getBookings).toHaveBeenCalledTimes(1);

      cacheQueryClient.clear();
    });

    it('should refetch when parameters change', async () => {
      vi.mocked(bookingApi.getBookings).mockResolvedValue(mockBookingData);

      const { result, rerender } = renderHook(
        ({ page }) => useBookingHistory({ page }),
        {
          wrapper,
          initialProps: { page: 1 },
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(bookingApi.getBookings).toHaveBeenCalledTimes(1);
      expect(bookingApi.getBookings).toHaveBeenCalledWith({ page: 1, limit: 10 });

      // Change page parameter
      rerender({ page: 2 });

      await waitFor(() => {
        expect(bookingApi.getBookings).toHaveBeenCalledTimes(2);
      });

      expect(bookingApi.getBookings).toHaveBeenCalledWith({ page: 2, limit: 10 });
    });
  });

  describe('Refetch Functionality', () => {
    it('should provide refetch function', async () => {
      vi.mocked(bookingApi.getBookings).mockResolvedValue(mockBookingData);

      const { result } = renderHook(() => useBookingHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.refetch).toBeDefined();
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should refetch data when refetch is called', async () => {
      vi.mocked(bookingApi.getBookings).mockResolvedValue(mockBookingData);

      const { result } = renderHook(() => useBookingHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(bookingApi.getBookings).toHaveBeenCalledTimes(1);

      // Call refetch
      result.current.refetch();

      await waitFor(() => {
        expect(bookingApi.getBookings).toHaveBeenCalledTimes(2);
      });
    });
  });
});
