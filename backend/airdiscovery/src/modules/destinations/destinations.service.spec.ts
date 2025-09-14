import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { DestinationsService } from './destinations.service';
import { AmadeusClientService } from '../../common/amadeus/amadeus-client.service';
import { SearchDestinationDto } from './dto/search-destination.dto';

// Mock do AmadeusClientService
const mockAmadeusClient = {
  searchFlightOffers: jest.fn(),
  searchAirports: jest.fn(),
};

// Mock do ConfigService
const mockConfigService = {
  get: jest.fn(),
};

describe('DestinationsService', () => {
  let service: DestinationsService;
  let amadeusClient: AmadeusClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DestinationsService,
        {
          provide: AmadeusClientService,
          useValue: mockAmadeusClient,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DestinationsService>(DestinationsService);
    amadeusClient = module.get<AmadeusClientService>(AmadeusClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchDestinations', () => {
    const mockSearchDto: SearchDestinationDto = {
      origin: 'MAD',
      destination: 'ATH',
      departureDate: '2024-12-01',
      returnDate: '2024-12-08',
      adults: 2,
      nonStop: false,
    };

    const mockAmadeusResponse = {
      meta: { count: 2 },
      data: [
        {
          id: '1',
          source: 'GDS',
          instantTicketingRequired: false,
          nonHomogeneous: false,
          oneWay: false,
          lastTicketingDate: '2024-11-30',
          numberOfBookableSeats: 5,
          itineraries: [
            {
              duration: 'PT3H45M',
              segments: [
                {
                  departure: {
                    iataCode: 'MAD',
                    terminal: '1',
                    at: '2024-12-01T06:50:00',
                  },
                  arrival: {
                    iataCode: 'ATH',
                    terminal: 'A',
                    at: '2024-12-01T11:35:00',
                  },
                  carrierCode: 'IB',
                  number: '3154',
                  aircraft: { code: '321' },
                  duration: 'PT3H45M',
                  id: 'segment1',
                  numberOfStops: 0,
                },
              ],
            },
          ],
          price: {
            currency: 'EUR',
            total: '250.00',
            base: '200.00',
            grandTotal: '250.00',
          },
          validatingAirlineCodes: ['IB'],
        },
      ],
      dictionaries: {
        locations: {
          MAD: { cityCode: 'MAD', countryCode: 'ES' },
          ATH: { cityCode: 'ATH', countryCode: 'GR' },
        },
        carriers: {
          IB: 'IBERIA',
        },
      },
    };

    it('should successfully search destinations', async () => {
      mockAmadeusClient.searchFlightOffers.mockResolvedValue(mockAmadeusResponse);

      const result = await service.searchDestinations(mockSearchDto);

      expect(result).toBeDefined();
      expect(result.meta.count).toBe(2);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('1');
      expect(result.data[0].price.currency).toBe('EUR');

      expect(mockAmadeusClient.searchFlightOffers).toHaveBeenCalledWith({
        originLocationCode: 'MAD',
        destinationLocationCode: 'ATH',
        departureDate: '2024-12-01',
        returnDate: '2024-12-08',
        adults: 2,
        nonStop: false,
        max: 50,
      });
    });

    it('should throw error for past departure date', async () => {
      const pastDateDto = {
        ...mockSearchDto,
        departureDate: '2020-01-01',
      };

      await expect(service.searchDestinations(pastDateDto)).rejects.toThrow(
        new HttpException(
          'A data de partida não pode ser anterior à data atual',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('searchAirports', () => {
    it('should throw error for short keyword', async () => {
      await expect(service.searchAirports('M')).rejects.toThrow(
        new HttpException(
          'A palavra-chave deve ter pelo menos 2 caracteres',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });
});
