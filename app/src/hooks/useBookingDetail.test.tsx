import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useBookingDetail } from './useBookingDetail';
import * as bookingApi from '../services/bookingApi';
import { BookingStatus } from '../types/booking';
import type { BookingResponseDto } from '../types/booking';

// Mock the bookingApi module
vi.mock('../services/bookingApi');

describe('useBookingDetail', () => {
  let queryClient: QueryClient;

  const mockBooking: BookingResponseDto = {
    id: 'booking-123',
    flightId: 'flight-456',
    userId: 'user-789',
    status: BookingStatus.PAID,
    passengers: [
      {
        firstName: 'Carlos',
        lastName: 'Oliveira',
        email: 'carlos@example.com',
        phone: '11977777777',
        document: '11122233344',
        birthDate: '1992-03-20',
      },
    ],
    totalAmount: 55000,
    currency: 'BRL',
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-01-20T09:15:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a new QueryClient for each test to ensure isolation
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for tests
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should start with loading state', () => {
    vi.mocked(bookingApi.getBookingById).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useBookingDetail('booking-123'), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.booking).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch booking data successfully', async () => {
    vi.mocked(bookingApi.getBookingById).mockResolvedValueOnce(mockBooking);

    const { result } = renderHook(() => useBookingDetail('booking-123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.booking).toEqual(mockBooking);
    expect(result.current.error).toBeNull();
    expect(result.current.isError).toBe(false);
    expect(bookingApi.getBookingById).toHaveBeenCalledWith('booking-123');
  });

  it('should handle error state', async () => {
    const error = new Error('Failed to fetch booking');
    vi.mocked(bookingApi.getBookingById).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useBookingDetail('booking-123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.booking).toBeNull();
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual(error);
  });

  it('should provide refetch functionality', async () => {
    vi.mocked(bookingApi.getBookingById).mockResolvedValueOnce(mockBooking);

    const { result } = renderHook(() => useBookingDetail('booking-123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.booking).toEqual(mockBooking);

    // Update mock for refetch
    const updatedBooking = { ...mockBooking, totalAmount: 60000 };
    vi.mocked(bookingApi.getBookingById).mockResolvedValueOnce(updatedBooking);

    // Trigger refetch
    result.current.refetch();

    await waitFor(() => {
      expect(result.current.booking?.totalAmount).toBe(60000);
    });

    expect(bookingApi.getBookingById).toHaveBeenCalledTimes(2);
  });

  it('should cache booking data with React Query', async () => {
    vi.mocked(bookingApi.getBookingById).mockResolvedValueOnce(mockBooking);

    // First render
    const { result: result1, unmount } = renderHook(
      () => useBookingDetail('booking-123'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
    });

    expect(result1.current.booking).toEqual(mockBooking);
    expect(bookingApi.getBookingById).toHaveBeenCalledTimes(1);

    unmount();

    // Second render with same bookingId should use cache
    const { result: result2 } = renderHook(
      () => useBookingDetail('booking-123'),
      { wrapper }
    );

    // Should immediately have data from cache
    expect(result2.current.booking).toEqual(mockBooking);
    // API should not be called again (still 1 call)
    expect(bookingApi.getBookingById).toHaveBeenCalledTimes(1);
  });

  it('should handle different booking IDs separately', async () => {
    const booking1 = { ...mockBooking, id: 'booking-1' };
    const booking2 = { ...mockBooking, id: 'booking-2' };

    vi.mocked(bookingApi.getBookingById)
      .mockResolvedValueOnce(booking1)
      .mockResolvedValueOnce(booking2);

    // Fetch first booking
    const { result: result1 } = renderHook(
      () => useBookingDetail('booking-1'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
    });

    expect(result1.current.booking).toEqual(booking1);

    // Fetch second booking
    const { result: result2 } = renderHook(
      () => useBookingDetail('booking-2'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result2.current.isLoading).toBe(false);
    });

    expect(result2.current.booking).toEqual(booking2);
    expect(bookingApi.getBookingById).toHaveBeenCalledTimes(2);
  });

  it('should handle 404 errors', async () => {
    const notFoundError: any = new Error('Booking not found');
    notFoundError.response = { status: 404 };
    vi.mocked(bookingApi.getBookingById).mockRejectedValueOnce(notFoundError);

    const { result } = renderHook(() => useBookingDetail('invalid-id'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual(notFoundError);
    expect(result.current.booking).toBeNull();
  });

  it('should handle 401 authentication errors', async () => {
    const authError: any = new Error('Unauthorized');
    authError.response = { status: 401 };
    vi.mocked(bookingApi.getBookingById).mockRejectedValueOnce(authError);

    const { result } = renderHook(() => useBookingDetail('booking-123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual(authError);
  });

  it('should handle 500 server errors', async () => {
    const serverError: any = new Error('Internal Server Error');
    serverError.response = { status: 500 };
    vi.mocked(bookingApi.getBookingById).mockRejectedValueOnce(serverError);

    const { result } = renderHook(() => useBookingDetail('booking-123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual(serverError);
  });
});
