import { useQuery } from '@tanstack/react-query';
import * as bookingApi from '../services/bookingApi';
import type { BookingResponseDto, BookingStatus, BookingHistoryResponse } from '../types/booking';

export interface UseBookingHistoryOptions {
  page?: number;
  limit?: number;
  status?: BookingStatus;
}

export interface UseBookingHistoryResult {
  bookings: BookingResponseDto[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  refetch: () => void;
}

/**
 * Custom hook to fetch booking history for the authenticated user
 * 
 * @param options - Optional pagination and filter parameters
 * @returns Booking history data with loading and error states
 */
export const useBookingHistory = (
  options: UseBookingHistoryOptions = {}
): UseBookingHistoryResult => {
  const { page = 1, limit = 10, status } = options;

  const query = useQuery({
    queryKey: ['bookings', { page, limit, status }],
    queryFn: async (): Promise<BookingHistoryResponse> => {
      const params: bookingApi.GetBookingsParams = {
        page,
        limit,
      };

      if (status) {
        params.status = status;
      }

      return await bookingApi.getBookings(params);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    bookings: query.data?.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    meta: query.data?.meta || {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
    refetch: query.refetch,
  };
};
