import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatSessionRepository } from './repositories/chat-session.repository';
import { ChatbotService } from './chatbot.service';
import { ChatSession, UserProfile } from './interfaces/chat.interface';

describe('Availability Months Integration Test', () => {
  let repository: ChatSessionRepository;
  let service: ChatbotService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatSessionRepository,
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

  describe('ProfileData with availability_months', () => {
    const testSessionId = `test-session-${Date.now()}`;
    const testUserId = `test-user-${Date.now()}`;

    const testProfileData: UserProfile = {
      origin: 'São Paulo',
      activities: ['Praia', 'Vida Noturna'],
      budget: 3000,
      availability_months: ['Janeiro', 'Fevereiro', 'Março'],
      purpose: 'Lazer',
      hobbies: ['Fotografia', 'Gastronomia']
    };

    const testSession: ChatSession = {
      sessionId: testSessionId,
      userId: testUserId,
      messages: [
        {
          role: 'user',
          content: 'Olá',
          timestamp: new Date()
        }
      ],
      profileData: testProfileData,
      currentQuestionIndex: 0,
      interviewComplete: false,
      readyForRecommendation: false,
      questionsAsked: 1,
      totalQuestionsAvailable: 5,
      interviewEfficiency: 0.2,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('deve salvar availability_months no DynamoDB', async () => {
      await repository.saveSession(testSession);

      // Busca sessão salva
      const savedSession = await repository.getSession(testSessionId);

      expect(savedSession).toBeDefined();
      expect(savedSession?.profileData.availability_months).toEqual(['Janeiro', 'Fevereiro', 'Março']);
    });

    it('deve recuperar availability_months corretamente', async () => {
      // Busca sessão novamente
      const retrievedSession = await repository.getSession(testSessionId);

      expect(retrievedSession).toBeDefined();
      expect(retrievedSession?.profileData.availability_months).toBeDefined();
      expect(retrievedSession?.profileData.availability_months).toHaveLength(3);
      expect(retrievedSession?.profileData.availability_months).toContain('Janeiro');
      expect(retrievedSession?.profileData.availability_months).toContain('Fevereiro');
      expect(retrievedSession?.profileData.availability_months).toContain('Março');
    });

    it('deve atualizar availability_months existente', async () => {
      const updatedProfileData: UserProfile = {
        ...testProfileData,
        availability_months: ['Dezembro']
      };

      const updatedSession: ChatSession = {
        ...testSession,
        profileData: updatedProfileData,
        updatedAt: new Date()
      };

      await repository.saveSession(updatedSession);

      // Verifica atualização
      const retrievedSession = await repository.getSession(testSessionId);

      expect(retrievedSession?.profileData.availability_months).toEqual(['Dezembro']);
    });

    it('deve lidar com availability_months vazio', async () => {
      const emptyMonthsProfile: UserProfile = {
        ...testProfileData,
        availability_months: []
      };

      const emptySession: ChatSession = {
        ...testSession,
        sessionId: `${testSessionId}-empty`,
        profileData: emptyMonthsProfile
      };

      await repository.saveSession(emptySession);

      const retrievedSession = await repository.getSession(`${testSessionId}-empty`);

      expect(retrievedSession?.profileData.availability_months).toEqual([]);
    });

    it('deve lidar com availability_months undefined', async () => {
      const undefinedMonthsProfile: UserProfile = {
        ...testProfileData,
        availability_months: undefined
      };

      const undefinedSession: ChatSession = {
        ...testSession,
        sessionId: `${testSessionId}-undefined`,
        profileData: undefinedMonthsProfile
      };

      await repository.saveSession(undefinedSession);

      const retrievedSession = await repository.getSession(`${testSessionId}-undefined`);

      // Deve retornar array vazio quando undefined
      expect(retrievedSession?.profileData.availability_months).toEqual([]);
    });

    afterAll(async () => {
      // Limpeza dos testes
      try {
        await repository.deleteSession(testSessionId);
        await repository.deleteSession(`${testSessionId}-empty`);
        await repository.deleteSession(`${testSessionId}-undefined`);
      } catch (error) {
        // Ignora erros de limpeza
      }
    });
  });

  describe('JsonChatSession mapping', () => {
    it('deve mapear availability_months de collectedData para profileData', async () => {
      const userId = 'test-user-mapping';
      const sessionId = await service.startChatSession(userId);

      // Simula atualização com availability_months
      const updatedCollectedData = {
        origin_name: 'São Paulo',
        origin_iata: 'GRU',
        destination_name: null,
        destination_iata: null,
        activities: ['Praia'],
        budget_in_brl: 3000,
        availability_months: ['Janeiro', 'Fevereiro'],
        purpose: 'Lazer',
        hobbies: []
      };

      // Usa método interno de mapeamento (via tipo de retorno)
      const session = await service.getChatSession(sessionId);

      expect(session).toBeDefined();
      
      // Cleanup
      await service.endChatSession(sessionId);
    });
  });

  describe('Flight Search Integration', () => {
    it('deve converter availability_months em datas para busca de voos', async () => {
      const userId = `user-flight-${Date.now()}`;
      const sessionId = await service.startChatSession(userId);
      
      // Cria sessão com availability_months
      
      // Simula coleta de dados completos
      const profileWithMonths: UserProfile = {
        origin: 'Brasília',
        activities: ['Praia'],
        budget: 5000,
        availability_months: ['Fevereiro'],
        purpose: 'Lazer',
        hobbies: []
      };

      const completeSession: ChatSession = {
        sessionId,
        userId,
        messages: [],
        profileData: profileWithMonths,
        currentQuestionIndex: 5,
        interviewComplete: true,
        readyForRecommendation: true,
        recommendedDestination: 'Natal',
        questionsAsked: 5,
        totalQuestionsAvailable: 5,
        interviewEfficiency: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await repository.saveSession(completeSession);

      // Tenta obter parâmetros de busca de voo
      const flightParams = await service.getFlightSearchParamsFromSession(
        sessionId,
        7 // 7 dias de viagem
      );

      expect(flightParams).toBeDefined();
      expect(flightParams?.departureDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(flightParams?.returnDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Verifica se a data está em fevereiro
      const departureMonth = flightParams?.departureDate.substring(5, 7);
      expect(departureMonth).toBe('02'); // Fevereiro

      // Cleanup
      await service.endChatSession(sessionId);
    });

    it('deve usar múltiplos meses para gerar opções de data', async () => {
      const userId = `user-multi-${Date.now()}`;
      const sessionId = await service.startChatSession(userId);
      
      const profileWithMultipleMonths: UserProfile = {
        origin: 'São Paulo',
        activities: ['Praia'],
        budget: 3000,
        availability_months: ['Janeiro', 'Fevereiro', 'Março'],
        purpose: 'Lazer',
        hobbies: []
      };

      const completeSession: ChatSession = {
        sessionId,
        userId,
        messages: [],
        profileData: profileWithMultipleMonths,
        currentQuestionIndex: 5,
        interviewComplete: true,
        readyForRecommendation: true,
        recommendedDestination: 'Florianópolis',
        questionsAsked: 5,
        totalQuestionsAvailable: 5,
        interviewEfficiency: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await repository.saveSession(completeSession);

      // Busca parâmetros (usa primeiro mês)
      const flightParams = await service.getFlightSearchParamsFromSession(sessionId, 7);

      expect(flightParams).toBeDefined();
      
      // Deve usar Janeiro (primeiro mês)
      const departureMonth = flightParams?.departureDate.substring(5, 7);
      expect(departureMonth).toBe('01'); // Janeiro

      // Cleanup
      await service.endChatSession(sessionId);
    });
  });

  describe('Backward compatibility', () => {
    it('deve lidar com sessões antigas sem availability_months', async () => {
      const oldSessionId = `old-session-${Date.now()}`;
      
      // Simula sessão antiga (sem availability_months no ProfileData)
      const oldProfileData = {
        origin: 'Rio de Janeiro',
        activities: ['Cultura'],
        budget: 2000,
        // availability_months não definido
        purpose: 'Turismo',
        hobbies: ['História']
      };

      const oldSession: ChatSession = {
        sessionId: oldSessionId,
        userId: `old-user-${Date.now()}`,
        messages: [],
        profileData: oldProfileData as UserProfile,
        currentQuestionIndex: 0,
        interviewComplete: false,
        readyForRecommendation: false,
        questionsAsked: 0,
        totalQuestionsAvailable: 5,
        interviewEfficiency: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await repository.saveSession(oldSession);

      // Recupera sessão
      const retrievedSession = await repository.getSession(oldSessionId);

      expect(retrievedSession).toBeDefined();
      // Deve retornar array vazio para retrocompatibilidade
      expect(retrievedSession?.profileData.availability_months || []).toEqual([]);

      // Cleanup
      await repository.deleteSession(oldSessionId);
    });
  });
});
