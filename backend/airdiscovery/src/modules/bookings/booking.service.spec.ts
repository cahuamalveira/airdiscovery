import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Flight } from '../flights/entities/flight.entity';
import { Repository, DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingService } from './booking.service';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/booking.dto';
import { Customer } from '../customers/entities/customer.entity';

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
  const mockCustomerRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Flight),
          useValue: mockFlightRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
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

  describe('calculateAge', () => {
    it('should calculate age for person born exactly 25 years ago', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
      const birthDateStr = birthDate.toISOString().split('T')[0];

      // Access private method via any cast for testing
      const age = (service as any).calculateAge(birthDateStr);

      expect(age).toBe(25);
    });

    it('should calculate age for person born 25 years and 6 months ago', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, today.getMonth() - 6, today.getDate());
      const birthDateStr = birthDate.toISOString().split('T')[0];

      const age = (service as any).calculateAge(birthDateStr);

      expect(age).toBe(25);
    });

    it('should calculate age for person with birthday tomorrow (should be current age, not +1)', () => {
      // Test with a specific date to avoid edge cases
      // Person born on Jan 16, 1995, tested on Jan 15, 2025 should be 29, not 30
      const testToday = new Date('2025-01-15');
      const birthDateStr = '1995-01-16';
      
      // Mock the current date for this test
      const originalDate = global.Date;
      global.Date = class extends originalDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(testToday.getTime());
          } else {
            super(...args);
          }
        }
        static now() {
          return testToday.getTime();
        }
      } as any;

      const age = (service as any).calculateAge(birthDateStr);

      // Restore original Date
      global.Date = originalDate;

      expect(age).toBe(29); // Not 30 yet, birthday is tomorrow
    });

    it('should calculate age for infant (0 years old)', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
      const birthDateStr = birthDate.toISOString().split('T')[0];

      const age = (service as any).calculateAge(birthDateStr);

      expect(age).toBe(0);
    });
  });

  describe('create - multi-passenger bookings', () => {
    beforeEach(() => {
      mockFlightRepository.findOne.mockResolvedValue({
        id: 'flight-123',
        numberOfBookableSeats: 180
      });
      mockCustomerRepository.findOne.mockResolvedValue({
        id: 'user-123',
        name: 'João Silva',
        email: 'joao@example.com'
      });
    });

    it('should create booking with 1 adult passenger', async () => {
      const dto: CreateBookingDto = {
        flightId: 'flight-123',
        passengers: [{
          firstName: 'João',
          lastName: 'Silva',
          email: 'joao@example.com',
          phone: '(11) 99999-9999',
          document: '123.456.789-09',
          birthDate: '1990-01-01'
        }],
        totalAmount: 50000
      };

      const mockBooking = {
        booking_id: 'booking-123',
        customer: { id: 'user-123' },
        flight: { id: 'flight-123' },
        total_amount: 50000,
        status: BookingStatus.AWAITING_PAYMENT,
        passengers: [{
          first_name: 'João',
          last_name: 'Silva',
          email: 'joao@example.com',
          phone: '(11) 99999-9999',
          document: '123.456.789-09',
          birth_date: '1990-01-01'
        }],
        payments: []
      };

      mockRepository.create.mockReturnValue(mockBooking);
      mockRepository.save.mockResolvedValue(mockBooking);
      mockRepository.findOne.mockResolvedValue(mockBooking);

      const result = await service.create(dto, 'user-123');

      expect(result.passengers).toHaveLength(1);
      expect(result.passengers[0].firstName).toBe('João');
    });

    it('should create booking with 2 adult passengers', async () => {
      const dto: CreateBookingDto = {
        flightId: 'flight-123',
        passengers: [
          {
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao@example.com',
            phone: '(11) 99999-9999',
            document: '123.456.789-09',
            birthDate: '1990-01-01'
          },
          {
            firstName: 'Maria',
            lastName: 'Silva',
            email: 'maria@example.com',
            phone: '(11) 98888-8888',
            document: '987.654.321-00',
            birthDate: '1987-05-15'
          }
        ],
        totalAmount: 100000
      };

      const mockBooking = {
        booking_id: 'booking-123',
        customer: { id: 'user-123' },
        flight: { id: 'flight-123' },
        total_amount: 100000,
        status: BookingStatus.AWAITING_PAYMENT,
        passengers: [
          {
            first_name: 'João',
            last_name: 'Silva',
            email: 'joao@example.com',
            phone: '(11) 99999-9999',
            document: '123.456.789-09',
            birth_date: '1990-01-01'
          },
          {
            first_name: 'Maria',
            last_name: 'Silva',
            email: 'maria@example.com',
            phone: '(11) 98888-8888',
            document: '987.654.321-00',
            birth_date: '1987-05-15'
          }
        ],
        payments: []
      };

      mockRepository.create.mockReturnValue(mockBooking);
      mockRepository.save.mockResolvedValue(mockBooking);
      mockRepository.findOne.mockResolvedValue(mockBooking);

      const result = await service.create(dto, 'user-123');

      expect(result.passengers).toHaveLength(2);
      expect(result.passengers[0].firstName).toBe('João');
      expect(result.passengers[1].firstName).toBe('Maria');
    });

    it('should create booking with 1 adult + 1 child', async () => {
      const dto: CreateBookingDto = {
        flightId: 'flight-123',
        passengers: [
          {
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao@example.com',
            phone: '(11) 99999-9999',
            document: '123.456.789-09',
            birthDate: '1990-01-01'
          },
          {
            firstName: 'Pedro',
            lastName: 'Silva',
            email: 'pedro@example.com',
            phone: '(11) 97777-7777',
            document: '529.982.247-25',
            birthDate: '2015-03-20'
          }
        ],
        totalAmount: 100000
      };

      const mockBooking = {
        booking_id: 'booking-123',
        customer: { id: 'user-123' },
        flight: { id: 'flight-123' },
        total_amount: 100000,
        status: BookingStatus.AWAITING_PAYMENT,
        passengers: [
          {
            first_name: 'João',
            last_name: 'Silva',
            email: 'joao@example.com',
            phone: '(11) 99999-9999',
            document: '123.456.789-09',
            birth_date: '1990-01-01'
          },
          {
            first_name: 'Pedro',
            last_name: 'Silva',
            email: 'pedro@example.com',
            phone: '(11) 97777-7777',
            document: '529.982.247-25',
            birth_date: '2015-03-20'
          }
        ],
        payments: []
      };

      mockRepository.create.mockReturnValue(mockBooking);
      mockRepository.save.mockResolvedValue(mockBooking);
      mockRepository.findOne.mockResolvedValue(mockBooking);

      const result = await service.create(dto, 'user-123');

      expect(result.passengers).toHaveLength(2);
      expect(result.passengers[0].firstName).toBe('João');
      expect(result.passengers[1].firstName).toBe('Pedro');
    });

    it('should create booking with 2 adults + 2 children + 1 infant', async () => {
      const today = new Date();
      const infantBirthDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());

      const dto: CreateBookingDto = {
        flightId: 'flight-123',
        passengers: [
          {
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao@example.com',
            phone: '(11) 99999-9999',
            document: '123.456.789-09',
            birthDate: '1990-01-01'
          },
          {
            firstName: 'Maria',
            lastName: 'Silva',
            email: 'maria@example.com',
            phone: '(11) 98888-8888',
            document: '987.654.321-00',
            birthDate: '1987-05-15'
          },
          {
            firstName: 'Pedro',
            lastName: 'Silva',
            email: 'pedro@example.com',
            phone: '(11) 97777-7777',
            document: '529.982.247-25',
            birthDate: '2015-03-20'
          },
          {
            firstName: 'Ana',
            lastName: 'Silva',
            email: 'ana@example.com',
            phone: '(11) 96666-6666',
            document: '111.444.777-35',
            birthDate: '2018-08-10'
          },
          {
            firstName: 'Bebê',
            lastName: 'Silva',
            email: 'bebe@example.com',
            phone: '(11) 95555-5555',
            document: '222.333.444-05',
            birthDate: infantBirthDate.toISOString().split('T')[0]
          }
        ],
        totalAmount: 250000
      };

      const mockBooking = {
        booking_id: 'booking-123',
        customer: { id: 'user-123' },
        flight: { id: 'flight-123' },
        total_amount: 250000,
        status: BookingStatus.AWAITING_PAYMENT,
        passengers: dto.passengers.map(p => ({
          first_name: p.firstName,
          last_name: p.lastName,
          email: p.email,
          phone: p.phone,
          document: p.document,
          birth_date: p.birthDate
        })),
        payments: []
      };

      mockRepository.create.mockReturnValue(mockBooking);
      mockRepository.save.mockResolvedValue(mockBooking);
      mockRepository.findOne.mockResolvedValue(mockBooking);

      const result = await service.create(dto, 'user-123');

      expect(result.passengers).toHaveLength(5);
      expect(result.passengers[0].firstName).toBe('João');
      expect(result.passengers[1].firstName).toBe('Maria');
      expect(result.passengers[2].firstName).toBe('Pedro');
      expect(result.passengers[3].firstName).toBe('Ana');
      expect(result.passengers[4].firstName).toBe('Bebê');
    });

    it('should verify all passengers are saved in database', async () => {
      const dto: CreateBookingDto = {
        flightId: 'flight-123',
        passengers: [
          {
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao@example.com',
            phone: '(11) 99999-9999',
            document: '123.456.789-09',
            birthDate: '1990-01-01'
          },
          {
            firstName: 'Maria',
            lastName: 'Silva',
            email: 'maria@example.com',
            phone: '(11) 98888-8888',
            document: '987.654.321-00',
            birthDate: '1987-05-15'
          }
        ],
        totalAmount: 100000
      };

      const mockBooking = {
        booking_id: 'booking-123',
        customer: { id: 'user-123' },
        flight: { id: 'flight-123' },
        total_amount: 100000,
        status: BookingStatus.AWAITING_PAYMENT,
        passengers: [
          {
            first_name: 'João',
            last_name: 'Silva',
            email: 'joao@example.com',
            phone: '(11) 99999-9999',
            document: '123.456.789-09',
            birth_date: '1990-01-01'
          },
          {
            first_name: 'Maria',
            last_name: 'Silva',
            email: 'maria@example.com',
            phone: '(11) 98888-8888',
            document: '987.654.321-00',
            birth_date: '1987-05-15'
          }
        ],
        payments: []
      };

      mockRepository.create.mockReturnValue(mockBooking);
      mockRepository.save.mockResolvedValue(mockBooking);
      mockRepository.findOne.mockResolvedValue(mockBooking);

      await service.create(dto, 'user-123');

      // Verify that create was called with passengers array
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          passengers: expect.arrayContaining([
            expect.objectContaining({
              first_name: 'João',
              last_name: 'Silva'
            }),
            expect.objectContaining({
              first_name: 'Maria',
              last_name: 'Silva'
            })
          ])
        })
      );
    });

    it('should verify booking total amount is correct', async () => {
      const dto: CreateBookingDto = {
        flightId: 'flight-123',
        passengers: [
          {
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao@example.com',
            phone: '(11) 99999-9999',
            document: '123.456.789-09',
            birthDate: '1990-01-01'
          }
        ],
        totalAmount: 75000
      };

      const mockBooking = {
        booking_id: 'booking-123',
        customer: { id: 'user-123' },
        flight: { id: 'flight-123' },
        total_amount: 75000,
        status: BookingStatus.AWAITING_PAYMENT,
        passengers: [{
          first_name: 'João',
          last_name: 'Silva',
          email: 'joao@example.com',
          phone: '(11) 99999-9999',
          document: '123.456.789-09',
          birth_date: '1990-01-01'
        }],
        payments: []
      };

      mockRepository.create.mockReturnValue(mockBooking);
      mockRepository.save.mockResolvedValue(mockBooking);
      mockRepository.findOne.mockResolvedValue(mockBooking);

      const result = await service.create(dto, 'user-123');

      expect(result.totalAmount).toBe(75000);
    });
  });

  describe('validateBookingData - multi-passenger validation', () => {
    it('should pass validation with 1 adult', async () => {
      const dto: CreateBookingDto = {
        flightId: 'flight-123',
        passengers: [{
          firstName: 'João',
          lastName: 'Silva',
          email: 'joao@example.com',
          phone: '(11) 99999-9999',
          document: '123.456.789-09',
          birthDate: '1990-01-01'
        }],
        totalAmount: 50000
      };

      await expect((service as any).validateBookingData(dto)).resolves.not.toThrow();
    });

    it('should pass validation with 2 adults + 1 child', async () => {
      const dto: CreateBookingDto = {
        flightId: 'flight-123',
        passengers: [
          {
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao@example.com',
            phone: '(11) 99999-9999',
            document: '123.456.789-09',
            birthDate: '1985-01-01'
          },
          {
            firstName: 'Maria',
            lastName: 'Silva',
            email: 'maria@example.com',
            phone: '(11) 98888-8888',
            document: '987.654.321-00',
            birthDate: '1987-05-15'
          },
          {
            firstName: 'Pedro',
            lastName: 'Silva',
            email: 'pedro@example.com',
            phone: '(11) 97777-7777',
            document: '529.982.247-25',
            birthDate: '2015-03-20'
          }
        ],
        totalAmount: 150000
      };

      await expect((service as any).validateBookingData(dto)).resolves.not.toThrow();
    });

    it('should pass validation with 1 adult + 1 infant', async () => {
      const today = new Date();
      const infantBirthDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
      
      const dto: CreateBookingDto = {
        flightId: 'flight-123',
        passengers: [
          {
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao@example.com',
            phone: '(11) 99999-9999',
            document: '123.456.789-09',
            birthDate: '1990-01-01'
          },
          {
            firstName: 'Bebê',
            lastName: 'Silva',
            email: 'bebe@example.com',
            phone: '(11) 98888-8888',
            document: '987.654.321-00',
            birthDate: infantBirthDate.toISOString().split('T')[0]
          }
        ],
        totalAmount: 50000
      };

      await expect((service as any).validateBookingData(dto)).resolves.not.toThrow();
    });

    it('should fail validation with 0 adults (all children)', async () => {
      const dto: CreateBookingDto = {
        flightId: 'flight-123',
        passengers: [
          {
            firstName: 'Pedro',
            lastName: 'Silva',
            email: 'pedro@example.com',
            phone: '(11) 97777-7777',
            document: '529.982.247-25',
            birthDate: '2015-03-20'
          }
        ],
        totalAmount: 50000
      };

      await expect((service as any).validateBookingData(dto)).rejects.toThrow('Ao menos um adulto é obrigatório');
    });

    it('should fail validation with 2 infants + 1 adult (too many infants)', async () => {
      const today = new Date();
      const infant1BirthDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
      const infant2BirthDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      
      const dto: CreateBookingDto = {
        flightId: 'flight-123',
        passengers: [
          {
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao@example.com',
            phone: '(11) 99999-9999',
            document: '123.456.789-09',
            birthDate: '1990-01-01'
          },
          {
            firstName: 'Bebê1',
            lastName: 'Silva',
            email: 'bebe1@example.com',
            phone: '(11) 98888-8888',
            document: '987.654.321-00',
            birthDate: infant1BirthDate.toISOString().split('T')[0]
          },
          {
            firstName: 'Bebê2',
            lastName: 'Silva',
            email: 'bebe2@example.com',
            phone: '(11) 97777-7777',
            document: '529.982.247-25',
            birthDate: infant2BirthDate.toISOString().split('T')[0]
          }
        ],
        totalAmount: 50000
      };

      await expect((service as any).validateBookingData(dto)).rejects.toThrow('Número de bebês não pode exceder número de adultos');
    });

    it('should fail validation with invalid age (negative)', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const dto: CreateBookingDto = {
        flightId: 'flight-123',
        passengers: [
          {
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao@example.com',
            phone: '(11) 99999-9999',
            document: '123.456.789-09',
            birthDate: futureDate.toISOString().split('T')[0]
          }
        ],
        totalAmount: 50000
      };

      await expect((service as any).validateBookingData(dto)).rejects.toThrow('Idade inválida para passageiro João');
    });

    it('should fail validation with invalid age (> 120)', async () => {
      const dto: CreateBookingDto = {
        flightId: 'flight-123',
        passengers: [
          {
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao@example.com',
            phone: '(11) 99999-9999',
            document: '123.456.789-09',
            birthDate: '1800-01-01'
          }
        ],
        totalAmount: 50000
      };

      await expect((service as any).validateBookingData(dto)).rejects.toThrow('Idade inválida para passageiro João');
    });

    it('should fail validation with invalid CPF', async () => {
      const dto: CreateBookingDto = {
        flightId: 'flight-123',
        passengers: [
          {
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao@example.com',
            phone: '(11) 99999-9999',
            document: '111.111.111-11',
            birthDate: '1990-01-01'
          }
        ],
        totalAmount: 50000
      };

      await expect((service as any).validateBookingData(dto)).rejects.toThrow('CPF inválido para passageiro João');
    });
  });
});