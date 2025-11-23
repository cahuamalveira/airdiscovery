import { useQuery } from '@tanstack/react-query';
import * as bookingApi from '../services/bookingApi';
import type { BookingResponseDto } from '../types/booking';

export interface UseBookingDetailResult {
  booking: BookingResponseDto | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch a single booking by ID
 * 
 * @param bookingId - The ID of the booking to fetch
 * @returns Booking data with loading and error states
 */
export const useBookingDetail = (bookingId: string): UseBookingDetailResult => {
  const query = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async (): Promise<BookingResponseDto> => {
      return await bookingApi.getBookingById(bookingId);
    },
    staleTime: 1 * 60 * 1000, // 1 minute - data is considered fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - cache time (formerly cacheTime)
    enabled: !!bookingId, // Only run query if bookingId is provided
  });

  return {
    booking: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
};
