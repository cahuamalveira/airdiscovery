/**
 * Utilitário para construir parâmetros de busca de voos
 * baseado nos dados coletados do chatbot
 * 
 * NOTA: A lógica de duração, voos diretos e recomendações está no prompt da LLM.
 * Este arquivo apenas monta os parâmetros para a API Amadeus.
 */

import { CollectedData } from '../interfaces/json-response.interface';
import { convertAvailabilityToDateRange } from './date-converter.util';

export interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  nonStop?: boolean;
  max?: number;
}

/**
 * Constrói parâmetros de busca de voos baseado nos dados coletados
 * 
 * @param collectedData - Dados coletados do chatbot
 * @param options - Opções adicionais para a busca
 * @returns Parâmetros prontos para a API Amadeus
 */
export function buildFlightSearchParams(
  collectedData: CollectedData,
  options?: {
    adults?: number;
    nonStop?: boolean;
    max?: number;
    tripDuration?: number;
  }
): FlightSearchParams | null {
  // Valida se temos os dados mínimos necessários
  if (!collectedData.origin_iata || !collectedData.destination_iata) {
    return null;
  }

  // Converte os meses de disponibilidade em datas específicas
  // Usa duração padrão de 7 dias se não especificado
  const dateRange = convertAvailabilityToDateRange(
    collectedData.availability_months,
    options?.tripDuration || 7
  );

  return {
    originLocationCode: collectedData.origin_iata,
    destinationLocationCode: collectedData.destination_iata,
    departureDate: dateRange.departureDate,
    returnDate: dateRange.returnDate,
    adults: options?.adults || 1,
    nonStop: options?.nonStop ?? false,
    max: options?.max || 50
  };
}

/**
 * Valida se os dados coletados são suficientes para buscar voos
 * 
 * @param collectedData - Dados coletados do chatbot
 * @returns true se pode buscar voos
 */
export function canSearchFlights(collectedData: CollectedData): boolean {
  return !!(
    collectedData.origin_iata &&
    collectedData.destination_iata
  );
}

/**
 * Obtém uma descrição legível dos parâmetros de busca
 * 
 * @param collectedData - Dados coletados do chatbot
 * @returns String descritiva da busca
 */
export function getFlightSearchDescription(collectedData: CollectedData): string {
  const parts: string[] = [];

  if (collectedData.origin_name) {
    parts.push(`Origem: ${collectedData.origin_name} (${collectedData.origin_iata})`);
  }

  if (collectedData.destination_name) {
    parts.push(`Destino: ${collectedData.destination_name} (${collectedData.destination_iata})`);
  }

  if (collectedData.availability_months && collectedData.availability_months.length > 0) {
    const months = collectedData.availability_months.join(', ');
    parts.push(`Meses disponíveis: ${months}`);
  }

  if (collectedData.budget_in_brl) {
    const budget = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(collectedData.budget_in_brl);
    parts.push(`Orçamento: ${budget}`);
  }

  if (collectedData.activities && collectedData.activities.length > 0) {
    parts.push(`Atividades: ${collectedData.activities.join(', ')}`);
  }

  if (collectedData.purpose) {
    parts.push(`Propósito: ${collectedData.purpose}`);
  }

  return parts.join(' | ');
}
