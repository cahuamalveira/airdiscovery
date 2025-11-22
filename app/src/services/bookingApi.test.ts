import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { BookingApiService } from './bookingApi';
import type { BookingHistoryResponse, BookingResponseDto, BookingStatus } from '../types/booking';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('BookingApiService', () => {
  let bookingApiService: BookingApiService;
  const mockGetAccessToken = vi.fn();
  const baseURL = 'http://localhost:3001/api';

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAccessToken.mockResolvedValue('mock-jwt-token');
    bookingApiService = new BookingApiService(mockGetAccessToken, baseURL);
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
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await bookingApiService.getBookings();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${baseURL}/bookings`,
        expect.objectContaining({
          params: { page: 1, limit: 10 },
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-jwt-token',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch bookings with custom pagination parameters', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await bookingApiService.getBookings({ page: 2, limit: 5 });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${baseURL}/bookings`,
        expect.objectContaining({
          params: { page: 2, limit: 5 },
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-jwt-token',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch bookings with status filter', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await bookingApiService.getBookings({ 
        page: 1, 
        limit: 10, 
        status: 'PAID' as BookingStatus 
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${baseURL}/bookings`,
        expect.objectContaining({
          params: { page: 1, limit: 10, status: 'PAID' },
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-jwt-token',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include authentication header in request', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      await bookingApiService.getBookings();

      expect(mockGetAccessToken).toHaveBeenCalled();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-jwt-token',
          }),
        })
      );
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValueOnce(networkError);

      await expect(bookingApiService.getBookings()).rejects.toThrow('Network Error');
    });

    it('should handle 401 authentication errors', async () => {
      const authError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };
      mockedAxios.get.mockRejectedValueOnce(authError);

      await expect(bookingApiService.getBookings()).rejects.toMatchObject({
        response: expect.objectContaining({
          status: 401,
        }),
      });
    });

    it('should handle 500 server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      };
      mockedAxios.get.mockRejectedValueOnce(serverError);

      await expect(bookingApiService.getBookings()).rejects.toMatchObject({
        response: expect.objectContaining({
          status: 500,
        }),
      });
    });

    it('should transform response data correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await bookingApiService.getBookings();

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('id', 'booking-1');
      expect(result.data[0]).toHaveProperty('status', 'PAID');
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
      status: 'PAID' as BookingStatus,
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

    it('should fetch booking by ID successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ 
        data: {
          statusCode: 200,
          message: 'Reserva encontrada',
          data: mockBooking,
        }
      });

      const result = await bookingApiService.getBookingById('booking-123');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${baseURL}/bookings/booking-123`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-jwt-token',
          }),
        })
      );
      expect(result).toEqual(mockBooking);
    });

    it('should include authentication header in request', async () => {
      mockedAxios.get.mockResolvedValueOnce({ 
        data: {
          statusCode: 200,
          data: mockBooking,
        }
      });

      await bookingApiService.getBookingById('booking-123');

      expect(mockGetAccessToken).toHaveBeenCalled();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-jwt-token',
          }),
        })
      );
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValueOnce(networkError);

      await expect(bookingApiService.getBookingById('booking-123')).rejects.toThrow('Network Error');
    });

    it('should handle 401 authentication errors', async () => {
      const authError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };
      mockedAxios.get.mockRejectedValueOnce(authError);

      await expect(bookingApiService.getBookingById('booking-123')).rejects.toMatchObject({
        response: expect.objectContaining({
          status: 401,
        }),
      });
    });

    it('should handle 500 server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      };
      mockedAxios.get.mockRejectedValueOnce(serverError);

      await expect(bookingApiService.getBookingById('booking-123')).rejects.toMatchObject({
        response: expect.objectContaining({
          status: 500,
        }),
      });
    });

    it('should handle 404 not found errors', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { message: 'Booking not found' },
        },
      };
      mockedAxios.get.mockRejectedValueOnce(notFoundError);

      await expect(bookingApiService.getBookingById('invalid-id')).rejects.toMatchObject({
        response: expect.objectContaining({
          status: 404,
        }),
      });
    });

    it('should transform response data correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({ 
        data: {
          statusCode: 200,
          data: mockBooking,
        }
      });

      const result = await bookingApiService.getBookingById('booking-123');

      expect(result).toHaveProperty('id', 'booking-123');
      expect(result).toHaveProperty('flightId', 'flight-456');
      expect(result).toHaveProperty('status', 'PAID');
      expect(result.passengers).toHaveLength(1);
      expect(result.passengers[0]).toHaveProperty('firstName', 'Carlos');
      expect(result).toHaveProperty('payments');
      expect(result.payments).toHaveLength(1);
      expect(result).toHaveProperty('notes', 'Window seat preferred');
    });
  });

  describe('Authentication Token Handling', () => {
    it('should handle missing token gracefully', async () => {
      mockGetAccessToken.mockResolvedValueOnce(null);
      
      const mockResponse: BookingHistoryResponse = {
        statusCode: 200,
        message: 'Reservas encontradas',
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
      
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      await bookingApiService.getBookings();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer null',
          }),
        })
      );
    });

    it('should handle token retrieval errors', async () => {
      mockGetAccessToken.mockRejectedValueOnce(new Error('Token retrieval failed'));

      await expect(bookingApiService.getBookings()).rejects.toThrow('Token retrieval failed');
    });
  });
});
