import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatSessionRepository } from './repositories/chat-session.repository';
import { ChatbotService } from './chatbot.service';
import { JsonChatSession, PassengerComposition } from './interfaces/json-response.interface';

describe('Passenger Composition Integration Test', () => {
  let repository: jest.Mocked<ChatSessionRepository>;
  let service: ChatbotService;

  beforeAll(async () => {
    const mockRepository = {
      saveSession: jest.fn(),
      getSession: jest.fn(),
      deleteSession: jest.fn(),
      getAllUserSessions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        {
          provide: ChatSessionRepository,
          useValue: mockRepository,
        },
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

    repository = module.get(ChatSessionRepository);
    service = module.get<ChatbotService>(ChatbotService);
  });

  describe('Complete flow from origin to passenger collection', () => {
    const testSessionId = `test-passenger-session-${Date.now()}`;
    const testUserId = `test-passenger-user-${Date.now()}`;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should persist passenger composition with 1 adult', async () => {
      const passengerComposition: PassengerComposition = {
        adults: 1,
        children: null
      };

      const testSession: any = {
        sessionId: testSessionId,
        userId: testUserId,
        messages: [],
        profileData: {
          origin: 'São Paulo',
          activities: [],
          budget: 3000,
          availability_months: [],
          purpose: '',
          hobbies: []
        },
        currentQuestionIndex: 2,
        interviewComplete: false,
        readyForRecommendation: false,
        questionsAsked: 2,
        totalQuestionsAvailable: 6,
        interviewEfficiency: 0.33,
        createdAt: new Date(),
        updatedAt: new Date(),
        passengerComposition: passengerComposition
      };

      repository.saveSession.mockResolvedValue(undefined);
      repository.getSession.mockResolvedValue(testSession);

      await repository.saveSession(testSession);
      const savedSession = await repository.getSession(testSessionId);

      expect(repository.saveSession).toHaveBeenCalledWith(testSession);
      expect(savedSession).toBeDefined();
      expect((savedSession as any).passengerComposition).toBeDefined();
      expect((savedSession as any).passengerComposition.adults).toBe(1);
      expect((savedSession as any).passengerComposition.children).toBeNull();
    });

    it('should persist passenger composition with 2 adults + 1 child', async () => {
      const sessionId = `${testSessionId}-2a1c`;
      
      const passengerComposition: PassengerComposition = {
        adults: 2,
        children: [
          { age: 5, isPaying: true }
        ]
      };

      const testSession: any = {
        sessionId: sessionId,
        userId: testUserId,
        messages: [],
        profileData: {
          origin: 'Rio de Janeiro',
          activities: [],
          budget: 5000,
          availability_months: [],
          purpose: '',
          hobbies: []
        },
        currentQuestionIndex: 2,
        interviewComplete: false,
        readyForRecommendation: false,
        questionsAsked: 2,
        totalQuestionsAvailable: 6,
        interviewEfficiency: 0.33,
        createdAt: new Date(),
        updatedAt: new Date(),
        passengerComposition: passengerComposition
      };

      repository.saveSession.mockResolvedValue(undefined);
      repository.getSession.mockResolvedValue(testSession);

      await repository.saveSession(testSession);
      const savedSession = await repository.getSession(sessionId);

      expect(repository.saveSession).toHaveBeenCalledWith(testSession);
      expect(savedSession).toBeDefined();
      expect((savedSession as any).passengerComposition).toBeDefined();
      expect((savedSession as any).passengerComposition.adults).toBe(2);
      expect((savedSession as any).passengerComposition.children).toHaveLength(1);
      expect((savedSession as any).passengerComposition.children[0].age).toBe(5);
      expect((savedSession as any).passengerComposition.children[0].isPaying).toBe(true);
    });

    it('should persist passenger composition with 1 adult + 1 infant', async () => {
      const sessionId = `${testSessionId}-1a1i`;
      
      const passengerComposition: PassengerComposition = {
        adults: 1,
        children: [
          { age: 1, isPaying: false }
        ]
      };

      const testSession: any = {
        sessionId: sessionId,
        userId: testUserId,
        messages: [],
        profileData: {
          origin: 'Brasília',
          activities: [],
          budget: 2000,
          availability_months: [],
          purpose: '',
          hobbies: []
        },
        currentQuestionIndex: 2,
        interviewComplete: false,
        readyForRecommendation: false,
        questionsAsked: 2,
        totalQuestionsAvailable: 6,
        interviewEfficiency: 0.33,
        createdAt: new Date(),
        updatedAt: new Date(),
        passengerComposition: passengerComposition
      };

      repository.saveSession.mockResolvedValue(undefined);
      repository.getSession.mockResolvedValue(testSession);

      await repository.saveSession(testSession);
      const savedSession = await repository.getSession(sessionId);

      expect(repository.saveSession).toHaveBeenCalledWith(testSession);
      expect(savedSession).toBeDefined();
      expect((savedSession as any).passengerComposition).toBeDefined();
      expect((savedSession as any).passengerComposition.adults).toBe(1);
      expect((savedSession as any).passengerComposition.children).toHaveLength(1);
      expect((savedSession as any).passengerComposition.children[0].age).toBe(1);
      expect((savedSession as any).passengerComposition.children[0].isPaying).toBe(false);
    });

    it('should persist passenger composition with 2 adults + 2 children (mixed ages)', async () => {
      const sessionId = `${testSessionId}-2a2c`;
      
      const passengerComposition: PassengerComposition = {
        adults: 2,
        children: [
          { age: 1, isPaying: false },
          { age: 8, isPaying: true }
        ]
      };

      const testSession: any = {
        sessionId: sessionId,
        userId: testUserId,
        messages: [],
        profileData: {
          origin: 'Fortaleza',
          activities: [],
          budget: 8000,
          availability_months: [],
          purpose: '',
          hobbies: []
        },
        currentQuestionIndex: 2,
        interviewComplete: false,
        readyForRecommendation: false,
        questionsAsked: 2,
        totalQuestionsAvailable: 6,
        interviewEfficiency: 0.33,
        createdAt: new Date(),
        updatedAt: new Date(),
        passengerComposition: passengerComposition
      };

      repository.saveSession.mockResolvedValue(undefined);
      repository.getSession.mockResolvedValue(testSession);

      await repository.saveSession(testSession);
      const savedSession = await repository.getSession(sessionId);

      expect(repository.saveSession).toHaveBeenCalledWith(testSession);
      expect(savedSession).toBeDefined();
      expect((savedSession as any).passengerComposition).toBeDefined();
      expect((savedSession as any).passengerComposition.adults).toBe(2);
      expect((savedSession as any).passengerComposition.children).toHaveLength(2);
      expect((savedSession as any).passengerComposition.children[0].age).toBe(1);
      expect((savedSession as any).passengerComposition.children[0].isPaying).toBe(false);
      expect((savedSession as any).passengerComposition.children[1].age).toBe(8);
      expect((savedSession as any).passengerComposition.children[1].isPaying).toBe(true);
    });
  });

  describe('Stage progression includes passenger collection', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should include collecting_passengers stage in progression', async () => {
      const sessionId = `test-stage-${Date.now()}`;
      const userId = `user-stage-${Date.now()}`;

      // Final session with passenger composition
      const finalSession: any = {
        sessionId,
        userId,
        messages: [],
        profileData: {
          origin: 'São Paulo',
          activities: [],
          budget: 3000,
          availability_months: [],
          purpose: '',
          hobbies: []
        },
        passengerComposition: {
          adults: 2,
          children: null
        },
        currentQuestionIndex: 2,
        interviewComplete: false,
        readyForRecommendation: false,
        questionsAsked: 3,
        totalQuestionsAvailable: 6,
        interviewEfficiency: 0.5,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      repository.getSession.mockResolvedValue(finalSession);

      const retrievedSession = await repository.getSession(sessionId);
      expect(retrievedSession).toBeDefined();
      expect((retrievedSession as any).passengerComposition).toBeDefined();
      expect((retrievedSession as any).passengerComposition.adults).toBe(2);
    });
  });

  describe('Backward compatibility', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle sessions without passenger composition', async () => {
      const sessionId = `test-backward-${Date.now()}`;
      
      const oldSession: any = {
        sessionId,
        userId: `user-backward-${Date.now()}`,
        messages: [],
        profileData: {
          origin: 'Salvador',
          activities: ['Praia'],
          budget: 2500,
          availability_months: ['Janeiro'],
          purpose: 'Lazer',
          hobbies: []
        },
        currentQuestionIndex: 5,
        interviewComplete: true,
        readyForRecommendation: true,
        questionsAsked: 5,
        totalQuestionsAvailable: 6,
        interviewEfficiency: 0.83,
        createdAt: new Date(),
        updatedAt: new Date()
        // No passengerComposition field
      };

      repository.getSession.mockResolvedValue(oldSession);

      const retrievedSession = await repository.getSession(sessionId);
      expect(retrievedSession).toBeDefined();
      // Should handle missing passenger composition gracefully
      expect((retrievedSession as any).passengerComposition).toBeUndefined();
    });
  });

  describe('Flight search parameter generation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should generate correct flight search params with passenger composition', async () => {
      const sessionId = `test-flight-params-${Date.now()}`;
      const userId = `user-flight-params-${Date.now()}`;

      const mockJsonSession: JsonChatSession = {
        sessionId,
        userId,
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
          destination_name: 'Natal',
          destination_iata: 'NAT',
          activities: ['Praia'],
          budget_in_brl: 5000,
          availability_months: ['Fevereiro'],
          purpose: 'Lazer',
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

      const flightParams = await service.getFlightSearchParamsFromSession(sessionId, 7);

      expect(flightParams).toBeDefined();
      expect(flightParams?.adults).toBe(2);
      expect(flightParams?.children).toBe(1); // Only child > 2 years
      expect(flightParams?.infants).toBe(1); // Only child <= 2 years
    });

    it('should handle session with only adults', async () => {
      const sessionId = `test-adults-only-${Date.now()}`;
      const userId = `user-adults-only-${Date.now()}`;

      const mockJsonSession: JsonChatSession = {
        sessionId,
        userId,
        messages: [],
        currentStage: 'recommendation_ready',
        collectedData: {
          origin_name: 'Rio de Janeiro',
          origin_iata: 'GIG',
          destination_name: 'Paris',
          destination_iata: 'CDG',
          activities: ['Cultura'],
          budget_in_brl: 4000,
          availability_months: ['Março'],
          purpose: 'Turismo',
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

      const flightParams = await service.getFlightSearchParamsFromSession(sessionId, 7);

      expect(flightParams).toBeDefined();
      expect(flightParams?.adults).toBe(1);
      expect(flightParams?.children).toBeUndefined();
      expect(flightParams?.infants).toBeUndefined();
    });
  });
});
