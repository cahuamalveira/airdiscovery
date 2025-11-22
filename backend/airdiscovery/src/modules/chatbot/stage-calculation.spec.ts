import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatSessionRepository } from './repositories/chat-session.repository';
import { ChatbotService } from './chatbot.service';
import { CollectedData, ConversationStage } from './interfaces/json-response.interface';

describe('Stage Calculation with Passengers', () => {
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

    service = module.get<ChatbotService>(ChatbotService);
  });

  describe('calculateCorrectStage with passenger composition', () => {
    it('should return collecting_passengers when passenger_composition is null', () => {
      const data: CollectedData = {
        origin_name: 'São Paulo',
        origin_iata: 'GRU',
        destination_name: null,
        destination_iata: null,
        activities: null,
        budget_in_brl: 3000,
        availability_months: null,
        purpose: null,
        hobbies: null,
        passenger_composition: null
      };

      // Access private method through type assertion
      const stage = (service as any).calculateCorrectStage(data, false);

      expect(stage).toBe('collecting_passengers');
    });

    it('should return collecting_passengers when adults count is 0', () => {
      const data: CollectedData = {
        origin_name: 'São Paulo',
        origin_iata: 'GRU',
        destination_name: null,
        destination_iata: null,
        activities: null,
        budget_in_brl: 3000,
        availability_months: null,
        purpose: null,
        hobbies: null,
        passenger_composition: {
          adults: 0,
          children: null
        }
      };

      const stage = (service as any).calculateCorrectStage(data, false);

      expect(stage).toBe('collecting_passengers');
    });

    it('should return collecting_availability when passenger_composition is complete', () => {
      const data: CollectedData = {
        origin_name: 'São Paulo',
        origin_iata: 'GRU',
        destination_name: null,
        destination_iata: null,
        activities: null,
        budget_in_brl: 3000,
        availability_months: null,
        purpose: null,
        hobbies: null,
        passenger_composition: {
          adults: 2,
          children: [
            { age: 5, isPaying: true }
          ]
        }
      };

      const stage = (service as any).calculateCorrectStage(data, false);

      expect(stage).toBe('collecting_availability');
    });

    it('should follow correct stage progression order', () => {
      // Test 1: No origin -> collecting_origin
      let data: CollectedData = {
        origin_name: null,
        origin_iata: null,
        destination_name: null,
        destination_iata: null,
        activities: null,
        budget_in_brl: null,
        availability_months: null,
        purpose: null,
        hobbies: null,
        passenger_composition: null
      };
      let stage = (service as any).calculateCorrectStage(data, false);
      expect(stage).toBe('collecting_origin');

      // Test 2: Has origin, no budget -> collecting_budget
      data = {
        ...data,
        origin_name: 'São Paulo',
        origin_iata: 'GRU'
      };
      stage = (service as any).calculateCorrectStage(data, false);
      expect(stage).toBe('collecting_budget');

      // Test 3: Has origin and budget, no passengers -> collecting_passengers
      data = {
        ...data,
        budget_in_brl: 3000
      };
      stage = (service as any).calculateCorrectStage(data, false);
      expect(stage).toBe('collecting_passengers');

      // Test 4: Has origin, budget, and passengers, no availability -> collecting_availability
      data = {
        ...data,
        passenger_composition: {
          adults: 1,
          children: null
        }
      };
      stage = (service as any).calculateCorrectStage(data, false);
      expect(stage).toBe('collecting_availability');

      // Test 5: Has origin, budget, passengers, and availability, no activities -> collecting_activities
      data = {
        ...data,
        availability_months: ['Janeiro']
      };
      stage = (service as any).calculateCorrectStage(data, false);
      expect(stage).toBe('collecting_activities');

      // Test 6: Has all above, no purpose -> collecting_purpose
      data = {
        ...data,
        activities: ['Praia']
      };
      stage = (service as any).calculateCorrectStage(data, false);
      expect(stage).toBe('collecting_purpose');

      // Test 7: Has all data -> recommendation_ready
      data = {
        ...data,
        purpose: 'Lazer',
        hobbies: ['Fotografia']
      };
      stage = (service as any).calculateCorrectStage(data, false);
      expect(stage).toBe('recommendation_ready');
    });

    it('should return recommendation_ready when is_final_recommendation is true', () => {
      const data: CollectedData = {
        origin_name: 'São Paulo',
        origin_iata: 'GRU',
        destination_name: 'Rio de Janeiro',
        destination_iata: 'GIG',
        activities: ['Praia'],
        budget_in_brl: 3000,
        availability_months: ['Janeiro'],
        purpose: 'Lazer',
        hobbies: ['Fotografia'],
        passenger_composition: {
          adults: 1,
          children: null
        }
      };

      const stage = (service as any).calculateCorrectStage(data, true);

      expect(stage).toBe('recommendation_ready');
    });
  });
});
