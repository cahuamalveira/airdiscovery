import { PassengerPricingUtil } from './passenger-pricing.util';
import { PassengerComposition } from '../interfaces/json-response.interface';

describe('PassengerPricingUtil', () => {
  describe('calculatePricing', () => {
    it('deve calcular preço com 1 adulto apenas (1 passageiro pagante)', () => {
      const composition: PassengerComposition = {
        adults: 1,
        children: null,
      };
      const totalBudget = 3000;

      const result = PassengerPricingUtil.calculatePricing(totalBudget, composition);

      expect(result.totalPassengers).toBe(1);
      expect(result.payingPassengers).toBe(1);
      expect(result.nonPayingPassengers).toBe(0);
      expect(result.perPersonBudget).toBe(3000);
      expect(result.totalBudget).toBe(3000);
    });

    it('deve calcular preço com 2 adultos (2 passageiros pagantes)', () => {
      const composition: PassengerComposition = {
        adults: 2,
        children: null,
      };
      const totalBudget = 6000;

      const result = PassengerPricingUtil.calculatePricing(totalBudget, composition);

      expect(result.totalPassengers).toBe(2);
      expect(result.payingPassengers).toBe(2);
      expect(result.nonPayingPassengers).toBe(0);
      expect(result.perPersonBudget).toBe(3000);
      expect(result.totalBudget).toBe(6000);
    });

    it('deve calcular preço com 1 adulto + 1 bebê (idade 1) = 1 passageiro pagante', () => {
      const composition: PassengerComposition = {
        adults: 1,
        children: [
          { age: 1, isPaying: false },
        ],
      };
      const totalBudget = 3000;

      const result = PassengerPricingUtil.calculatePricing(totalBudget, composition);

      expect(result.totalPassengers).toBe(2);
      expect(result.payingPassengers).toBe(1);
      expect(result.nonPayingPassengers).toBe(1);
      expect(result.perPersonBudget).toBe(3000);
      expect(result.totalBudget).toBe(3000);
    });

    it('deve calcular preço com 1 adulto + 1 criança (idade 5) = 2 passageiros pagantes', () => {
      const composition: PassengerComposition = {
        adults: 1,
        children: [
          { age: 5, isPaying: true },
        ],
      };
      const totalBudget = 4000;

      const result = PassengerPricingUtil.calculatePricing(totalBudget, composition);

      expect(result.totalPassengers).toBe(2);
      expect(result.payingPassengers).toBe(2);
      expect(result.nonPayingPassengers).toBe(0);
      expect(result.perPersonBudget).toBe(2000);
      expect(result.totalBudget).toBe(4000);
    });

    it('deve calcular preço com 2 adultos + 2 crianças (idades 1, 8) = 3 passageiros pagantes', () => {
      const composition: PassengerComposition = {
        adults: 2,
        children: [
          { age: 1, isPaying: false },
          { age: 8, isPaying: true },
        ],
      };
      const totalBudget = 9000;

      const result = PassengerPricingUtil.calculatePricing(totalBudget, composition);

      expect(result.totalPassengers).toBe(4);
      expect(result.payingPassengers).toBe(3);
      expect(result.nonPayingPassengers).toBe(1);
      expect(result.perPersonBudget).toBe(3000);
      expect(result.totalBudget).toBe(9000);
    });

    it('deve lidar com caso extremo de 0 crianças (array vazio)', () => {
      const composition: PassengerComposition = {
        adults: 2,
        children: [],
      };
      const totalBudget = 5000;

      const result = PassengerPricingUtil.calculatePricing(totalBudget, composition);

      expect(result.totalPassengers).toBe(2);
      expect(result.payingPassengers).toBe(2);
      expect(result.nonPayingPassengers).toBe(0);
      expect(result.perPersonBudget).toBe(2500);
      expect(result.totalBudget).toBe(5000);
    });
  });

  describe('validateBudget', () => {
    it('deve validar orçamento com valor suficiente por pessoa', () => {
      const composition: PassengerComposition = {
        adults: 2,
        children: [
          { age: 5, isPaying: true },
        ],
      };
      const totalBudget = 3000; // 1000 por pessoa pagante (3 pagantes)
      const minimumPerPerson = 500;

      const result = PassengerPricingUtil.validateBudget(
        totalBudget,
        composition,
        minimumPerPerson,
      );

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('deve rejeitar orçamento com valor insuficiente por pessoa', () => {
      const composition: PassengerComposition = {
        adults: 2,
        children: [
          { age: 5, isPaying: true },
        ],
      };
      const totalBudget = 1200; // 400 por pessoa pagante (3 pagantes)
      const minimumPerPerson = 500;

      const result = PassengerPricingUtil.validateBudget(
        totalBudget,
        composition,
        minimumPerPerson,
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.message).toContain('Orçamento insuficiente');
      expect(result.message).toContain('R$ 500');
      expect(result.message).toContain('R$ 400');
    });

    it('deve usar valor mínimo padrão de 500 quando não especificado', () => {
      const composition: PassengerComposition = {
        adults: 1,
        children: null,
      };
      const totalBudget = 400; // Abaixo do mínimo padrão de 500

      const result = PassengerPricingUtil.validateBudget(totalBudget, composition);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('R$ 500');
    });

    it('deve validar orçamento considerando apenas passageiros pagantes', () => {
      const composition: PassengerComposition = {
        adults: 1,
        children: [
          { age: 1, isPaying: false }, // Bebê não paga
          { age: 2, isPaying: false }, // Bebê não paga
        ],
      };
      const totalBudget = 600; // 600 por pessoa pagante (1 adulto)
      const minimumPerPerson = 500;

      const result = PassengerPricingUtil.validateBudget(
        totalBudget,
        composition,
        minimumPerPerson,
      );

      expect(result.isValid).toBe(true);
    });
  });
});
