import { JsonPromptBuilder } from './json-prompt-builder';

describe('JsonPromptBuilder', () => {
  describe('buildSystemPrompt', () => {
    it('should emphasize data preservation as the most important rule', () => {
      const prompt = JsonPromptBuilder.buildSystemPrompt();
      
      expect(prompt).toContain('REGRA MAIS IMPORTANTE - PRESERVAÇÃO DE DADOS');
      expect(prompt).toContain('NUNCA apague ou substitua dados já coletados por null');
      expect(prompt).toContain('COPIE TODOS esses dados para data_collected');
    });

    // Tests for button_options removal from LLM prompt (Requirements 1.1, 1.2, 1.3)
    describe('button_options removal', () => {
      it('should NOT include button_options in the JSON schema', () => {
        const prompt = JsonPromptBuilder.buildSystemPrompt();
        
        // The JSON schema section should not mention button_options
        expect(prompt).not.toContain('"button_options"');
        expect(prompt).not.toContain('button_options:');
      });

      it('should NOT include button_options in the examples', () => {
        const prompt = JsonPromptBuilder.buildSystemPrompt();
        
        // Examples should not contain button_options
        expect(prompt).not.toContain('"button_options":[');
        expect(prompt).not.toContain('"button_options": [');
      });

      it('should NOT include "COM BOTÕES" instructions in the prompt', () => {
        const prompt = JsonPromptBuilder.buildSystemPrompt();
        
        expect(prompt).not.toContain('COM BOTÕES');
        expect(prompt).not.toContain('com botões');
      });

      it('should NOT mention button_options rules or requirements', () => {
        const prompt = JsonPromptBuilder.buildSystemPrompt();
        
        expect(prompt).not.toContain('Inclua button_options');
        expect(prompt).not.toContain('button_options é OBRIGATÓRIO');
        expect(prompt).not.toContain('button_options deve ser null');
      });
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

    it('should NOT include button_options instructions in collecting_passengers stage', () => {
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
      // button_options should NOT be mentioned - backend generates them
      expect(prompt).not.toContain('button_options');
      expect(prompt).not.toContain('COM BOTÕES');
    });

    it('should NOT include button_options instructions in any stage', () => {
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

      expect(prompt).toContain('collecting_availability');
      expect(prompt).not.toContain('button_options');
      expect(prompt).not.toContain('COM BOTÕES');
    });
  });

  describe('validateResponseFormat', () => {
    it('should validate response without button_options (LLM no longer generates them)', () => {
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
        is_final_recommendation: false
      });

      const result = JsonPromptBuilder.validateResponseFormat(response);
      expect(result.isValid).toBe(true);
    });

    it('should validate response and ignore button_options if LLM still includes them (backward compatibility)', () => {
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

      // Should still be valid - we ignore button_options from LLM
      const result = JsonPromptBuilder.validateResponseFormat(response);
      expect(result.isValid).toBe(true);
    });

    it('should validate response for non-passenger stages', () => {
      const response = JSON.stringify({
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
          hobbies: null
        },
        next_question_key: 'availability',
        assistant_message: 'Em qual mês você tem disponibilidade?',
        is_final_recommendation: false
      });

      const result = JsonPromptBuilder.validateResponseFormat(response);
      expect(result.isValid).toBe(true);
    });
  });
});
