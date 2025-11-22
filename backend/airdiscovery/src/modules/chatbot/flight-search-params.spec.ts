import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatSessionRepository } from './repositories/chat-session.repository';
import { ChatbotService } from './chatbot.service';
import { ChatSession, UserProfile } from './interfaces/chat.interface';
import { CollectedData, JsonChatSession } from './interfaces/json-response.interface';

describe('Flight Search Parameter Builder', () => {
  let repository: ChatSessionRepository;
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
        }
      ]
    }).compile();

    repository = module.get<ChatSessionRepository>(ChatSessionRepository);
    service = module.get<ChatbotService>(ChatbotService);
  });

  describe('getFlightSearchParamsFromSession with passenger composition', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should build params with 1 adult only (no children/infants fields)', async () => {
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
      expect(params).not.toHaveProperty('infants');
    });

    it('should build params with 2 adults + 1 child (age 5) = adults: 2, children: 1', async () => {
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
            children: [
              { age: 5, isPaying: true }
            ]
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
      expect(params).not.toHaveProperty('infants');
    });

    it('should build params with 1 adult + 1 infant (age 1) = adults: 1, infants: 1', async () => {
      const sessionId = 'test-1-adult-1-infant';

      const mockJsonSession: JsonChatSession = {
        sessionId,
        userId: 'user-1-adult-1-infant',
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
            adults: 1,
            children: [
              { age: 1, isPaying: false }
            ]
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
      expect(params?.infants).toBe(1);
    });

    it('should build params with 2 adults + 2 children (ages 1, 8) = adults: 2, children: 1, infants: 1', async () => {
      const sessionId = 'test-2-adults-2-children';

      const mockJsonSession: JsonChatSession = {
        sessionId,
        userId: 'user-2-adults-2-children',
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'Rio de Janeiro',
          origin_iata: 'GIG',
          destination_name: 'Porto Seguro',
          destination_iata: 'BPS',
          activities: ['Praia', 'Aventura'],
          budget_in_brl: 8000,
          availability_months: ['Julho'],
          purpose: 'Férias em família',
          hobbies: [],
          passenger_composition: {
            adults: 2,
            children: [
              { age: 1, isPaying: false },
              { age: 8, isPaying: true }
            ]
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
      expect(params?.infants).toBe(1);
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
      expect(params).not.toHaveProperty('infants');
    });
  });
});
