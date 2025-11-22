import { PassengerComposition } from '../interfaces/json-response.interface';
import { ERROR_MESSAGES } from '../constants/error-messages.constant';

/**
 * Interface para o resultado da validação
 */
export interface PassengerValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Utilitário para validação de composição de passageiros
 * Implementa todas as regras de negócio para validação de passageiros
 */
export class PassengerValidationUtil {
  /**
   * Valida a composição completa de passageiros
   * 
   * @param composition Composição de passageiros a ser validada
   * @returns Resultado da validação com lista de erros
   */
  static validatePassengerComposition(
    composition: PassengerComposition | null | undefined,
  ): PassengerValidationResult {
    const errors: string[] = [];

    // Verifica se a composição foi fornecida
    if (!composition) {
      errors.push(ERROR_MESSAGES.MISSING_PASSENGER_COMPOSITION);
      return { isValid: false, errors };
    }

    // Valida número de adultos
    if (!composition.adults || composition.adults < 1) {
      errors.push(ERROR_MESSAGES.NO_ADULTS);
    }

    // Valida número máximo de passageiros (9 é o limite típico)
    const totalPassengers = composition.adults + (composition.children?.length || 0);
    if (totalPassengers > 9) {
      errors.push(ERROR_MESSAGES.TOO_MANY_PASSENGERS);
    }

    // Valida crianças se existirem
    if (composition.children && composition.children.length > 0) {
      const childValidation = this.validateChildren(composition.children);
      errors.push(...childValidation.errors);

      // Valida número de bebês vs adultos
      const infantCount = composition.children.filter(child => child.age <= 2).length;
      if (infantCount > composition.adults) {
        errors.push(ERROR_MESSAGES.TOO_MANY_INFANTS);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida array de crianças
   * 
   * @param children Array de crianças a ser validado
   * @returns Resultado da validação
   */
  private static validateChildren(
    children: readonly { age: number; isPaying: boolean }[],
  ): PassengerValidationResult {
    const errors: string[] = [];

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      
      // Valida idade da criança
      if (child.age < 0) {
        errors.push(`Criança ${i + 1}: ${ERROR_MESSAGES.INVALID_CHILD_AGE_NEGATIVE}`);
      } else if (child.age > 17) {
        errors.push(`Criança ${i + 1}: ${ERROR_MESSAGES.INVALID_CHILD_AGE_TOO_HIGH}`);
      }

      // Valida flag isPaying está correta
      const expectedIsPaying = child.age > 2;
      if (child.isPaying !== expectedIsPaying) {
        errors.push(
          `Criança ${i + 1}: Flag isPaying incorreta para idade ${child.age} anos`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida se o orçamento é suficiente para a composição de passageiros
   * 
   * @param budget Orçamento total
   * @param composition Composição de passageiros
   * @param minimumPerPerson Valor mínimo por passageiro pagante
   * @returns Resultado da validação
   */
  static validateBudgetForPassengers(
    budget: number | null | undefined,
    composition: PassengerComposition | null | undefined,
    minimumPerPerson: number = 500,
  ): PassengerValidationResult {
    const errors: string[] = [];

    if (!budget || budget <= 0) {
      errors.push('Orçamento deve ser maior que zero');
      return { isValid: false, errors };
    }

    if (!composition) {
      errors.push(ERROR_MESSAGES.MISSING_PASSENGER_COMPOSITION);
      return { isValid: false, errors };
    }

    // Calcula número de passageiros pagantes
    let payingPassengers = composition.adults;
    if (composition.children) {
      payingPassengers += composition.children.filter(child => child.age > 2).length;
    }

    const perPersonBudget = budget / payingPassengers;

    if (perPersonBudget < minimumPerPerson) {
      errors.push(
        ERROR_MESSAGES.INSUFFICIENT_BUDGET_DETAILED(perPersonBudget, minimumPerPerson),
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida parâmetros para busca de voos na API Amadeus
   * 
   * @param adults Número de adultos
   * @param children Número de crianças (>2 anos)
   * @param infants Número de bebês (<=2 anos)
   * @returns Resultado da validação
   */
  static validateFlightSearchParams(
    adults: number,
    children?: number,
    infants?: number,
  ): PassengerValidationResult {
    const errors: string[] = [];

    // Valida adultos
    if (adults < 1) {
      errors.push(ERROR_MESSAGES.NO_ADULTS);
    }

    // Valida bebês não excedem adultos
    if (infants && infants > adults) {
      errors.push(ERROR_MESSAGES.TOO_MANY_INFANTS);
    }

    // Valida números não negativos
    if (children && children < 0) {
      errors.push('Número de crianças não pode ser negativo');
    }

    if (infants && infants < 0) {
      errors.push('Número de bebês não pode ser negativo');
    }

    // Valida total de passageiros
    const total = adults + (children || 0) + (infants || 0);
    if (total > 9) {
      errors.push(ERROR_MESSAGES.TOO_MANY_PASSENGERS);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
