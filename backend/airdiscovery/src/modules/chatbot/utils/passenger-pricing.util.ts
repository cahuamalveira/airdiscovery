import { PassengerComposition } from '../interfaces/json-response.interface';

/**
 * Interface para o resultado do cálculo de preços
 */
export interface PricingCalculation {
  totalPassengers: number;
  payingPassengers: number;
  nonPayingPassengers: number;
  perPersonBudget: number;
  totalBudget: number;
}

/**
 * Interface para o resultado da validação de orçamento
 */
export interface BudgetValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Utilitário para cálculos de preços baseados em composição de passageiros
 * Implementa regras da legislação brasileira para classificação de passageiros
 */
export class PassengerPricingUtil {
  /**
   * Calcula preços baseado na composição de passageiros (simplificado)
   * Todos os passageiros são considerados pagantes
   * 
   * @param totalBudget Orçamento total disponível
   * @param composition Composição de passageiros (adultos e crianças)
   * @returns Cálculo detalhado de preços
   */
  static calculatePricing(
    totalBudget: number,
    composition: PassengerComposition,
  ): PricingCalculation {
    const adults = composition.adults;
    const children = composition.children || 0;
    
    const totalPassengers = adults + children;
    const payingPassengers = totalPassengers; // All passengers pay
    const nonPayingPassengers = 0;
    
    const perPersonBudget = totalBudget / payingPassengers;
    
    return {
      totalPassengers,
      payingPassengers,
      nonPayingPassengers,
      perPersonBudget,
      totalBudget,
    };
  }
  
  /**
   * Valida se o orçamento é suficiente para o número de passageiros pagantes
   * 
   * @param totalBudget Orçamento total disponível
   * @param composition Composição de passageiros
   * @param minimumPerPerson Valor mínimo por passageiro pagante (padrão: R$ 500)
   * @returns Resultado da validação com mensagem de erro se inválido
   */
  static validateBudget(
    totalBudget: number,
    composition: PassengerComposition,
    minimumPerPerson: number = 500,
  ): BudgetValidationResult {
    const pricing = this.calculatePricing(totalBudget, composition);
    
    if (pricing.perPersonBudget < minimumPerPerson) {
      return {
        isValid: false,
        message: `Orçamento insuficiente. Mínimo de R$ ${minimumPerPerson} por passageiro pagante. Você tem R$ ${pricing.perPersonBudget.toFixed(2)} por pessoa.`,
      };
    }
    
    return { isValid: true };
  }
}
