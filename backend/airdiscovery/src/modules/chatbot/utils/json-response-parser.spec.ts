import { Test, TestingModule } from '@nestjs/testing';
import { JsonResponseParser } from './json-response-parser';
import { LoggerService } from '../../logger/logger.service';

describe('JsonResponseParser', () => {
  let parser: JsonResponseParser;
  let mockLogger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    mockLogger = {
      child: jest.fn().mockReturnThis(),
      debug: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JsonResponseParser,
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    parser = module.get<JsonResponseParser>(JsonResponseParser);
  });

  describe('sanitizeAssistantMessage (via parseResponse)', () => {
    it('should clean JSON fragments from assistant_message', () => {
      // This simulates the exact error from the screenshot where button_options leaked into the message
      // Note: The message is valid JSON but the assistant_message field contains corrupted text
      const rawResponse = JSON.stringify({
        conversation_stage: 'collecting_availability',
        data_collected: {
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
          destination_name: null,
          destination_iata: null,
          activities: null,
          budget_in_brl: 5000,
          passenger_composition: { adults: 2, children: 1 },
          availability_months: null,
          purpose: null,
          hobbies: null,
        },
        next_question_key: 'availability',
        // Simulating corrupted message with JSON fragments
        assistant_message: '}] Em qual mês você tem disponibilidade?',
        is_final_recommendation: false,
      });

      const result = parser.parseResponse(rawResponse);

      expect(result.isValid).toBe(true);
      expect(result.parsedData).toBeDefined();
      // Should extract the question from the corrupted message
      expect(result.parsedData!.assistant_message).toContain('disponibilidade?');
      // Should not start with JSON fragments
      expect(result.parsedData!.assistant_message).not.toMatch(/^\s*[\}\]]/);
    });

    it('should handle message with leading JSON fragments', () => {
      const rawResponse = JSON.stringify({
        conversation_stage: 'collecting_passengers',
        data_collected: {
          origin_name: 'Rio',
          origin_iata: 'GIG',
          destination_name: null,
          destination_iata: null,
          activities: null,
          budget_in_brl: 3000,
          passenger_composition: { adults: 2, children: null },
          availability_months: null,
          purpose: null,
          hobbies: null,
        },
        next_question_key: 'passengers',
        assistant_message: '}] E quantas crianças vão viajar?',
        is_final_recommendation: false,
        button_options: [
          { label: 'Nenhuma', value: '0' },
          { label: '1 criança', value: '1' },
        ],
      });

      const result = parser.parseResponse(rawResponse);

      expect(result.isValid).toBe(true);
      expect(result.parsedData).toBeDefined();
      // Should extract the question from the corrupted message
      expect(result.parsedData!.assistant_message).toContain('crianças');
      // Should not have JSON fragments at start
      expect(result.parsedData!.assistant_message).not.toMatch(/^\s*[\}\]]/);
    });

    it('should preserve clean messages unchanged', () => {
      const rawResponse = JSON.stringify({
        conversation_stage: 'collecting_origin',
        data_collected: {
          origin_name: null,
          origin_iata: null,
          destination_name: null,
          destination_iata: null,
          activities: null,
          budget_in_brl: null,
          passenger_composition: null,
          availability_months: null,
          purpose: null,
          hobbies: null,
        },
        next_question_key: 'origin',
        assistant_message: 'De qual cidade você vai partir?',
        is_final_recommendation: false,
      });

      const result = parser.parseResponse(rawResponse);

      expect(result.isValid).toBe(true);
      expect(result.parsedData!.assistant_message).toBe('De qual cidade você vai partir?');
    });

    it('should convert unicode escapes to proper characters', () => {
      const rawResponse = JSON.stringify({
        conversation_stage: 'collecting_availability',
        data_collected: {
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
          destination_name: null,
          destination_iata: null,
          activities: null,
          budget_in_brl: 5000,
          passenger_composition: { adults: 2, children: 1 },
          availability_months: null,
          purpose: null,
          hobbies: null,
        },
        next_question_key: 'availability',
        assistant_message: 'Em qual m\\u00eas voc\\u00ea tem disponibilidade?',
        is_final_recommendation: false,
      });

      const result = parser.parseResponse(rawResponse);

      expect(result.isValid).toBe(true);
      // Unicode should be converted: \u00ea = ê, \u00e7 = ç
      expect(result.parsedData!.assistant_message).toContain('mês');
      expect(result.parsedData!.assistant_message).toContain('você');
    });
  });
});
