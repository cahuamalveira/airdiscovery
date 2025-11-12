import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BookingService } from '../src/booking/booking.service';
import { Booking } from '../src/booking/entities/booking.entity';
import { CreateBookingDto } from '../src/booking/dto/create-booking.dto';
import { BookingStatus } from '../src/booking/enums/booking-status.enum';

describe('BookingService', () => {
  let service: BookingService;
  let repository: Repository<Booking>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    repository = module.get<Repository<Booking>>(getRepositoryToken(Booking));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createBookingDto: CreateBookingDto = {
      flightId: 'flight-123',
      passenger: {
        firstName: 'João',
        lastName: 'Silva',
        cpf: '12345678901',
        email: 'joao@example.com',
        phone: '11999999999',
        dateOfBirth: '1990-01-01',
      },
      totalPrice: 450.00,
    };

    it('should create a booking successfully', async () => {
      const expectedBooking = {
        id: 'booking-123',
        ...createBookingDto,
        status: BookingStatus.PENDING_PAYMENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(expectedBooking);
      mockRepository.save.mockResolvedValue(expectedBooking);

      const result = await service.create(createBookingDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createBookingDto,
        status: BookingStatus.PENDING_PAYMENT,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expectedBooking);
      expect(result).toEqual(expectedBooking);
    });

    it('should throw error if save fails', async () => {
      mockRepository.create.mockReturnValue(createBookingDto);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createBookingDto)).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should return booking when found', async () => {
      const booking = {
        id: 'booking-123',
        flightId: 'flight-123',
        status: BookingStatus.PENDING_PAYMENT,
      };

      mockRepository.findOne.mockResolvedValue(booking);

      const result = await service.findOne('booking-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
      });
      expect(result).toEqual(booking);
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('booking-123')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('booking-123')).rejects.toThrow('Booking not found');
    });
  });

  describe('findByUser', () => {
    it('should return user bookings', async () => {
      const bookings = [
        { id: 'booking-1', userId: 'user-123' },
        { id: 'booking-2', userId: 'user-123' },
      ];

      mockRepository.find.mockResolvedValue(bookings);

      const result = await service.findByUser('user-123');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(bookings);
    });
  });

  describe('updateStatus', () => {
    it('should update booking status successfully', async () => {
      const existingBooking = {
        id: 'booking-123',
        status: BookingStatus.PENDING_PAYMENT,
      };

      const updatedBooking = {
        ...existingBooking,
        status: BookingStatus.CONFIRMED,
      };

      mockRepository.findOne.mockResolvedValue(existingBooking);
      mockRepository.save.mockResolvedValue(updatedBooking);

      const result = await service.updateStatus('booking-123', BookingStatus.CONFIRMED);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...existingBooking,
        status: BookingStatus.CONFIRMED,
      });
      expect(result).toEqual(updatedBooking);
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('booking-123', BookingStatus.CONFIRMED)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateBookingData', () => {
    it('should pass validation for valid booking data', () => {
      const validBooking: CreateBookingDto = {
        flightId: 'flight-123',
        passenger: {
          firstName: 'João',
          lastName: 'Silva',
          cpf: '12345678901',
          email: 'joao@example.com',
          phone: '11999999999',
          dateOfBirth: '1990-01-01',
        },
        totalPrice: 450.00,
      };

      expect(() => service.validateBookingData(validBooking)).not.toThrow();
    });

    it('should throw error for invalid CPF', () => {
      const invalidBooking: CreateBookingDto = {
        flightId: 'flight-123',
        passenger: {
          firstName: 'João',
          lastName: 'Silva',
          cpf: '123', // Invalid CPF
          email: 'joao@example.com',
          phone: '11999999999',
          dateOfBirth: '1990-01-01',
        },
        totalPrice: 450.00,
      };

      expect(() => service.validateBookingData(invalidBooking)).toThrow('Invalid CPF format');
    });

    it('should throw error for invalid email', () => {
      const invalidBooking: CreateBookingDto = {
        flightId: 'flight-123',
        passenger: {
          firstName: 'João',
          lastName: 'Silva',
          cpf: '12345678901',
          email: 'invalid-email', // Invalid email
          phone: '11999999999',
          dateOfBirth: '1990-01-01',
        },
        totalPrice: 450.00,
      };

      expect(() => service.validateBookingData(invalidBooking)).toThrow('Invalid email format');
    });

    it('should throw error for negative price', () => {
      const invalidBooking: CreateBookingDto = {
        flightId: 'flight-123',
        passenger: {
          firstName: 'João',
          lastName: 'Silva',
          cpf: '12345678901',
          email: 'joao@example.com',
          phone: '11999999999',
          dateOfBirth: '1990-01-01',
        },
        totalPrice: -100, // Negative price
      };

      expect(() => service.validateBookingData(invalidBooking)).toThrow('Invalid total price');
    });
  });

  describe('canCancelBooking', () => {
    it('should return true for pending payment status', () => {
      const booking = { status: BookingStatus.PENDING_PAYMENT } as Booking;
      
      expect(service.canCancelBooking(booking)).toBe(true);
    });

    it('should return true for confirmed status', () => {
      const booking = { status: BookingStatus.CONFIRMED } as Booking;
      
      expect(service.canCancelBooking(booking)).toBe(true);
    });

    it('should return false for cancelled status', () => {
      const booking = { status: BookingStatus.CANCELLED } as Booking;
      
      expect(service.canCancelBooking(booking)).toBe(false);
    });

    it('should return false for completed status', () => {
      const booking = { status: BookingStatus.COMPLETED } as Booking;
      
      expect(service.canCancelBooking(booking)).toBe(false);
    });
  });

  describe('isValidCpf', () => {
    it('should return true for valid CPF format', () => {
      expect(service.isValidCpf('12345678901')).toBe(true);
      expect(service.isValidCpf('123.456.789-01')).toBe(true);
    });

    it('should return false for invalid CPF format', () => {
      expect(service.isValidCpf('123')).toBe(false);
      expect(service.isValidCpf('1234567890123')).toBe(false);
      expect(service.isValidCpf('')).toBe(false);
      expect(service.isValidCpf('abc')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email format', () => {
      expect(service.isValidEmail('test@example.com')).toBe(true);
      expect(service.isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid email format', () => {
      expect(service.isValidEmail('invalid-email')).toBe(false);
      expect(service.isValidEmail('test@')).toBe(false);
      expect(service.isValidEmail('@example.com')).toBe(false);
      expect(service.isValidEmail('')).toBe(false);
    });
  });
});