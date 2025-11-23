import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBookings, getBookingById } from './bookingApi';
import type { BookingHistoryResponse, BookingResponseDto } from '../types/booking';
import { BookingStatus } from '../types/booking';
import { httpInterceptor } from '../utils/httpInterceptor';

// Mock httpInterceptor
vi.mock('../utils/httpInterceptor', () => ({
  httpInterceptor: {
    get: vi.fn(),
  },
}));

const mockedHttpInterceptor = vi.mocked(httpInterceptor);

describe('bookingApi', () => {
  const baseURL = 'http://localhost:3001/api';

  beforeEach(() => {
    vi.clearAllMocks();
    // Set the environment variable for tests
    import.meta.env.VITE_API_URL = baseURL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getBookings', () => {
    const mockBookingData: BookingResponseDto[] = [
      {
        id: 'booking-1',
        flightId: 'flight-1',
        userId: 'user-1',
        status: BookingStatus.PAID,
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
        status: BookingStatus.AWAITING_PAYMENT,
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
    ];

    const mockResponse: BookingHistoryResponse = {
      statusCode: 200,
      message: 'Reservas encontradas',
      data: mockBookingData,
      meta: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };

    it('should fetch bookings successfully with default parameters', async () => {
      mockedHttpInterceptor.get.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await getBookings();

      expect(mockedHttpInterceptor.get).toHaveBeenCalledWith(
        `${baseURL}/bookings?page=1&limit=10`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch bookings with custom pagination parameters', async () => {
      mockedHttpInterceptor.get.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await getBookings({ page: 2, limit: 5 });

      expect(mockedHttpInterceptor.get).toHaveBeenCalledWith(
        `${baseURL}/bookings?page=2&limit=5`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch bookings with status filter', async () => {
      mockedHttpInterceptor.get.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await getBookings({ 
        page: 1, 
        limit: 10, 
        status: BookingStatus.PAID
      });

      expect(mockedHttpInterceptor.get).toHaveBeenCalledWith(
        `${baseURL}/bookings?page=1&limit=10&status=PAID`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      mockedHttpInterceptor.get.mockRejectedValueOnce(new Error('Network Error'));

      await expect(getBookings()).rejects.toThrow('Network Error');
    });

    it('should handle 401 authentication errors', async () => {
      mockedHttpInterceptor.get.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response);

      await expect(getBookings()).rejects.toMatchObject({
        message: 'Unauthorized',
        response: {
          status: 401,
        },
      });
    });

    it('should handle 500 server errors', async () => {
      mockedHttpInterceptor.get.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      } as Response);

      await expect(getBookings()).rejects.toMatchObject({
        message: 'Internal Server Error',
        response: {
          status: 500,
        },
      });
    });

    it('should transform response data correctly', async () => {
      mockedHttpInterceptor.get.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await getBookings();

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('id', 'booking-1');
      expect(result.data[0]).toHaveProperty('status', BookingStatus.PAID);
      expect(result.data[0].passengers).toHaveLength(1);
      expect(result.data[0].passengers[0]).toHaveProperty('firstName', 'João');
      expect(result.meta).toHaveProperty('total', 2);
      expect(result.meta).toHaveProperty('page', 1);
    });
  });

  describe('getBookingById', () => {
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
      payments: [
        {
          id: 'payment-1',
          status: 'completed',
          amount: 55000,
        },
      ],
      notes: 'Window seat preferred',
      createdAt: '2024-01-20T09:00:00Z',
      updatedAt: '2024-01-20T09:15:00Z',
    };

    it('should fetch booking by ID successfully with flight details', async () => {
      mockedHttpInterceptor.get.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          statusCode: 200,
          message: 'Reserva encontrada',
          data: mockBooking,
        }),
      } as Response);

      const result = await getBookingById('booking-123');

      expect(mockedHttpInterceptor.get).toHaveBeenCalledWith(
        `${baseURL}/bookings/booking-123`
      );
      expect(result).toEqual(mockBooking);
      expect(result).toHaveProperty('id', 'booking-123');
      expect(result).toHaveProperty('flightId', 'flight-456');
      expect(result).toHaveProperty('status', BookingStatus.PAID);
    });

    it('should handle 404 not found errors', async () => {
      mockedHttpInterceptor.get.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Booking not found' }),
      } as Response);

      await expect(getBookingById('invalid-id')).rejects.toMatchObject({
        message: 'Booking not found',
        response: {
          status: 404,
        },
      });
    });

    it('should handle 401 authentication errors', async () => {
      mockedHttpInterceptor.get.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response);

      await expect(getBookingById('booking-123')).rejects.toMatchObject({
        message: 'Unauthorized',
        response: {
          status: 401,
        },
      });
    });

    it('should handle 500 server errors', async () => {
      mockedHttpInterceptor.get.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      } as Response);

      await expect(getBookingById('booking-123')).rejects.toMatchObject({
        message: 'Internal Server Error',
        response: {
          status: 500,
        },
      });
    });

    it('should validate response data structure', async () => {
      mockedHttpInterceptor.get.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          statusCode: 200,
          data: mockBooking,
        }),
      } as Response);

      const result = await getBookingById('booking-123');

      // Validate structure
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('flightId');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('passengers');
      expect(result).toHaveProperty('totalAmount');
      expect(result).toHaveProperty('currency');
      expect(Array.isArray(result.passengers)).toBe(true);
      expect(result.passengers[0]).toHaveProperty('firstName');
      expect(result.passengers[0]).toHaveProperty('lastName');
      expect(result.passengers[0]).toHaveProperty('email');
    });

    it('should handle network errors', async () => {
      mockedHttpInterceptor.get.mockRejectedValueOnce(new Error('Network Error'));

      await expect(getBookingById('booking-123')).rejects.toThrow('Network Error');
    });

    it('should handle malformed JSON response', async () => {
      mockedHttpInterceptor.get.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(getBookingById('booking-123')).rejects.toThrow('Failed to fetch booking');
    });
  });
});
