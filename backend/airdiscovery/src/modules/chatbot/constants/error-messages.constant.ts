/**
 * Mensagens de erro padronizadas em português para validação de passageiros
 * Usadas em toda a aplicação para garantir consistência nas mensagens ao usuário
 */
export const ERROR_MESSAGES = {
  // Validação de adultos
  NO_ADULTS: 'É necessário pelo menos um adulto na viagem',
  
  // Validação de crianças
  INVALID_CHILD_AGE: 'Idade da criança deve estar entre 0 e 17 anos',
  INVALID_CHILD_AGE_NEGATIVE: 'Idade da criança não pode ser negativa',
  INVALID_CHILD_AGE_TOO_HIGH: 'Idade da criança deve ser menor que 18 anos',
  
  // Validação de bebês
  TOO_MANY_INFANTS: 'Número de bebês não pode exceder o número de adultos',
  INFANTS_EXCEED_ADULTS: 'Cada bebê precisa estar acompanhado de um adulto. Número de bebês não pode ser maior que o número de adultos',
  
  // Validação de orçamento
  INSUFFICIENT_BUDGET: 'Orçamento insuficiente para o número de passageiros',
  INSUFFICIENT_BUDGET_DETAILED: (perPerson: number, minimum: number) => 
    `Orçamento insuficiente. Mínimo de R$ ${minimum.toFixed(2)} por passageiro pagante. Você tem R$ ${perPerson.toFixed(2)} por pessoa.`,
  
  // Validação de dados de passageiros
  INVALID_PASSENGER_DATA: 'Dados do passageiro incompletos ou inválidos',
  MISSING_PASSENGER_COMPOSITION: 'Composição de passageiros não informada',
  INVALID_PASSENGER_COMPOSITION: 'Composição de passageiros inválida',
  
  // Validação de contagem de passageiros
  INVALID_PASSENGER_COUNT: 'Número de passageiros inválido',
  ZERO_PASSENGERS: 'É necessário pelo menos um passageiro',
  TOO_MANY_PASSENGERS: 'Número máximo de passageiros excedido (máximo: 9)',
  
  // Erros da API Amadeus
  AMADEUS_VALIDATION_ERROR: 'Erro ao validar parâmetros de busca de voos',
  AMADEUS_SEARCH_ERROR: 'Erro ao buscar voos. Por favor, tente novamente.',
  AMADEUS_INVALID_PARAMS: 'Parâmetros de busca inválidos',
} as const;

/**
 * Tipo para garantir type-safety ao usar as mensagens de erro
 */
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
