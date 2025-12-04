import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatSessionRepository } from './repositories/chat-session.repository';
import { ChatbotService } from './chatbot.service';
import { JsonChatSession } from './interfaces/json-response.interface';
import { JsonResponseParser } from './utils/json-response-parser';
import { LoggerService } from '../logger/logger.service';

describe('Flight Search Parameter Builder', () => {
  let service: ChatbotService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ChatSessionRepository,
          useValue: {
            getSession: jest.fn(),
            saveSession: jest.fn(),
            deleteSession: jest.fn()
          }
        },
        ChatbotService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                AWS_REGION: 'us-east-1',
                DYNAMODB_CHAT_SESSIONS_TABLE: 'airdiscovery-chat-sessions-test',
                CHAT_SESSION_TTL_DAYS: 30,
                BEDROCK_MODEL_ID: 'us.meta.llama4-scout-17b-instruct-v1:0'
              };
              return config[key] || defaultValue;
            })
          }
        },
        {
          provide: JsonResponseParser,
          useValue: {
            sanitizeResponse: jest.fn(),
            parseResponse: jest.fn(),
            generateFallback: jest.fn()
          }
        },
        {
          provide: LoggerService,
          useValue: {
            child: jest.fn().mockReturnValue({
              log: jest.fn(),
              error: jest.fn(),
              warn: jest.fn(),
              debug: jest.fn()
            }),
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
  });

  describe('getFlightSearchParamsFromSession - Round-Trip Flight Support', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should include returnDate in search params', async () => {
      const sessionId = 'test-return-date';

      const mockJsonSession: JsonChatSession = {
        sessionId,
        userId: 'user-return-date',
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
          destination_name: 'Rio de Janeiro',
          destination_iata: 'GIG',
          activities: ['Praia'],
          budget_in_brl: 3000,
          availability_months: ['Janeiro'],
          purpose: 'Lazer',
          hobbies: [],
          passenger_composition: {
            adults: 1,
            children: null
          }
        },
        isComplete: true,
        hasRecommendation: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(service, 'getChatSession').mockResolvedValue(mockJsonSession);

      const params = await service.getFlightSearchParamsFromSession(sessionId, 7);

      expect(params).toBeDefined();
      expect(params?.returnDate).toBeDefined();
      expect(params?.returnDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    });

    it('should calculate returnDate as departureDate + 7 days', async () => {
      const sessionId = 'test-7-day-return';

      const mockJsonSession: JsonChatSession = {
        sessionId,
        userId: 'user-7-day-return',
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
          destination_name: 'Recife',
          destination_iata: 'REC',
          activities: ['Praia', 'Cultura'],
          budget_in_brl: 4000,
          availability_months: ['Fevereiro'],
          purpose: 'Férias',
          hobbies: ['Fotografia'],
          passenger_composition: {
            adults: 2,
            children: null
          }
        },
        isComplete: true,
        hasRecommendation: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(service, 'getChatSession').mockResolvedValue(mockJsonSession);

      const params = await service.getFlightSearchParamsFromSession(sessionId, 7);

      expect(params).toBeDefined();
      
      const departureDate = new Date(params!.departureDate);
      const returnDate = new Date(params!.returnDate);
      const diffInDays = Math.round((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(diffInDays).toBe(7);
    });

    it('should extract passenger composition correctly - 1 adult', async () => {
      const sessionId = 'test-1-adult';

      const mockJsonSession: JsonChatSession = {
        sessionId,
        userId: 'user-1-adult',
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
          destination_name: 'Rio de Janeiro',
          destination_iata: 'GIG',
          activities: ['Praia'],
          budget_in_brl: 3000,
          availability_months: ['Janeiro'],
          purpose: 'Lazer',
          hobbies: [],
          passenger_composition: {
            adults: 1,
            children: null
          }
        },
        isComplete: true,
        hasRecommendation: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(service, 'getChatSession').mockResolvedValue(mockJsonSession);

      const params = await service.getFlightSearchParamsFromSession(sessionId, 7);

      expect(params).toBeDefined();
      expect(params?.adults).toBe(1);
      expect(params).not.toHaveProperty('children');
    });

    it('should extract passenger composition correctly - 2 adults + 1 child', async () => {
      const sessionId = 'test-2-adults-1-child';

      const mockJsonSession: JsonChatSession = {
        sessionId,
        userId: 'user-2-adults-1-child',
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
          destination_name: 'Florianópolis',
          destination_iata: 'FLN',
          activities: ['Praia'],
          budget_in_brl: 5000,
          availability_months: ['Fevereiro'],
          purpose: 'Lazer',
          hobbies: [],
          passenger_composition: {
            adults: 2,
            children: 1
          }
        },
        isComplete: true,
        hasRecommendation: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(service, 'getChatSession').mockResolvedValue(mockJsonSession);

      const params = await service.getFlightSearchParamsFromSession(sessionId, 7);

      expect(params).toBeDefined();
      expect(params?.adults).toBe(2);
      expect(params?.children).toBe(1);
    });

    it('should validate flight search parameters structure', async () => {
      const sessionId = 'test-validate-params';

      const mockJsonSession: JsonChatSession = {
        sessionId,
        userId: 'user-validate-params',
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'Brasília',
          origin_iata: 'BSB',
          destination_name: 'Salvador',
          destination_iata: 'SSA',
          activities: ['Cultura'],
          budget_in_brl: 2500,
          availability_months: ['Março'],
          purpose: 'Lazer',
          hobbies: [],
          passenger_composition: {
            adults: 2,
            children: 1
          }
        },
        isComplete: true,
        hasRecommendation: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(service, 'getChatSession').mockResolvedValue(mockJsonSession);

      const params = await service.getFlightSearchParamsFromSession(sessionId, 7);

      expect(params).toBeDefined();
      expect(params).toHaveProperty('originLocationCode');
      expect(params).toHaveProperty('destinationLocationCode');
      expect(params).toHaveProperty('departureDate');
      expect(params).toHaveProperty('returnDate');
      expect(params).toHaveProperty('adults');
      
      expect(params?.originLocationCode).toBe('BSB');
      expect(params?.destinationLocationCode).toBe('SSA');
      expect(typeof params?.adults).toBe('number');
      expect(params?.adults).toBeGreaterThan(0);
    });

    it('should handle missing session data gracefully', async () => {
      const sessionId = 'test-missing-session';

      jest.spyOn(service, 'getChatSession').mockResolvedValue(undefined);

      const params = await service.getFlightSearchParamsFromSession(sessionId, 7);

      expect(params).toBeNull();
    });

    it('should return null when origin_iata is missing', async () => {
      const sessionId = 'test-no-origin';

      const mockJsonSession: JsonChatSession = {
        sessionId,
        userId: 'user-no-origin',
        messages: [],
        currentStage: 'collecting_budget',
        collectedData: {
          origin_name: 'São Paulo',
          origin_iata: null, // Missing IATA code
          destination_name: null,
          destination_iata: null,
          activities: null,
          budget_in_brl: 3000,
          availability_months: null,
          purpose: null,
          hobbies: null,
          passenger_composition: {
            adults: 1,
            children: null
          }
        },
        isComplete: false,
        hasRecommendation: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(service, 'getChatSession').mockResolvedValue(mockJsonSession);

      const params = await service.getFlightSearchParamsFromSession(sessionId, 7);

      expect(params).toBeNull();
    });

    it('should return null when destination_iata is missing', async () => {
      const sessionId = 'test-no-destination';

      const mockJsonSession: JsonChatSession = {
        sessionId,
        userId: 'user-no-destination',
        messages: [],
        currentStage: 'collecting_activities',
        collectedData: {
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
          destination_name: null,
          destination_iata: null, // Missing destination
          activities: ['Praia'],
          budget_in_brl: 3000,
          availability_months: ['Janeiro'],
          purpose: null,
          hobbies: null,
          passenger_composition: {
            adults: 2,
            children: null
          }
        },
        isComplete: false,
        hasRecommendation: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(service, 'getChatSession').mockResolvedValue(mockJsonSession);

      const params = await service.getFlightSearchParamsFromSession(sessionId, 7);

      expect(params).toBeNull();
    });

    it('should return params with default 1 adult when passenger composition is missing', async () => {
      const sessionId = 'test-no-passengers';

      const mockJsonSession: JsonChatSession = {
        sessionId,
        userId: 'user-no-passengers',
        messages: [],
        currentStage: 'collecting_availability',
        collectedData: {
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
          destination_name: 'Rio de Janeiro',
          destination_iata: 'GIG',
          activities: ['Praia'],
          budget_in_brl: 3000,
          availability_months: ['Janeiro'],
          purpose: null,
          hobbies: null,
          passenger_composition: null
        },
        isComplete: false,
        hasRecommendation: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(service, 'getChatSession').mockResolvedValue(mockJsonSession);

      const params = await service.getFlightSearchParamsFromSession(sessionId, 7);

      // Should return params with default 1 adult for backward compatibility
      expect(params).toBeDefined();
      expect(params?.adults).toBe(1);
      expect(params).not.toHaveProperty('children');
    });

    it('should not include children field when children count is 0', async () => {
      const sessionId = 'test-zero-children';

      const mockJsonSession: JsonChatSession = {
        sessionId,
        userId: 'user-zero-children',
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'Curitiba',
          origin_iata: 'CWB',
          destination_name: 'Fortaleza',
          destination_iata: 'FOR',
          activities: ['Praia'],
          budget_in_brl: 3500,
          availability_months: ['Abril'],
          purpose: 'Lazer',
          hobbies: ['Surf'],
          passenger_composition: {
            adults: 2,
            children: 0
          }
        },
        isComplete: true,
        hasRecommendation: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(service, 'getChatSession').mockResolvedValue(mockJsonSession);

      const params = await service.getFlightSearchParamsFromSession(sessionId, 7);

      expect(params).toBeDefined();
      expect(params?.adults).toBe(2);
      expect(params).not.toHaveProperty('children');
    });

    it('should handle custom trip duration correctly', async () => {
      const sessionId = 'test-custom-duration';

      const mockJsonSession: JsonChatSession = {
        sessionId,
        userId: 'user-custom-duration',
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'Porto Alegre',
          origin_iata: 'POA',
          destination_name: 'Natal',
          destination_iata: 'NAT',
          activities: ['Praia', 'Aventura'],
          budget_in_brl: 5000,
          availability_months: ['Dezembro'],
          purpose: 'Férias',
          hobbies: ['Mergulho'],
          passenger_composition: {
            adults: 2,
            children: 1
          }
        },
        isComplete: true,
        hasRecommendation: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(service, 'getChatSession').mockResolvedValue(mockJsonSession);

      const params = await service.getFlightSearchParamsFromSession(sessionId, 10); // 10-day trip

      expect(params).toBeDefined();
      
      const departureDate = new Date(params!.departureDate);
      const returnDate = new Date(params!.returnDate);
      const diffInDays = Math.round((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(diffInDays).toBe(10);
    });
  });
});
