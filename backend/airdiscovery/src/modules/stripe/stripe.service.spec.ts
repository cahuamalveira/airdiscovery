import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { BookingService } from '../bookings/booking.service';
import { Payment } from '../bookings/entities/payment.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';

describe('StripeService - Payment Validation (TDD)', () => {
  let service: StripeService;
  let bookingService: BookingService;
  let paymentRepository: Repository<Payment>;
  let stripe: Stripe;
  let loggerService: LoggerService;

  const mockBookingService = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const mockPaymentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockStripe = {
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_test_secret';
      return null;
    }),
  };

  const mockMailService = {
    sendBookingConfirmation: jest.fn(),
  };

  const mockLoggerService = {
    child: jest.fn().mockReturnThis(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: Stripe,
          useValue: mockStripe,
        },
        {
          provide: BookingService,
          useValue: mockBookingService,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
    bookingService = module.get<BookingService>(BookingService);
    paymentRepository = module.get<Repository<Payment>>(getRepositoryToken(Payment));
    stripe = module.get<Stripe>(Stripe);
    loggerService = module.get<LoggerService>(LoggerService);

    jest.clearAllMocks();
  });

  describe('createPaymentIntent - Validation Tests', () => {
    const validBookingId = 'booking-123';
    const validUserId = 'user-456';

    const createMockBooking = (overrides: any = {}): any => ({
      id: validBookingId,
      userId: validUserId,
      flightId: 'flight-789',
      totalAmount: 500.00,
      status: BookingStatus.PENDING,
      passengers: [
        {
          firstName: 'João',
          lastName: 'Silva',
          email: 'joao@example.com',
          phone: '(11) 99999-9999',
          document: '123.456.789-01',
          birthDate: '1990-01-01',
        },
      ],
      payments: [],
      currency: 'brl',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });

    it('should successfully create payment intent with valid booking', async () => {
      // Arrange
      const mockBooking = createMockBooking();
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        status: 'requires_payment_method',
        amount: 50000, // 500.00 * 100
        currency: 'brl',
      };

      mockBookingService.findById.mockResolvedValue(mockBooking);
      mockPaymentRepository.findOne.mockResolvedValue(null); // No existing payment
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent as any);
      mockPaymentRepository.create.mockReturnValue({} as Payment);
      mockPaymentRepository.save.mockResolvedValue({} as Payment);
      mockBookingService.update.mockResolvedValue(mockBooking);

      // Act
      const result = await service.createPaymentIntent(validBookingId, validUserId);

      // Assert
      expect(result).toEqual({
        clientSecret: 'pi_test123_secret',
        amount: 500.00,
      });
      expect(mockBookingService.findById).toHaveBeenCalledWith(validBookingId, validUserId);
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 50000,
        currency: 'brl',
        metadata: {
          bookingId: validBookingId,
          userId: validUserId,
          passengerCount: 1,
        },
      });
      expect(mockBookingService.update).toHaveBeenCalledWith(validBookingId, {
        status: BookingStatus.AWAITING_PAYMENT,
      });
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Payment intent created',
        expect.objectContaining({
          bookingId: validBookingId,
          userId: validUserId,
          totalAmount: 500.00,
          passengerCount: 1,
        })
      );
    });

    it('should reject invalid bookingId with 404 NotFoundException', async () => {
      // Arrange
      mockBookingService.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createPaymentIntent('invalid-booking', validUserId)
      ).rejects.toThrow(NotFoundException);

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Booking not found'),
        expect.objectContaining({
          bookingId: 'invalid-booking',
          userId: validUserId,
        })
      );
    });

    it('should reject unauthorized user with 403 ForbiddenException', async () => {
      // Arrange
      // When findById is called with a different userId, it should return null (not found)
      mockBookingService.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createPaymentIntent(validBookingId, 'different-user-id')
      ).rejects.toThrow(NotFoundException); // findById with wrong userId returns null, throwing NotFoundException

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Booking not found'),
        expect.objectContaining({
          bookingId: validBookingId,
          userId: 'different-user-id',
        })
      );
    });

    it('should reject non-pending booking with 400 BadRequestException', async () => {
      // Arrange
      const mockBooking = createMockBooking({ status: BookingStatus.PAID });
      mockBookingService.findById.mockResolvedValue(mockBooking);

      // Act & Assert
      await expect(
        service.createPaymentIntent(validBookingId, validUserId)
      ).rejects.toThrow(BadRequestException);

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid booking status'),
        expect.objectContaining({
          bookingId: validBookingId,
          status: BookingStatus.PAID,
        })
      );
    });

    it('should reject duplicate payment with 409 ConflictException', async () => {
      // Arrange
      const mockBooking = createMockBooking();
      mockBookingService.findById.mockResolvedValue(mockBooking);
      
      // Mock existing payment with payment intent ID
      mockPaymentRepository.findOne.mockResolvedValue({
        payment_id: 1,
        bookingId: validBookingId,
        paymentIntentId: 'pi_existing123',
        amount: 500.00,
        currency: 'brl',
        status: 'pending',
      } as Payment);

      // Act & Assert
      await expect(
        service.createPaymentIntent(validBookingId, validUserId)
      ).rejects.toThrow(ConflictException);

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Payment already initiated'),
        expect.objectContaining({
          bookingId: validBookingId,
          existingPaymentIntentId: 'pi_existing123',
        })
      );
    });

    it('should reject zero amount with 400 BadRequestException', async () => {
      // Arrange
      const mockBooking = createMockBooking({ totalAmount: 0 });
      mockBookingService.findById.mockResolvedValue(mockBooking);
      mockPaymentRepository.findOne.mockResolvedValue(null); // No existing payment

      // Act & Assert
      await expect(
        service.createPaymentIntent(validBookingId, validUserId)
      ).rejects.toThrow(BadRequestException);

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid booking amount'),
        expect.any(Error),
        expect.objectContaining({
          bookingId: validBookingId,
          totalAmount: 0,
        })
      );
    });

    it('should reject negative amount with 400 BadRequestException', async () => {
      // Arrange
      const mockBooking = createMockBooking({ totalAmount: -100 });
      mockBookingService.findById.mockResolvedValue(mockBooking);
      mockPaymentRepository.findOne.mockResolvedValue(null); // No existing payment

      // Act & Assert
      await expect(
        service.createPaymentIntent(validBookingId, validUserId)
      ).rejects.toThrow(BadRequestException);

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid booking amount'),
        expect.any(Error),
        expect.objectContaining({
          bookingId: validBookingId,
          totalAmount: -100,
        })
      );
    });

    it('should reject booking with no passengers with 400 BadRequestException', async () => {
      // Arrange
      const mockBooking = createMockBooking({ passengers: [] });
      mockBookingService.findById.mockResolvedValue(mockBooking);
      mockPaymentRepository.findOne.mockResolvedValue(null); // No existing payment

      // Act & Assert
      await expect(
        service.createPaymentIntent(validBookingId, validUserId)
      ).rejects.toThrow(BadRequestException);

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('No passengers in booking'),
        expect.any(Error),
        expect.objectContaining({
          bookingId: validBookingId,
        })
      );
    });

    it('should verify amount conversion to cents (multiply by 100)', async () => {
      // Arrange
      const mockBooking = createMockBooking({ totalAmount: 123.45 });
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        status: 'requires_payment_method',
        amount: 12345,
        currency: 'brl',
      };

      mockBookingService.findById.mockResolvedValue(mockBooking);
      mockPaymentRepository.findOne.mockResolvedValue(null); // No existing payment
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent as any);
      mockPaymentRepository.create.mockReturnValue({} as Payment);
      mockPaymentRepository.save.mockResolvedValue({} as Payment);
      mockBookingService.update.mockResolvedValue(mockBooking);

      // Act
      await service.createPaymentIntent(validBookingId, validUserId);

      // Assert
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 12345, // 123.45 * 100
        })
      );
    });

    it('should verify booking status updated to AWAITING_PAYMENT', async () => {
      // Arrange
      const mockBooking = createMockBooking();
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        status: 'requires_payment_method',
        amount: 50000,
        currency: 'brl',
      };

      mockBookingService.findById.mockResolvedValue(mockBooking);
      mockPaymentRepository.findOne.mockResolvedValue(null); // No existing payment
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent as any);
      mockPaymentRepository.create.mockReturnValue({} as Payment);
      mockPaymentRepository.save.mockResolvedValue({} as Payment);
      mockBookingService.update.mockResolvedValue(mockBooking);

      // Act
      await service.createPaymentIntent(validBookingId, validUserId);

      // Assert
      expect(mockBookingService.update).toHaveBeenCalledWith(
        validBookingId,
        expect.objectContaining({
          status: BookingStatus.AWAITING_PAYMENT,
        })
      );
    });

    it('should verify payment intent ID stored in payment entity', async () => {
      // Arrange
      const mockBooking = createMockBooking();
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        status: 'requires_payment_method',
        amount: 50000,
        currency: 'brl',
      };

      mockBookingService.findById.mockResolvedValue(mockBooking);
      mockPaymentRepository.findOne.mockResolvedValue(null); // No existing payment
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent as any);
      mockPaymentRepository.create.mockReturnValue({} as Payment);
      mockPaymentRepository.save.mockResolvedValue({} as Payment);
      mockBookingService.update.mockResolvedValue(mockBooking);

      // Act
      await service.createPaymentIntent(validBookingId, validUserId);

      // Assert
      expect(mockPaymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentIntentId: 'pi_test123',
          bookingId: validBookingId,
        })
      );
      expect(mockPaymentRepository.save).toHaveBeenCalled();
    });

    it('should verify structured logging for success', async () => {
      // Arrange
      const mockBooking = createMockBooking();
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        status: 'requires_payment_method',
        amount: 50000,
        currency: 'brl',
      };

      mockBookingService.findById.mockResolvedValue(mockBooking);
      mockPaymentRepository.findOne.mockResolvedValue(null); // No existing payment
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent as any);
      mockPaymentRepository.create.mockReturnValue({} as Payment);
      mockPaymentRepository.save.mockResolvedValue({} as Payment);
      mockBookingService.update.mockResolvedValue(mockBooking);

      // Act
      await service.createPaymentIntent(validBookingId, validUserId);

      // Assert
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Payment intent created',
        expect.objectContaining({
          bookingId: validBookingId,
          userId: validUserId,
          totalAmount: 500.00,
          passengerCount: 1,
        })
      );
    });

    it('should verify structured logging for failures', async () => {
      // Arrange
      mockBookingService.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createPaymentIntent('invalid-booking', validUserId)
      ).rejects.toThrow(NotFoundException);

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          bookingId: 'invalid-booking',
          userId: validUserId,
        })
      );
    });
  });
});
