/**
 * Utilitário para converter meses de disponibilidade em datas específicas
 * para uso na API Amadeus
 */

import { addDays, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Sao_Paulo';

interface DateRange {
  departureDate: string; // Formato: YYYY-MM-DD
  returnDate: string;    // Formato: YYYY-MM-DD
}

/**
 * Obtém a data atual no timezone de São Paulo
 */
function getNowInSaoPaulo(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

/**
 * Mapeia nomes de meses em português para números (1-12)
 */
const MONTH_MAP: Record<string, number> = {
  // Português completo
  'janeiro': 1,
  'fevereiro': 2,
  'marco': 3,  // Normalizado sem cedilha
  'março': 3,  // Com cedilha também
  'abril': 4,
  'maio': 5,
  'junho': 6,
  'julho': 7,
  'agosto': 8,
  'setembro': 9,
  'outubro': 10,
  'novembro': 11,
  'dezembro': 12,
  // Abreviações
  'jan': 1,
  'fev': 2,
  'mar': 3,
  'abr': 4,
  'mai': 5,
  'jun': 6,
  'jul': 7,
  'ago': 8,
  'set': 9,
  'out': 10,
  'nov': 11,
  'dez': 12,
};

/**
 * Normaliza o nome do mês para o formato padrão
 */
function normalizeMonth(month: string): string {
  return month
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim();
}

/**
 * Converte nome do mês para número (1-12)
 */
function monthNameToNumber(monthName: string): number | null {
  const normalized = normalizeMonth(monthName);
  return MONTH_MAP[normalized] || null;
}

/**
 * Calcula a data de ida baseada no mês de disponibilidade
 * Retorna uma data no meio do mês, pelo menos 14 dias no futuro
 */
function calculateDepartureDate(monthNumber: number, year: number): Date {
  const now = getNowInSaoPaulo();
  const targetDate = new Date(year, monthNumber - 1, 15); // Dia 15 do mês
  
  // Se a data calculada está no passado ou muito próxima (menos de 14 dias)
  const minDate = addDays(now, 14); // Pelo menos 14 dias no futuro
  
  if (targetDate < minDate) {
    // Se o mês já passou ou está muito próximo, usa o mesmo mês do próximo ano
    return new Date(year + 1, monthNumber - 1, 15);
  }
  
  return targetDate;
}

/**
 * Converte array de meses de disponibilidade em um range de datas
 * para busca de voos (ida e volta)
 * 
 * @param availabilityMonths - Array de meses (ex: ["Janeiro", "Fevereiro"])
 * @param tripDuration - Duração da viagem em dias (padrão: 7)
 * @returns Objeto com departureDate e returnDate no formato YYYY-MM-DD
 */
export function convertAvailabilityToDateRange(
  availabilityMonths: readonly string[] | string[] | null | undefined,
  tripDuration: number = 7
): DateRange {
  const now = getNowInSaoPaulo();
  const currentYear = now.getFullYear();
  
  // Caso padrão: se não houver meses especificados, usa 30 dias no futuro
  if (!availabilityMonths || availabilityMonths.length === 0) {
    const departureDate = addDays(now, 30);
    const returnDate = addDays(departureDate, tripDuration);
    
    return {
      departureDate: format(departureDate, 'yyyy-MM-dd'),
      returnDate: format(returnDate, 'yyyy-MM-dd')
    };
  }
  
  // Converte os meses para números e filtra inválidos
  const monthNumbers = availabilityMonths
    .map(monthNameToNumber)
    .filter((num): num is number => num !== null)
    .sort((a, b) => a - b); // Ordena do menor para o maior
  
  if (monthNumbers.length === 0) {
    // Se nenhum mês válido foi encontrado, usa padrão
    const nowFallback = getNowInSaoPaulo();
    const departureDate = addDays(nowFallback, 30);
    const returnDate = addDays(departureDate, tripDuration);
    
    return {
      departureDate: format(departureDate, 'yyyy-MM-dd'),
      returnDate: format(returnDate, 'yyyy-MM-dd')
    };
  }
  
  // Usa o primeiro mês disponível
  const firstAvailableMonth = monthNumbers[0];
  const departureDate = calculateDepartureDate(firstAvailableMonth, currentYear);
  const returnDate = addDays(departureDate, tripDuration);
  
  return {
    departureDate: format(departureDate, 'yyyy-MM-dd'),
    returnDate: format(returnDate, 'yyyy-MM-dd')
  };
}



/**
 * Converte meses de disponibilidade para sugestões de múltiplas datas
 * Útil para oferecer ao usuário várias opções de datas dentro dos meses disponíveis
 * 
 * @param availabilityMonths - Array de meses
 * @param tripDuration - Duração da viagem em dias
 * @returns Array de ranges de datas
 */
export function convertAvailabilityToMultipleDateRanges(
  availabilityMonths: readonly string[] | string[] | null | undefined,
  tripDuration: number = 7
): DateRange[] {
  if (!availabilityMonths || availabilityMonths.length === 0) {
    return [convertAvailabilityToDateRange(availabilityMonths, tripDuration)];
  }
  
  const now = getNowInSaoPaulo();
  const currentYear = now.getFullYear();
  const ranges: DateRange[] = [];
  
  const monthNumbers = availabilityMonths
    .map(monthNameToNumber)
    .filter((num): num is number => num !== null)
    .sort((a, b) => a - b);
  
  for (const monthNumber of monthNumbers) {
    const departureDate = calculateDepartureDate(monthNumber, currentYear);
    const returnDate = addDays(departureDate, tripDuration);
    
    ranges.push({
      departureDate: format(departureDate, 'yyyy-MM-dd'),
      returnDate: format(returnDate, 'yyyy-MM-dd')
    });
  }
  
  return ranges;
}

/**
 * Verifica se um mês está disponível para viagem
 * 
 * @param monthName - Nome do mês para verificar
 * @param availabilityMonths - Array de meses disponíveis
 * @returns true se o mês está disponível
 */
export function isMonthAvailable(
  monthName: string,
  availabilityMonths: readonly string[] | string[] | null | undefined
): boolean {
  if (!availabilityMonths || availabilityMonths.length === 0) {
    return false;
  }
  
  const normalizedTarget = normalizeMonth(monthName);
  
  return availabilityMonths.some(month => {
    const normalized = normalizeMonth(month);
    return normalized === normalizedTarget;
  });
}

/**
 * Obtém o próximo mês disponível a partir de hoje
 * 
 * @param availabilityMonths - Array de meses disponíveis
 * @returns Nome do próximo mês disponível ou null
 */
export function getNextAvailableMonth(
  availabilityMonths: readonly string[] | string[] | null | undefined
): string | null {
  if (!availabilityMonths || availabilityMonths.length === 0) {
    return null;
  }
  
  const now = getNowInSaoPaulo();
  const currentMonth = now.getMonth() + 1;
  
  const monthNumbers = availabilityMonths
    .map(monthNameToNumber)
    .filter((num): num is number => num !== null)
    .sort((a, b) => a - b);
  
  // Procura o primeiro mês > mês atual (próximo mês, não o atual)
  const nextMonth = monthNumbers.find(month => month > currentMonth);
  
  if (nextMonth) {
    // Retorna o nome original do mês
    const index = availabilityMonths.findIndex(
      month => monthNameToNumber(month) === nextMonth
    );
    return availabilityMonths[index];
  }
  
  // Se não encontrou, retorna o primeiro mês (será do próximo ano)
  return availabilityMonths[0];
}
