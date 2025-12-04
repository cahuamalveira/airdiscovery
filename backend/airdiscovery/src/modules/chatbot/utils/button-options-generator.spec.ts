import { getButtonOptionsForStage, PASSENGER_BUTTON_OPTIONS, ButtonOption } from './button-options-generator';
import { ConversationStage, CollectedData } from '../interfaces/json-response.interface';

describe('ButtonOptionsGenerator', () => {
  const createCollectedData = (overrides: Partial<CollectedData> = {}): CollectedData => ({
    origin_name: null,
    origin_iata: null,
    destination_name: null,
    destination_iata: null,
    activities: null,
    budget_in_brl: null,
    availability_months: null,
    purpose: null,
    hobbies: null,
    passenger_composition: null,
    ...overrides,
  });

  describe('PASSENGER_BUTTON_OPTIONS', () => {
    it('should have adult options with labels 1-4 adultos', () => {
      expect(PASSENGER_BUTTON_OPTIONS.adults).toHaveLength(4);
      expect(PASSENGER_BUTTON_OPTIONS.adults[0]).toEqual({ label: '1 adulto', value: '1' });
      expect(PASSENGER_BUTTON_OPTIONS.adults[1]).toEqual({ label: '2 adultos', value: '2' });
      expect(PASSENGER_BUTTON_OPTIONS.adults[2]).toEqual({ label: '3 adultos', value: '3' });
      expect(PASSENGER_BUTTON_OPTIONS.adults[3]).toEqual({ label: '4 adultos', value: '4' });
    });

    it('should have children options with labels 0-3 crianças', () => {
      expect(PASSENGER_BUTTON_OPTIONS.children).toHaveLength(4);
      expect(PASSENGER_BUTTON_OPTIONS.children[0]).toEqual({ label: 'Nenhuma', value: '0' });
      expect(PASSENGER_BUTTON_OPTIONS.children[1]).toEqual({ label: '1 criança', value: '1' });
      expect(PASSENGER_BUTTON_OPTIONS.children[2]).toEqual({ label: '2 crianças', value: '2' });
      expect(PASSENGER_BUTTON_OPTIONS.children[3]).toEqual({ label: '3 crianças', value: '3' });
    });
  });

  describe('getButtonOptionsForStage', () => {
    describe('when stage is collecting_passengers', () => {
      it('should return adult options when no adults collected', () => {
        const data = createCollectedData();
        const result = getButtonOptionsForStage('collecting_passengers', data);
        
        expect(result).toEqual(PASSENGER_BUTTON_OPTIONS.adults);
      });

      it('should return adult options when passenger_composition is null', () => {
        const data = createCollectedData({ passenger_composition: null });
        const result = getButtonOptionsForStage('collecting_passengers', data);
        
        expect(result).toEqual(PASSENGER_BUTTON_OPTIONS.adults);
      });

      it('should return children options when adults collected but children is null', () => {
        const data = createCollectedData({
          passenger_composition: { adults: 2, children: null },
        });
        const result = getButtonOptionsForStage('collecting_passengers', data);
        
        expect(result).toEqual(PASSENGER_BUTTON_OPTIONS.children);
      });

      it('should return children options when adults is 1 and children is null', () => {
        const data = createCollectedData({
          passenger_composition: { adults: 1, children: null },
        });
        const result = getButtonOptionsForStage('collecting_passengers', data);
        
        expect(result).toEqual(PASSENGER_BUTTON_OPTIONS.children);
      });

      it('should return null when all passenger data is collected (children = 0)', () => {
        const data = createCollectedData({
          passenger_composition: { adults: 2, children: 0 },
        });
        const result = getButtonOptionsForStage('collecting_passengers', data);
        
        expect(result).toBeNull();
      });

      it('should return null when all passenger data is collected (children > 0)', () => {
        const data = createCollectedData({
          passenger_composition: { adults: 2, children: 2 },
        });
        const result = getButtonOptionsForStage('collecting_passengers', data);
        
        expect(result).toBeNull();
      });
    });

    describe('when stage is NOT collecting_passengers', () => {
      const nonPassengerStages: ConversationStage[] = [
        'collecting_origin',
        'collecting_budget',
        'collecting_availability',
        'collecting_activities',
        'collecting_purpose',
        'collecting_hobbies',
        'recommendation_ready',
        'error',
      ];

      nonPassengerStages.forEach((stage) => {
        it(`should return null for stage: ${stage}`, () => {
          const data = createCollectedData();
          const result = getButtonOptionsForStage(stage, data);
          
          expect(result).toBeNull();
        });
      });

      it('should return null for collecting_origin even with partial data', () => {
        const data = createCollectedData({
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
        });
        const result = getButtonOptionsForStage('collecting_origin', data);
        
        expect(result).toBeNull();
      });

      it('should return null for collecting_budget even with passenger data', () => {
        const data = createCollectedData({
          passenger_composition: { adults: 2, children: null },
        });
        const result = getButtonOptionsForStage('collecting_budget', data);
        
        expect(result).toBeNull();
      });

      it('should return null for collecting_availability', () => {
        const data = createCollectedData({
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
          budget_in_brl: 5000,
          passenger_composition: { adults: 2, children: 1 },
        });
        const result = getButtonOptionsForStage('collecting_availability', data);
        
        expect(result).toBeNull();
      });

      it('should return null for recommendation_ready', () => {
        const data = createCollectedData({
          origin_name: 'São Paulo',
          origin_iata: 'GRU',
          budget_in_brl: 5000,
          passenger_composition: { adults: 2, children: 1 },
          availability_months: ['Janeiro'],
          activities: ['Praia'],
          purpose: 'Lazer',
        });
        const result = getButtonOptionsForStage('recommendation_ready', data);
        
        expect(result).toBeNull();
      });
    });
  });
});
