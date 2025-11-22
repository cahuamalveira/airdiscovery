import { JsonPromptBuilder } from './json-prompt-builder';

describe('JsonPromptBuilder', () => {
  describe('buildSystemPrompt', () => {
    it('should emphasize data preservation as the most important rule', () => {
      const prompt = JsonPromptBuilder.buildSystemPrompt();
      
      expect(prompt).toContain('REGRA MAIS IMPORTANTE - PRESERVAÇÃO DE DADOS');
      expect(prompt).toContain('NUNCA apague ou substitua dados já coletados por null');
      expect(prompt).toContain('COPIE TODOS esses dados para data_collected');
    });

    it('should include button_options rule only for collecting_passengers stage', () => {
      const prompt = JsonPromptBuilder.buildSystemPrompt();
      
      // Should mention button_options only for collecting_passengers
      expect(prompt).toContain('Inclua button_options SOMENTE quando conversation_stage for "collecting_passengers"');
      expect(prompt).toContain('button_options deve ser null em todos os outros stages');
      
      // Should NOT say "SEMPRE inclua button_options"
      expect(prompt).not.toContain('SEMPRE inclua button_options ao perguntar sobre passageiros');
    });

    it('should specify button_options is required only during collecting_passengers', () => {
      const prompt = JsonPromptBuilder.buildSystemPrompt();
      
      expect(prompt).toContain('button_options é OBRIGATÓRIO SOMENTE quando conversation_stage é "collecting_passengers"');
    });

    it('should specify other stages should NOT have button_options', () => {
      const prompt = JsonPromptBuilder.buildSystemPrompt();
      
      expect(prompt).toContain('collecting_availability');
      expect(prompt).toContain('(SEM button_options)');
      expect(prompt).toContain('collecting_activities');
      expect(prompt).toContain('collecting_purpose');
    });
  });

  describe('buildContextualPrompt', () => {
    it('should include data preservation warnings', () => {
      const collectedData = {
        origin_name: 'São Paulo',
        origin_iata: 'GRU',
        budget_in_brl: 5000,
        passenger_composition: null,
        destination_name: null,
        destination_iata: null,
        activities: null,
        availability_months: null,
        purpose: null,
        hobbies: null
      };

      const prompt = JsonPromptBuilder.buildContextualPrompt(
        'collecting_passengers',
        collectedData,
        '2 adultos'
      );

      expect(prompt).toContain('PRESERVE');
      expect(prompt).toContain('COPIE todos os dados');
      expect(prompt).toContain('NÃO substitua campos preenchidos por null');
      expect(prompt).toContain('Dados Já Coletados');
    });

    it('should include instructions for button_options when in collecting_passengers stage', () => {
      const collectedData = {
        origin_name: 'São Paulo',
        origin_iata: 'GRU',
        budget_in_brl: 5000,
        passenger_composition: null,
        destination_name: null,
        destination_iata: null,
        activities: null,
        availability_months: null,
        purpose: null,
        hobbies: null
      };

      const prompt = JsonPromptBuilder.buildContextualPrompt(
        'collecting_passengers',
        collectedData,
        '2 adultos'
      );

      expect(prompt).toContain('collecting_passengers');
      expect(prompt).toContain('button_options');
    });

    it('should NOT emphasize button_options when in other stages', () => {
      const collectedData = {
        origin_name: 'São Paulo',
        origin_iata: 'GRU',
        budget_in_brl: 5000,
        passenger_composition: { adults: 2, children: null },
        destination_name: null,
        destination_iata: null,
        activities: null,
        availability_months: null,
        purpose: null,
        hobbies: null
      };

      const prompt = JsonPromptBuilder.buildContextualPrompt(
        'collecting_availability',
        collectedData,
        'Janeiro'
      );

      // Should mention moving to collecting_availability
      expect(prompt).toContain('collecting_availability');
      
      // Should not require button_options for this stage
      const lines = prompt.split('\n');
      const availabilityInstruction = lines.find(line => 
        line.includes('collecting_availability') && line.includes('MUDE')
      );
      
      // The instruction should not mention button_options
      if (availabilityInstruction) {
        expect(availabilityInstruction).not.toContain('button_options');
      }
    });
  });

  describe('validateResponseFormat', () => {
    it('should validate response with button_options during collecting_passengers', () => {
      const response = JSON.stringify({
        conversation_stage: 'collecting_passengers',
        data_collected: {
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
          destination_name: null,
          destination_iata: null,
          activities: null,
          budget_in_brl: 5000,
          passenger_composition: { adults: 2, children: null },
          availability_months: null,
          purpose: null,
          hobbies: null
        },
        next_question_key: 'passengers',
        assistant_message: 'Quantas crianças?',
        is_final_recommendation: false,
        button_options: [
          { label: 'Nenhuma', value: '0' },
          { label: '1 criança', value: '1' }
        ]
      });

      const result = JsonPromptBuilder.validateResponseFormat(response);
      expect(result.isValid).toBe(true);
    });

    it('should validate response without button_options in other stages', () => {
      const response = JSON.stringify({
        conversation_stage: 'collecting_availability',
        data_collected: {
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
          destination_name: null,
          destination_iata: null,
          activities: null,
          budget_in_brl: 5000,
          passenger_composition: { adults: 2, children: null },
          availability_months: null,
          purpose: null,
          hobbies: null
        },
        next_question_key: 'availability',
        assistant_message: 'Em qual mês você tem disponibilidade?',
        is_final_recommendation: false,
        button_options: null
      });

      const result = JsonPromptBuilder.validateResponseFormat(response);
      expect(result.isValid).toBe(true);
    });
  });
});
