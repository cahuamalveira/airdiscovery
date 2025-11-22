import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatbotService } from '../chatbot/chatbot.service';
import { ChatSessionRepository } from '../chatbot/repositories/chat-session.repository';
import { AmadeusClientService } from '../../common/amadeus/amadeus-client.service';
import { JsonChatSession } from '../chatbot/interfaces/json-response.interface';

describe('Flight Search with Passenger Composition Integration', () => {
  let chatbotService: ChatbotService;
  let amadeusClient: jest.Mocked<AmadeusClientService>;
  let repository: jest.Mocked<ChatSessionRepository>;

  beforeAll(async () => {
    const mockRepository = {
      saveSession: jest.fn(),
      getSession: jest.fn(),
      deleteSession: jest.fn(),
      getAllUserSessions: jest.fn(),
    };

    const mockAmadeusClient = {
      searchFlightOffers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        {
          provide: ChatSessionRepository,
          useValue: mockRepository,
        },
        {
          provide: AmadeusClientService,
          useValue: mockAmadeusClient,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                AWS_REGION: 'us-east-1',
                DYNAMODB_CHAT_SESSIONS_TABLE: 'airdiscovery-chat-sessions-test',
                CHAT_SESSION_TTL_DAYS: 30,
                BEDROCK_MODEL_ID: 'us.meta.llama4-scout-17b-instruct-v1:0',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    chatbotService = module.get<ChatbotService>(ChatbotService);
    amadeusClient = module.get(AmadeusClientService);
    repository = module.get(ChatSessionRepository);
  });

  describe('Flight search with passenger composition from session', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should pass correct parameters to Amadeus API with 2 adults + 1 child + 1 infant', async () => {
      const sessionId = 'test-session-multi-passenger';

      const mockSession: JsonChatSession = {
        sessionId,
        userId: 'test-user',
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
          destination_name: 'Rio de Janeiro',
          destination_iata: 'GIG',
          activities: ['Praia'],
          budget_in_brl: 8000,
          availability_months: ['Janeiro'],
          purpose: 'Férias em família',
          hobbies: [],
          passenger_composition: {
            adults: 2,
            children: [
              { age: 1, isPaying: false },
              { age: 8, isPaying: true },
            ],
          },
        },
        isComplete: true,
        hasRecommendation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(chatbotService, 'getChatSession').mockResolvedValue(mockSession);

      const params = await chatbotService.getFlightSearchParamsFromSession(sessionId, 7);

      expect(params).toBeDefined();
      expect(params?.originLocationCode).toBe('GRU');
      expect(params?.destinationLocationCode).toBe('GIG');
      expect(params?.adults).toBe(2);
      expect(params?.children).toBe(1); // Only child > 2 years
      expect(params?.infants).toBe(1); // Only child <= 2 years
    });

    it('should include correct passenger count in flight results', async () => {
      const sessionId = 'test-session-flight-results';

      const mockSession: JsonChatSession = {
        sessionId,
        userId: 'test-user',
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'Brasília',
          origin_iata: 'BSB',
          destination_name: 'Salvador',
          destination_iata: 'SSA',
          activities: ['Cultura'],
          budget_in_brl: 5000,
          availability_months: ['Fevereiro'],
          purpose: 'Lazer',
          hobbies: [],
          passenger_composition: {
            adults: 2,
            children: [{ age: 5, isPaying: true }],
          },
        },
        isComplete: true,
        hasRecommendation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(chatbotService, 'getChatSession').mockResolvedValue(mockSession);

      const params = await chatbotService.getFlightSearchParamsFromSession(sessionId, 7);

      // Verify parameters are correct for Amadeus API
      expect(params?.adults).toBe(2);
      expect(params?.children).toBe(1);
      expect(params?.infants).toBeUndefined();
    });

    it('should handle edge case with maximum passengers', async () => {
      const sessionId = 'test-session-max-passengers';

      const mockSession: JsonChatSession = {
        sessionId,
        userId: 'test-user',
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
          destination_name: 'Miami',
          destination_iata: 'MIA',
          activities: ['Compras'],
          budget_in_brl: 20000,
          availability_months: ['Julho'],
          purpose: 'Viagem em grupo',
          hobbies: [],
          passenger_composition: {
            adults: 4,
            children: [
              { age: 3, isPaying: true },
              { age: 7, isPaying: true },
              { age: 10, isPaying: true },
            ],
          },
        },
        isComplete: true,
        hasRecommendation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(chatbotService, 'getChatSession').mockResolvedValue(mockSession);

      const params = await chatbotService.getFlightSearchParamsFromSession(sessionId, 7);

      expect(params?.adults).toBe(4);
      expect(params?.children).toBe(3);
      expect(params?.infants).toBeUndefined();
    });

    it('should handle edge case with infants and adults', async () => {
      const sessionId = 'test-session-infants-adults';

      const mockSession: JsonChatSession = {
        sessionId,
        userId: 'test-user',
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'Rio de Janeiro',
          origin_iata: 'GIG',
          destination_name: 'Fortaleza',
          destination_iata: 'FOR',
          activities: ['Praia'],
          budget_in_brl: 4000,
          availability_months: ['Março'],
          purpose: 'Lazer',
          hobbies: [],
          passenger_composition: {
            adults: 2,
            children: [
              { age: 0, isPaying: false },
              { age: 1, isPaying: false },
            ],
          },
        },
        isComplete: true,
        hasRecommendation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(chatbotService, 'getChatSession').mockResolvedValue(mockSession);

      const params = await chatbotService.getFlightSearchParamsFromSession(sessionId, 7);

      expect(params?.adults).toBe(2);
      expect(params?.children).toBeUndefined();
      expect(params?.infants).toBe(2);
    });

    it('should default to 1 adult when passenger composition is missing (backward compatibility)', async () => {
      const sessionId = 'test-session-no-passengers';

      const mockSession: JsonChatSession = {
        sessionId,
        userId: 'test-user',
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
          passenger_composition: null,
        },
        isComplete: false,
        hasRecommendation: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(chatbotService, 'getChatSession').mockResolvedValue(mockSession);

      const params = await chatbotService.getFlightSearchParamsFromSession(sessionId, 7);

      // Should default to 1 adult for backward compatibility
      expect(params?.adults).toBe(1);
      expect(params?.children).toBeUndefined();
      expect(params?.infants).toBeUndefined();
    });
  });

  describe('Amadeus API parameter validation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should not include children parameter when count is 0', async () => {
      const sessionId = 'test-no-children';

      const mockSession: JsonChatSession = {
        sessionId,
        userId: 'test-user',
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
          destination_name: 'Lisboa',
          destination_iata: 'LIS',
          activities: ['Cultura'],
          budget_in_brl: 6000,
          availability_months: ['Abril'],
          purpose: 'Turismo',
          hobbies: [],
          passenger_composition: {
            adults: 2,
            children: null,
          },
        },
        isComplete: true,
        hasRecommendation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(chatbotService, 'getChatSession').mockResolvedValue(mockSession);

      const params = await chatbotService.getFlightSearchParamsFromSession(sessionId, 7);

      expect(params?.adults).toBe(2);
      expect(params).not.toHaveProperty('children');
      expect(params).not.toHaveProperty('infants');
    });

    it('should not include infants parameter when count is 0', async () => {
      const sessionId = 'test-no-infants';

      const mockSession: JsonChatSession = {
        sessionId,
        userId: 'test-user',
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'Recife',
          origin_iata: 'REC',
          destination_name: 'Maceió',
          destination_iata: 'MCZ',
          activities: ['Praia'],
          budget_in_brl: 3500,
          availability_months: ['Maio'],
          purpose: 'Lazer',
          hobbies: [],
          passenger_composition: {
            adults: 1,
            children: [
              { age: 5, isPaying: true },
              { age: 8, isPaying: true },
            ],
          },
        },
        isComplete: true,
        hasRecommendation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(chatbotService, 'getChatSession').mockResolvedValue(mockSession);

      const params = await chatbotService.getFlightSearchParamsFromSession(sessionId, 7);

      expect(params?.adults).toBe(1);
      expect(params?.children).toBe(2);
      expect(params).not.toHaveProperty('infants');
    });
  });
});
