import { PassengerValidationUtil } from './passenger-validation.util';
import { PassengerComposition } from '../interfaces/json-response.interface';
import { ERROR_MESSAGES } from '../constants/error-messages.constant';

describe('PassengerValidationUtil', () => {
  describe('validatePassengerComposition', () => {
    it('should validate composition with 1 adult only', () => {
      const composition: PassengerComposition = {
        adults: 1,
        children: null,
      };

      const result = PassengerValidationUtil.validatePassengerComposition(composition);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate composition with 2 adults and 1 child', () => {
      const composition: PassengerComposition = {
        adults: 2,
        children: [{ age: 5, isPaying: true }],
      };

      const result = PassengerValidationUtil.validatePassengerComposition(composition);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate composition with 1 adult and 1 infant', () => {
      const composition: PassengerComposition = {
        adults: 1,
        children: [{ age: 1, isPaying: false }],
      };

      const result = PassengerValidationUtil.validatePassengerComposition(composition);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when composition is null', () => {
      const result = PassengerValidationUtil.validatePassengerComposition(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.MISSING_PASSENGER_COMPOSITION);
    });

    it('should fail validation when no adults', () => {
      const composition: PassengerComposition = {
        adults: 0,
        children: [{ age: 5, isPaying: true }],
      };

      const result = PassengerValidationUtil.validatePassengerComposition(composition);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.NO_ADULTS);
    });

    it('should fail validation when too many infants', () => {
      const composition: PassengerComposition = {
        adults: 1,
        children: [
          { age: 1, isPaying: false },
          { age: 2, isPaying: false },
        ],
      };

      const result = PassengerValidationUtil.validatePassengerComposition(composition);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.TOO_MANY_INFANTS);
    });

    it('should fail validation when child age is negative', () => {
      const composition: PassengerComposition = {
        adults: 1,
        children: [{ age: -1, isPaying: false }],
      };

      const result = PassengerValidationUtil.validatePassengerComposition(composition);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain(ERROR_MESSAGES.INVALID_CHILD_AGE_NEGATIVE);
    });

    it('should fail validation when child age is too high', () => {
      const composition: PassengerComposition = {
        adults: 1,
        children: [{ age: 18, isPaying: true }],
      };

      const result = PassengerValidationUtil.validatePassengerComposition(composition);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain(ERROR_MESSAGES.INVALID_CHILD_AGE_TOO_HIGH);
    });

    it('should fail validation when too many passengers', () => {
      const composition: PassengerComposition = {
        adults: 5,
        children: [
          { age: 5, isPaying: true },
          { age: 6, isPaying: true },
          { age: 7, isPaying: true },
          { age: 8, isPaying: true },
          { age: 9, isPaying: true },
        ],
      };

      const result = PassengerValidationUtil.validatePassengerComposition(composition);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.TOO_MANY_PASSENGERS);
    });
  });

  describe('validateBudgetForPassengers', () => {
    it('should validate sufficient budget for 1 adult', () => {
      const composition: PassengerComposition = {
        adults: 1,
        children: null,
      };

      const result = PassengerValidationUtil.validateBudgetForPassengers(
        1000,
        composition,
        500
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate sufficient budget for 2 adults and 1 child', () => {
      const composition: PassengerComposition = {
        adults: 2,
        children: [{ age: 5, isPaying: true }],
      };

      const result = PassengerValidationUtil.validateBudgetForPassengers(
        1500,
        composition,
        500
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation with insufficient budget', () => {
      const composition: PassengerComposition = {
        adults: 2,
        children: [{ age: 5, isPaying: true }],
      };

      const result = PassengerValidationUtil.validateBudgetForPassengers(
        1000,
        composition,
        500
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Orçamento insuficiente');
    });

    it('should not count infants as paying passengers', () => {
      const composition: PassengerComposition = {
        adults: 1,
        children: [{ age: 1, isPaying: false }],
      };

      const result = PassengerValidationUtil.validateBudgetForPassengers(
        500,
        composition,
        500
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateFlightSearchParams', () => {
    it('should validate params with 1 adult only', () => {
      const result = PassengerValidationUtil.validateFlightSearchParams(1);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate params with 2 adults and 1 child', () => {
      const result = PassengerValidationUtil.validateFlightSearchParams(2, 1);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate params with 1 adult and 1 infant', () => {
      const result = PassengerValidationUtil.validateFlightSearchParams(1, 0, 1);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation with 0 adults', () => {
      const result = PassengerValidationUtil.validateFlightSearchParams(0);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.NO_ADULTS);
    });

    it('should fail validation when infants exceed adults', () => {
      const result = PassengerValidationUtil.validateFlightSearchParams(1, 0, 2);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.TOO_MANY_INFANTS);
    });

    it('should fail validation with negative children count', () => {
      const result = PassengerValidationUtil.validateFlightSearchParams(1, -1);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with too many total passengers', () => {
      const result = PassengerValidationUtil.validateFlightSearchParams(5, 3, 2);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.TOO_MANY_PASSENGERS);
    });
  });
});
