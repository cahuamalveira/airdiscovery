import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Flight } from '../flights/entities/flight.entity';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingService } from './booking.service';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/booking.dto';

describe('BookingService', () => {
  let service: BookingService;
  let repository: Repository<Booking>;
  let flightRepository: Repository<Flight>;

  const mockPassengerData = {
    firstName: 'João',
    lastName: 'Silva',
    document: '123.456.789-01',
    email: 'joao@example.com',
    phone: '(11) 99999-9999',
    birthDate: '1990-01-01'
  };

  const mockFlightDetails = {
    id: 'flight-456',
    numberOfBookableSeats: 180,
    itineraries: [{
      duration: 'PT2H',
      segments: [{
        departure: { iataCode: 'GRU', dateTime: '2024-03-15T10:00:00Z' },
        arrival: { iataCode: 'GIG', dateTime: '2024-03-15T12:00:00Z' },
        carrierCode: 'G3',
        number: '1234',
        aircraft: { code: '737' },
        operating: { carrierCode: 'G3' },
        duration: 'PT2H',
        id: '1',
        numberOfStops: 0,
        blacklistedInEU: false
      }]
    }],
    price: { currency: 'BRL', total: '450.00', base: '400.00', grandTotal: '450.00' },
    pricingOptions: { fareType: ['PUBLISHED'], includedCheckedBagsOnly: true },
    validatingAirlineCodes: ['G3'],
    travelerPricings: []
  };

  const mockBooking = {
    id: 'booking-123',
    flightId: 'flight-456',
    userId: 'user-789',
    status: BookingStatus.AWAITING_PAYMENT,
    passengerData: mockPassengerData,
    flightDetails: mockFlightDetails,
    totalAmount: 45000,
    currency: 'BRL',
    createdAt: new Date(),
    updatedAt: new Date(),
    isFinalStatus: () => false,
    canBePaid: () => true,
    getPassengerFullName: () => 'João Silva',
    getTotalAmountInReais: () => 450.00
  } as unknown as Booking;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
  };
  const mockFlightRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Flight),
          useValue: mockFlightRepository,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    repository = module.get<Repository<Booking>>(getRepositoryToken(Booking));
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createBookingDto: CreateBookingDto = {
      flightId: 'flight-456',
      passengers: [mockPassengerData],
      flightInfo: {
        amadeusOfferId: mockFlightDetails.id,
        flightNumber: mockFlightDetails.itineraries[0].segments[0].number,
        departureDateTime: mockFlightDetails.itineraries[0].segments[0].departure.dateTime,
        arrivalDateTime: mockFlightDetails.itineraries[0].segments[0].arrival.dateTime,
        priceTotal: parseFloat(mockFlightDetails.price.grandTotal),
        currency: mockFlightDetails.price.currency,
      },
      totalAmount: 45000,
      currency: 'BRL'
    };

    it('should create a new booking successfully', async () => {
      const pendingBooking = { ...mockBooking, status: BookingStatus.PENDING };
      const awaitingBooking = { ...mockBooking, status: BookingStatus.AWAITING_PAYMENT };

      mockRepository.create.mockReturnValue(pendingBooking);
      mockRepository.save
        .mockResolvedValueOnce(pendingBooking)
        .mockResolvedValueOnce(awaitingBooking);

      const result = await service.create(createBookingDto, 'user-789');

      expect(mockRepository.create).toHaveBeenCalledWith({
        customer: { id: parseInt('user-789') },
        flight: expect.any(Object),
        total_amount: createBookingDto.totalAmount,
        status: BookingStatus.PENDING,
        passengers: expect.any(Array),
      });
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
      expect(result.status).toBe(BookingStatus.AWAITING_PAYMENT);
    });
  });

  describe('findById', () => {
    it('should return a booking by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockBooking);

      const result = await service.findById('booking-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'booking-123' }
      });
      expect(result.id).toBe('booking-123');
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMany', () => {
    it('should return paginated bookings', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockBooking], 1]);

      const result = await service.findMany({ page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      const paidBooking = { ...mockBooking, status: BookingStatus.PAID };
      mockRepository.findOne.mockResolvedValue(mockBooking);
      mockRepository.save.mockResolvedValue(paidBooking);

      const result = await service.confirmPayment('booking-123', {
        paymentId: 'pay-123'
      });

      expect(result.status).toBe(BookingStatus.PAID);
    });
  });
});