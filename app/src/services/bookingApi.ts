import { httpInterceptor } from '../utils/httpInterceptor';
import type { BookingHistoryResponse, BookingResponseDto, BookingStatus } from '../types/booking';

export interface GetBookingsParams {
  page?: number;
  limit?: number;
  status?: BookingStatus;
}

/**
 * Fetch all bookings for the authenticated user with pagination
 */
export const getBookings = async (params: GetBookingsParams = {}): Promise<BookingHistoryResponse> => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const { page = 1, limit = 10, status } = params;
  
  // Build query parameters
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (status) {
    queryParams.append('status', status);
  }

  const response = await httpInterceptor.get(`${baseURL}/bookings?${queryParams}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error(errorData.message || 'Failed to fetch bookings');
    error.response = {
      status: response.status,
      data: errorData,
    };
    throw error;
  }

  return await response.json();
};

/**
 * Fetch a single booking by ID
 */
export const getBookingById = async (bookingId: string): Promise<BookingResponseDto> => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  
  const response = await httpInterceptor.get(`${baseURL}/bookings/${bookingId}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error(errorData.message || 'Failed to fetch booking');
    error.response = {
      status: response.status,
      data: errorData,
    };
    throw error;
  }

  const data = await response.json();
  return data.data;
};
