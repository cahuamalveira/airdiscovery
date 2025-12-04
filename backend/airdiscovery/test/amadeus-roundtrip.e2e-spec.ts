import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AmadeusClientService } from '../src/common/amadeus/amadeus-client.service';
import { FlightsService } from '../src/modules/flights/flights.service';
import { Flight } from '../src/modules/flights/entities/flight.entity';
import { LoggerService } from '../src/modules/logger/logger.service';

/**
 * Amadeus Round-Trip Flight Integration Tests (TDD)
 * 
 * Tests round-trip flight search functionality with the Amadeus API
 * Requirements: 2.1, 2.2, 2.3, 2.5, 6.1, 6.2, 8.1
 */
describe('Amadeus Round-Trip Flights (e2e)', () => {
  let amadeusClient: AmadeusClientService;
  let flightsService: FlightsService;
  let mockFlightRepository: any;

  beforeAll(async () => {
    mockFlightRepository = {
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 'test-flight-id', ...data })),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AmadeusClientService,
        FlightsService,
        LoggerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                AMADEUS_ENVIRONMENT: 'test',
                AMADEUS_URL: 'https://test.api.amadeus.com',
                AMADEUS_CLIENT_ID: process.env.AMADEUS_CLIENT_ID || 'test-client-id',
                AMADEUS_CLIENT_SECRET: process.env.AMADEUS_CLIENT_SECRET || 'test-client-secret',
                LOG_LEVEL: 'error',
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: getRepositoryToken(Flight),
          useValue: mockFlightRepository,
        },
      ],
    }).compile();

    amadeusClient = module.get<AmadeusClientService>(AmadeusClientService);
    flightsService = module.get<FlightsService>(FlightsService);
  });

  /**
   * Test: API request includes returnDate parameter
   * Requirement: 2.1
   */
  describe('Round-trip search parameters', () => {
    it('should include returnDate parameter in API request', async () => {
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'test-token',
            token_type: 'Bearer',
            expires_in: 1799,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            meta: { count: 2 },
            data: [],
          }),
        });

      global.fetch = mockFetch;

      await amadeusClient.searchFlightOffers({
        originLocationCode: 'GRU',
        destinationLocationCode: 'JFK',
        departureDate: '2025-12-01',
        returnDate: '2025-12-10',
        adults: 1,
      });

      const flightSearchCall = mockFetch.mock.calls[1];
      const url = flightSearchCall[0] as string;
      
      expect(url).toContain('returnDate=2025-12-10');
      expect(url).toContain('departureDate=2025-12-01');
    });

    it('should not include returnDate for one-way flights', async () => {
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'test-token',
            token_type: 'Bearer',
            expires_in: 1799,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            meta: { count: 1 },
            data: [],
          }),
        });

      global.fetch = mockFetch;

      await amadeusClient.searchFlightOffers({
        originLocationCode: 'GRU',
        destinationLocationCode: 'JFK',
        departureDate: '2025-12-01',
        adults: 1,
      });

      const flightSearchCall = mockFetch.mock.calls[1];
      const url = flightSearchCall[0] as string;
      
      expect(url).not.toContain('returnDate');
    });
  });

  /**
   * Test: API response contains 2 itineraries for round-trip
   * Requirement: 2.2
   */
  describe('Round-trip response structure', () => {
    it('should return offers with 2 itineraries for round-trip flights', async () => {
      const mockRoundTripOffer = {
        id: 'offer-1',
        itineraries: [
          {
            duration: 'PT10H30M',
            segments: [
              {
                departure: { iataCode: 'GRU', at: '2025-12-01T10:00:00' },
                arrival: { iataCode: 'JFK', at: '2025-12-01T18:30:00' },
                carrierCode: 'LA',
                number: '8084',
                aircraft: { code: '789' },
                duration: 'PT10H30M',
                id: '1',
                numberOfStops: 0,
                blacklistedInEU: false,
              },
            ],
          },
          {
            duration: 'PT9H45M',
            segments: [
              {
                departure: { iataCode: 'JFK', at: '2025-12-10T20:00:00' },
                arrival: { iataCode: 'GRU', at: '2025-12-11T09:45:00' },
                carrierCode: 'LA',
                number: '8085',
                aircraft: { code: '789' },
                duration: 'PT9H45M',
                id: '2',
                numberOfStops: 0,
                blacklistedInEU: false,
              },
            ],
          },
        ],
        price: {
          currency: 'BRL',
          total: '3500.00',
          base: '3200.00',
          fees: [],
          grandTotal: '3500.00',
        },
      };

      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'test-token',
            token_type: 'Bearer',
            expires_in: 1799,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            meta: { count: 1 },
            data: [mockRoundTripOffer],
          }),
        });

      global.fetch = mockFetch;

      const result = await amadeusClient.searchFlightOffers({
        originLocationCode: 'GRU',
        destinationLocationCode: 'JFK',
        departureDate: '2025-12-01',
        returnDate: '2025-12-10',
        adults: 1,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].itineraries).toHaveLength(2);
      expect(result.data[0].itineraries[0].segments[0].departure.iataCode).toBe('GRU');
      expect(result.data[0].itineraries[1].segments[0].departure.iataCode).toBe('JFK');
    });
  });

  /**
   * Test: Validates return date is after departure date
   * Requirement: 2.3
   */
  describe('Date validation', () => {
    it('should reject search when return date is before departure date', async () => {
      await expect(
        amadeusClient.searchFlightOffers({
          originLocationCode: 'GRU',
          destinationLocationCode: 'JFK',
          departureDate: '2025-12-10',
          returnDate: '2025-12-01', // Before departure
          adults: 1,
        })
      ).rejects.toThrow('Return date must be after departure date');
    });

    it('should reject search when return date equals departure date', async () => {
      await expect(
        amadeusClient.searchFlightOffers({
          originLocationCode: 'GRU',
          destinationLocationCode: 'JFK',
          departureDate: '2025-12-01',
          returnDate: '2025-12-01', // Same as departure
          adults: 1,
        })
      ).rejects.toThrow('Return date must be after departure date');
    });

    it('should accept search when return date is after departure date', async () => {
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'test-token',
            token_type: 'Bearer',
            expires_in: 1799,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            meta: { count: 1 },
            data: [],
          }),
        });

      global.fetch = mockFetch;

      const result = await amadeusClient.searchFlightOffers({
        originLocationCode: 'GRU',
        destinationLocationCode: 'JFK',
        departureDate: '2025-12-01',
        returnDate: '2025-12-10',
        adults: 1,
      });

      expect(result).toBeDefined();
      expect(result.meta.count).toBe(1);
    });
  });

  /**
   * Test: Handles API errors for invalid date ranges
   * Requirement: 6.1, 6.2
   */
  describe('API error handling', () => {
    it('should handle Amadeus API error for invalid date range', async () => {
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'test-token',
            token_type: 'Bearer',
            expires_in: 1799,
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: async () => JSON.stringify({
            errors: [{
              code: 'INVALID_DATE_RANGE',
              detail: 'Return date must be after departure date',
            }],
          }),
        });

      global.fetch = mockFetch;

      await expect(
        amadeusClient.searchFlightOffers({
          originLocationCode: 'GRU',
          destinationLocationCode: 'JFK',
          departureDate: '2025-12-01',
          returnDate: '2025-11-30',
          adults: 1,
        })
      ).rejects.toThrow();
    });
  });

  /**
   * Test: Flight entity stores complete offer payload
   * Requirement: 2.5, 8.1
   */
  describe('Flight entity storage', () => {
    it('should store complete round-trip offer payload in flight entity', async () => {
      const mockRoundTripOffer = {
        id: 'offer-roundtrip-123',
        itineraries: [
          {
            duration: 'PT10H30M',
            segments: [
              {
                departure: { iataCode: 'GRU', at: '2025-12-01T10:00:00' },
                arrival: { iataCode: 'JFK', at: '2025-12-01T18:30:00' },
                carrierCode: 'LA',
                number: '8084',
                aircraft: { code: '789' },
                duration: 'PT10H30M',
                id: '1',
                numberOfStops: 0,
                blacklistedInEU: false,
              },
            ],
          },
          {
            duration: 'PT9H45M',
            segments: [
              {
                departure: { iataCode: 'JFK', at: '2025-12-10T20:00:00' },
                arrival: { iataCode: 'GRU', at: '2025-12-11T09:45:00' },
                carrierCode: 'LA',
                number: '8085',
                aircraft: { code: '789' },
                duration: 'PT9H45M',
                id: '2',
                numberOfStops: 0,
                blacklistedInEU: false,
              },
            ],
          },
        ],
        price: {
          currency: 'BRL',
          total: '3500.00',
          base: '3200.00',
          fees: [],
          grandTotal: '3500.00',
        },
      };

      const flight = await flightsService.createFlightFromOffer({
        amadeusOfferId: 'offer-roundtrip-123',
        offerPayload: mockRoundTripOffer,
      });

      expect(flight.amadeusOfferPayload).toBeDefined();
      expect(flight.amadeusOfferPayload.itineraries).toHaveLength(2);
      expect(flight.amadeusOfferPayload.id).toBe('offer-roundtrip-123');
    });
  });

  /**
   * Test: Retrieval of flight preserves all itineraries
   * Requirement: 8.1
   */
  describe('Flight retrieval', () => {
    it('should retrieve flight with complete round-trip itinerary data', async () => {
      const mockRoundTripOffer = {
        id: 'offer-roundtrip-456',
        itineraries: [
          {
            duration: 'PT10H30M',
            segments: [
              {
                departure: { iataCode: 'GRU', at: '2025-12-01T10:00:00' },
                arrival: { iataCode: 'JFK', at: '2025-12-01T18:30:00' },
                carrierCode: 'LA',
                number: '8084',
                aircraft: { code: '789' },
                duration: 'PT10H30M',
                id: '1',
                numberOfStops: 0,
                blacklistedInEU: false,
              },
            ],
          },
          {
            duration: 'PT9H45M',
            segments: [
              {
                departure: { iataCode: 'JFK', at: '2025-12-10T20:00:00' },
                arrival: { iataCode: 'GRU', at: '2025-12-11T09:45:00' },
                carrierCode: 'LA',
                number: '8085',
                aircraft: { code: '789' },
                duration: 'PT9H45M',
                id: '2',
                numberOfStops: 0,
                blacklistedInEU: false,
              },
            ],
          },
        ],
        price: {
          currency: 'BRL',
          total: '3500.00',
          base: '3200.00',
          fees: [],
          grandTotal: '3500.00',
        },
      };

      // Mock the repository to return saved flight
      mockFlightRepository.findOne.mockResolvedValue({
        id: 'test-flight-id',
        amadeusOfferId: 'offer-roundtrip-456',
        amadeusOfferPayload: mockRoundTripOffer,
        flightNumber: '8084',
        departureCode: 'GRU',
        arrivalCode: 'JFK',
        departureDateTime: new Date('2025-12-01T10:00:00'),
        arrivalDateTime: new Date('2025-12-01T18:30:00'),
        priceTotal: 3500.00,
        currency: 'BRL',
      });

      const flight = await flightsService.findFlightById('test-flight-id');

      expect(flight.amadeusOfferPayload).toBeDefined();
      expect(flight.amadeusOfferPayload.itineraries).toHaveLength(2);
      
      // Verify outbound itinerary
      const outbound = flight.amadeusOfferPayload.itineraries[0];
      expect(outbound.segments[0].departure.iataCode).toBe('GRU');
      expect(outbound.segments[0].arrival.iataCode).toBe('JFK');
      
      // Verify return itinerary
      const returnFlight = flight.amadeusOfferPayload.itineraries[1];
      expect(returnFlight.segments[0].departure.iataCode).toBe('JFK');
      expect(returnFlight.segments[0].arrival.iataCode).toBe('GRU');
    });
  });

  /**
   * Test: Passenger composition is included in API request
   * Requirement: 2.1
   */
  describe('Passenger composition in round-trip search', () => {
    it('should include passenger counts in round-trip search request', async () => {
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'test-token',
            token_type: 'Bearer',
            expires_in: 1799,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            meta: { count: 1 },
            data: [],
          }),
        });

      global.fetch = mockFetch;

      await amadeusClient.searchFlightOffers({
        originLocationCode: 'GRU',
        destinationLocationCode: 'JFK',
        departureDate: '2025-12-01',
        returnDate: '2025-12-10',
        adults: 2,
        children: 1,
        infants: 1,
      });

      const flightSearchCall = mockFetch.mock.calls[1];
      const url = flightSearchCall[0] as string;
      
      expect(url).toContain('adults=2');
      expect(url).toContain('children=1');
      expect(url).toContain('infants=1');
      expect(url).toContain('returnDate=2025-12-10');
    });
  });
});
