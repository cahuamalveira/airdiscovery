import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AmadeusClientService } from './amadeus-client.service';

describe('AmadeusClientService - Multi-Passenger Validation', () => {
  let service: AmadeusClientService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AmadeusClientService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                AMADEUS_ENVIRONMENT: 'test',
                AMADEUS_URL: 'https://test.api.amadeus.com',
                AMADEUS_CLIENT_ID: 'test-client-id',
                AMADEUS_CLIENT_SECRET: 'test-client-secret',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AmadeusClientService>(AmadeusClientService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('searchFlightOffers - Passenger Validation', () => {
    it('should accept search with 1 adult only (valid)', async () => {
      // Mock fetch to return valid token and flight data
      global.fetch = jest.fn()
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

      const result = await service.searchFlightOffers({
        originLocationCode: 'GRU',
        destinationLocationCode: 'JFK',
        departureDate: '2025-12-01',
        adults: 1,
      });

      expect(result).toBeDefined();
      expect(result.meta.count).toBe(1);
    });

    it('should accept search with 2 adults + 1 child (valid)', async () => {
      global.fetch = jest.fn()
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

      const result = await service.searchFlightOffers({
        originLocationCode: 'GRU',
        destinationLocationCode: 'JFK',
        departureDate: '2025-12-01',
        adults: 2,
        children: 1,
      });

      expect(result).toBeDefined();
      expect(result.meta.count).toBe(1);
    });

    it('should accept search with 1 adult + 1 infant (valid)', async () => {
      global.fetch = jest.fn()
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

      const result = await service.searchFlightOffers({
        originLocationCode: 'GRU',
        destinationLocationCode: 'JFK',
        departureDate: '2025-12-01',
        adults: 1,
        infants: 1,
      });

      expect(result).toBeDefined();
      expect(result.meta.count).toBe(1);
    });

    it('should reject search with 1 adult + 2 infants (invalid - too many infants)', async () => {
      await expect(
        service.searchFlightOffers({
          originLocationCode: 'GRU',
          destinationLocationCode: 'JFK',
          departureDate: '2025-12-01',
          adults: 1,
          infants: 2,
        })
      ).rejects.toThrow(HttpException);

      await expect(
        service.searchFlightOffers({
          originLocationCode: 'GRU',
          destinationLocationCode: 'JFK',
          departureDate: '2025-12-01',
          adults: 1,
          infants: 2,
        })
      ).rejects.toThrow('Número de bebês não pode exceder o número de adultos');
    });

    it('should reject search with 0 adults (invalid)', async () => {
      await expect(
        service.searchFlightOffers({
          originLocationCode: 'GRU',
          destinationLocationCode: 'JFK',
          departureDate: '2025-12-01',
          adults: 0,
        })
      ).rejects.toThrow(HttpException);

      await expect(
        service.searchFlightOffers({
          originLocationCode: 'GRU',
          destinationLocationCode: 'JFK',
          departureDate: '2025-12-01',
          adults: 0,
        })
      ).rejects.toThrow('É necessário pelo menos um adulto na viagem');
    });

    it('should only include children parameter when count > 0', async () => {
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

      await service.searchFlightOffers({
        originLocationCode: 'GRU',
        destinationLocationCode: 'JFK',
        departureDate: '2025-12-01',
        adults: 2,
        children: 1,
      });

      // Check the second call (flight search)
      const flightSearchCall = mockFetch.mock.calls[1];
      const url = flightSearchCall[0] as string;
      
      expect(url).toContain('children=1');
    });

    it('should not include children parameter when count is 0 or undefined', async () => {
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

      await service.searchFlightOffers({
        originLocationCode: 'GRU',
        destinationLocationCode: 'JFK',
        departureDate: '2025-12-01',
        adults: 1,
      });

      const flightSearchCall = mockFetch.mock.calls[1];
      const url = flightSearchCall[0] as string;
      
      expect(url).not.toContain('children=');
    });

    it('should only include infants parameter when count > 0', async () => {
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

      await service.searchFlightOffers({
        originLocationCode: 'GRU',
        destinationLocationCode: 'JFK',
        departureDate: '2025-12-01',
        adults: 1,
        infants: 1,
      });

      const flightSearchCall = mockFetch.mock.calls[1];
      const url = flightSearchCall[0] as string;
      
      expect(url).toContain('infants=1');
    });

    it('should not include infants parameter when count is 0 or undefined', async () => {
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

      await service.searchFlightOffers({
        originLocationCode: 'GRU',
        destinationLocationCode: 'JFK',
        departureDate: '2025-12-01',
        adults: 2,
      });

      const flightSearchCall = mockFetch.mock.calls[1];
      const url = flightSearchCall[0] as string;
      
      expect(url).not.toContain('infants=');
    });
  });
});
