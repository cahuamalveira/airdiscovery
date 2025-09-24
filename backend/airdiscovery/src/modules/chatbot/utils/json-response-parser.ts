import { 
  ChatbotJsonResponse, 
  ValidationResult, 
  CollectedData, 
  ConversationStage 
} from '../interfaces/json-response.interface';

/**
 * Parser e validador para respostas JSON do LLM
 * Inclui múltiplas estratégias de parsing e validação robusta
 */
export class JsonResponseParser {
  
  /**
   * Tenta parsear resposta JSON com múltiplas estratégias
   */
  public static parseResponse(rawResponse: string): ValidationResult {
    console.log('🔍 JsonResponseParser: Iniciando parse da resposta:', rawResponse.substring(0, 200) + '...');
    
    const strategies = [
      { name: 'directParse', fn: this.directParse },
      { name: 'cleanAndParse', fn: this.cleanAndParse },
      { name: 'extractJsonFromText', fn: this.extractJsonFromText },
      { name: 'fixCommonIssuesAndParse', fn: this.fixCommonIssuesAndParse },
      { name: 'emergencyParse', fn: this.emergencyParse }
    ];

    const errors: string[] = [];

    for (const strategy of strategies) {
      try {
        console.log(`🧪 Tentando estratégia: ${strategy.name}`);
        const result = strategy.fn.call(this, rawResponse);
        
        if (result.isValid && result.parsedData) {
          console.log(`✅ Estratégia ${strategy.name} funcionou!`);
          return result;
        } else {
          console.log(`❌ Estratégia ${strategy.name} falhou:`, result.error);
          errors.push(`${strategy.name}: ${result.error}`);
        }
      } catch (error) {
        console.log(`💥 Estratégia ${strategy.name} teve exceção:`, error.message);
        errors.push(`${strategy.name}: ${error.message}`);
        continue;
      }
    }

    console.error('🚨 Todas as estratégias falharam:', errors);
    return {
      isValid: false,
      error: `Todas as estratégias de parsing falharam. Erros: ${errors.join('; ')}`
    };
  }

  /**
   * Estratégia 1: Parse direto
   */
  private static directParse(rawResponse: string): ValidationResult {
    try {
      const parsed = JSON.parse(rawResponse);
      return this.validateParsedData(parsed);
    } catch (error) {
      return {
        isValid: false,
        error: `Parse direto falhou: ${error.message}`
      };
    }
  }

  /**
   * Estratégia 2: Limpeza básica e parse
   */
  private static cleanAndParse(rawResponse: string): ValidationResult {
    try {
      const cleaned = rawResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^\s*[\r\n]+/gm, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      return this.validateParsedData(parsed);
    } catch (error) {
      return {
        isValid: false,
        error: `Limpeza e parse falhou: ${error.message}`
      };
    }
  }

  /**
   * Estratégia 3: Extração de JSON do texto
   */
  private static extractJsonFromText(rawResponse: string): ValidationResult {
    try {
      // Procura por padrões de JSON no texto - versão melhorada
      const jsonPatterns = [
        /\{[\s\S]*?\}/g, // Qualquer objeto JSON
        /\{.*?"conversation_stage"[\s\S]*?\}/g, // JSON com conversation_stage
        /\{.*?"assistant_message"[\s\S]*?\}/g, // JSON com assistant_message
        /```json\s*(\{[\s\S]*?\})\s*```/g, // JSON em blocos de código
        /```\s*(\{[\s\S]*?\})\s*```/g // JSON em blocos genéricos
      ];

      for (const pattern of jsonPatterns) {
        const matches = Array.from(rawResponse.matchAll(pattern));
        
        for (const match of matches) {
          const jsonString = match[1] || match[0]; // match[1] para grupos capturados, match[0] para tudo
          
          try {
            const parsed = JSON.parse(jsonString);
            const validation = this.validateParsedData(parsed);
            if (validation.isValid) {
              console.log('✅ JSON extraído com sucesso:', jsonString.substring(0, 100));
              return validation;
            }
          } catch (e) {
            // Continua para próximo match
            continue;
          }
        }
      }

      return {
        isValid: false,
        error: 'Nenhum JSON válido encontrado no texto'
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Extração de JSON falhou: ${error.message}`
      };
    }
  }

  /**
   * Estratégia 4: Correção de problemas comuns
   */
  private static fixCommonIssuesAndParse(rawResponse: string): ValidationResult {
    try {
      let fixed = rawResponse;

      // Remove quebras de linha desnecessárias
      fixed = fixed.replace(/\n\s*\n/g, '\n');
      
      // Corrige aspas simples para duplas
      fixed = fixed.replace(/'/g, '"');
      
      // Remove vírgulas antes de fechamento
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
      
      // Adiciona aspas em campos sem aspas
      fixed = fixed.replace(/(\w+):/g, '"$1":');
      
      // Remove caracteres de controle
      fixed = fixed.replace(/[\x00-\x1F\x7F]/g, '');

      const parsed = JSON.parse(fixed);
      return this.validateParsedData(parsed);
    } catch (error) {
      return {
        isValid: false,
        error: `Correção e parse falhou: ${error.message}`
      };
    }
  }

  /**
   * Estratégia 5: Parse de emergência - cria resposta mínima válida
   */
  private static emergencyParse(rawResponse: string): ValidationResult {
    try {
      console.log('🆘 Usando parse de emergência para:', rawResponse.substring(0, 100));
      
      // Tenta extrair pelo menos a mensagem do assistente
      let assistantMessage = 'Desculpe, houve um problema na comunicação. Por favor, reformule sua pergunta.';
      
      // Procura por texto que parece ser uma resposta
      const messagePatterns = [
        /assistant_message["']?\s*:\s*["']([^"']+)["']/i,
        /["']([^"']{20,}?)["']/,
        /([A-Z][^.!?]*[.!?])/
      ];
      
      for (const pattern of messagePatterns) {
        const match = rawResponse.match(pattern);
        if (match && match[1] && match[1].length > 10) {
          assistantMessage = match[1];
          break;
        }
      }
      
      // Cria resposta de emergência estruturada
      const emergencyResponse: ChatbotJsonResponse = {
        conversation_stage: 'collecting_origin',
        data_collected: {
          origin_name: null,
          origin_iata: null,
          destination_name: null,
          destination_iata: null,
          activities: null,
          budget_in_brl: null,
          purpose: null,
          hobbies: null
        },
        next_question_key: 'origin',
        assistant_message: assistantMessage,
        is_final_recommendation: false
      };
      
      return {
        isValid: true,
        parsedData: emergencyResponse
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: `Parse de emergência falhou: ${error.message}`
      };
    }
  }

  /**
   * Valida dados parseados
   */
  private static validateParsedData(data: any): ValidationResult {
    try {
      // Verifica se é um objeto
      if (typeof data !== 'object' || data === null) {
        return {
          isValid: false,
          error: 'Resposta deve ser um objeto JSON'
        };
      }

      // Verifica campos obrigatórios
      const requiredFields = [
        'conversation_stage',
        'data_collected',
        'assistant_message',
        'is_final_recommendation'
      ];

      // Valida campos obrigatórios e adiciona defaults se necessário
      for (const field of requiredFields) {
        if (!(field in data)) {
          // Tenta adicionar defaults para campos faltantes
          switch (field) {
            case 'next_question_key':
              data.next_question_key = null;
              break;
            case 'is_final_recommendation':
              data.is_final_recommendation = false;
              break;
            case 'data_collected':
              data.data_collected = {
                origin_name: null,
                origin_iata: null,
                destination_name: null,
                destination_iata: null,
                activities: null,
                budget_in_brl: null,
                purpose: null,
                hobbies: null
              };
              break;
            default:
              return {
                isValid: false,
                error: `Campo obrigatório faltando: ${field}`
              };
          }
        }
      }

      // Valida tipos específicos
      if (typeof data.conversation_stage !== 'string') {
        return {
          isValid: false,
          error: 'conversation_stage deve ser string'
        };
      }

      if (typeof data.assistant_message !== 'string') {
        return {
          isValid: false,
          error: 'assistant_message deve ser string'
        };
      }

      if (typeof data.is_final_recommendation !== 'boolean') {
        return {
          isValid: false,
          error: 'is_final_recommendation deve ser boolean'
        };
      }

      // Valida data_collected
      const dataValidation = this.validateCollectedData(data.data_collected);
      if (!dataValidation.isValid) {
        return dataValidation;
      }

      // Valida conversation_stage
      const stageValidation = this.validateConversationStage(data.conversation_stage);
      if (!stageValidation.isValid) {
        return stageValidation;
      }

      return {
        isValid: true,
        parsedData: data as ChatbotJsonResponse
      };

    } catch (error) {
      return {
        isValid: false,
        error: `Validação falhou: ${error.message}`
      };
    }
  }

  /**
   * Valida estrutura de data_collected
   */
  private static validateCollectedData(data: any): ValidationResult {
    if (typeof data !== 'object' || data === null) {
      return {
        isValid: false,
        error: 'data_collected deve ser um objeto'
      };
    }

    const requiredFields = [
      'origin_name',
      'origin_iata', 
      'destination_name',
      'destination_iata',
      'activities',
      'budget_in_brl',
      'purpose',
      'hobbies'
    ];

    for (const field of requiredFields) {
      if (!(field in data)) {
        return {
          isValid: false,
          error: `Campo faltando em data_collected: ${field}`
        };
      }
    }

    // Valida tipos específicos
    if (data.budget_in_brl !== null && typeof data.budget_in_brl !== 'number') {
      return {
        isValid: false,
        error: 'budget_in_brl deve ser number ou null'
      };
    }

    if (data.activities !== null && !Array.isArray(data.activities)) {
      return {
        isValid: false,
        error: 'activities deve ser array ou null'
      };
    }

    if (data.hobbies !== null && !Array.isArray(data.hobbies)) {
      return {
        isValid: false,
        error: 'hobbies deve ser array ou null'
      };
    }

    return { isValid: true };
  }

  /**
   * Valida conversation_stage
   */
  private static validateConversationStage(stage: string): ValidationResult {
    const validStages: ConversationStage[] = [
      'collecting_origin',
      'collecting_budget', 
      'collecting_activities',
      'collecting_purpose',
      'collecting_hobbies',
      'recommendation_ready',
      'error'
    ];

    if (!validStages.includes(stage as ConversationStage)) {
      return {
        isValid: false,
        error: `conversation_stage inválido: ${stage}`
      };
    }

    return { isValid: true };
  }

  /**
   * Gera resposta de fallback estruturada
   */
  public static generateFallback(
    currentStage: ConversationStage,
    collectedData: CollectedData,
    errorMessage: string
  ): ChatbotJsonResponse {
    return {
      conversation_stage: currentStage,
      data_collected: collectedData,
      next_question_key: this.determineNextQuestion(collectedData),
      assistant_message: `Desculpe, houve um problema. Pode repetir sua resposta? (Erro: ${errorMessage})`,
      is_final_recommendation: false
    };
  }

  /**
   * Determina próxima pergunta necessária
   */
  private static determineNextQuestion(data: CollectedData): 'origin' | 'budget' | 'activities' | 'purpose' | 'hobbies' | null {
    if (!data.origin_name || !data.origin_iata) return 'origin';
    if (!data.budget_in_brl) return 'budget';
    if (!data.activities && !data.purpose) return 'activities';
    return null;
  }

  /**
   * Sanitiza resposta removendo caracteres problemáticos
   */
  public static sanitizeResponse(response: string): string {
    return response
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove caracteres de controle
      .replace(/\u0000/g, '') // Remove null bytes
      .replace(/\r\n/g, '\n') // Normaliza quebras de linha
      .replace(/\r/g, '\n')
      .replace(/^\s*```json\s*/gmi, '') // Remove marcadores de código JSON
      .replace(/^\s*```\s*/gmi, '') // Remove marcadores de código genéricos
      .replace(/```\s*$/gmi, '') // Remove fechamentos de código
      .replace(/^\s*Here's?\s+the\s+JSON\s*:?\s*/gmi, '') // Remove prefixos explicativos
      .replace(/^\s*JSON\s*:?\s*/gmi, '') // Remove prefixos "JSON:"
      .trim();
  }

  /**
   * Verifica se a resposta está completa para recomendação
   */
  public static isReadyForRecommendation(data: CollectedData): boolean {
    return !!(
      data.origin_name && 
      data.origin_iata && 
      data.budget_in_brl && 
      (data.activities?.length || data.purpose)
    );
  }

  /**
   * Extrai estatísticas de preenchimento do perfil
   */
  public static getCompletionStats(data: CollectedData): {
    completed: number;
    total: number;
    percentage: number;
    missingFields: string[];
  } {
    const fields = [
      'origin_name',
      'origin_iata', 
      'budget_in_brl',
      'activities',
      'purpose',
      'hobbies'
    ];

    const completed = fields.filter(field => {
      const value = data[field as keyof CollectedData];
      return value !== null && value !== undefined && 
             (Array.isArray(value) ? value.length > 0 : true);
    });

    const missingFields = fields.filter(field => {
      const value = data[field as keyof CollectedData];
      return value === null || value === undefined || 
             (Array.isArray(value) && value.length === 0);
    });

    return {
      completed: completed.length,
      total: fields.length,
      percentage: Math.round((completed.length / fields.length) * 100),
      missingFields
    };
  }
}