import { Injectable } from '@nestjs/common';
import { 
  ChatbotJsonResponse, 
  ValidationResult, 
  CollectedData, 
  ConversationStage 
} from '../interfaces/json-response.interface';
import { LoggerService } from '../../logger/logger.service';

/**
 * Parser e validador para respostas JSON do LLM
 * Inclui múltiplas estratégias de parsing e validação robusta
 */
@Injectable()
export class JsonResponseParser {
  private readonly logger: LoggerService;

  constructor(private readonly loggerService: LoggerService) {
    this.logger = loggerService.child({ module: 'JsonResponseParser' });
  }
  
  /**
   * Tenta parsear resposta JSON com múltiplas estratégias
   */
  public parseResponse(rawResponse: string, sessionId?: string): ValidationResult {
    this.logger.debug('Starting JSON response parsing', {
      function: 'parseResponse',
      sessionId,
      responsePreview: rawResponse.substring(0, 200)
    });
    
    // 🔧 SANITIZA a resposta ANTES de tentar parse
    const sanitized = this.sanitizeResponse(rawResponse);
    this.logger.debug('Response sanitized', {
      function: 'parseResponse',
      sessionId,
      sanitizedPreview: sanitized.substring(0, 200)
    });
    
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
        this.logger.debug(`Trying parsing strategy: ${strategy.name}`, {
          function: 'parseResponse',
          sessionId,
          strategy: strategy.name
        });
        const result = strategy.fn.call(this, sanitized); // 🔧 USA sanitized ao invés de rawResponse
        
        if (result.isValid && result.parsedData) {
          this.logger.debug(`Parsing strategy succeeded: ${strategy.name}`, {
            function: 'parseResponse',
            sessionId,
            strategy: strategy.name
          });
          return result;
        } else {
          this.logger.debug(`Parsing strategy failed: ${strategy.name}`, {
            function: 'parseResponse',
            sessionId,
            strategy: strategy.name,
            error: result.error
          });
          errors.push(`${strategy.name}: ${result.error}`);
        }
      } catch (error) {
        this.logger.debug(`Parsing strategy threw exception: ${strategy.name}`, {
          function: 'parseResponse',
          sessionId,
          strategy: strategy.name,
          error: error.message
        });
        errors.push(`${strategy.name}: ${error.message}`);
        continue;
      }
    }

    this.logger.error('All parsing strategies failed', undefined, {
      function: 'parseResponse',
      sessionId,
      errors
    });
    return {
      isValid: false,
      error: `Todas as estratégias de parsing falharam. Erros: ${errors.join('; ')}`
    };
  }

  /**
   * Estratégia 1: Parse direto
   */
  private directParse(rawResponse: string): ValidationResult {
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
  private cleanAndParse(rawResponse: string): ValidationResult {
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
  private extractJsonFromText(rawResponse: string): ValidationResult {
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
              this.logger.debug('JSON extracted successfully from text', {
                function: 'extractJsonFromText',
                jsonPreview: jsonString.substring(0, 100)
              });
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
  private fixCommonIssuesAndParse(rawResponse: string): ValidationResult {
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
  private emergencyParse(rawResponse: string): ValidationResult {
    try {
      this.logger.warn('Using emergency parse fallback', {
        function: 'emergencyParse',
        responsePreview: rawResponse.substring(0, 100)
      });
      
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
          availability_months: null,
          purpose: null,
          hobbies: null,
          passenger_composition: null
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
   * Sanitiza o campo assistant_message removendo qualquer JSON ou fragmentos de código
   * que possam ter vazado da resposta da LLM
   */
  private sanitizeAssistantMessage(message: string): string {
    if (!message || typeof message !== 'string') {
      return message;
    }

    let sanitized = message;

    // Primeiro, converte caracteres de escape unicode literais (ex: \u00e7 para ç)
    // Isso deve ser feito primeiro para que os outros padrões funcionem corretamente
    sanitized = sanitized.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    // Tenta extrair uma pergunta válida do texto corrompido
    // Procura por padrões de perguntas em português que terminam com ?
    const questionMatch = sanitized.match(/([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇE][^?]*\?)/i);
    if (questionMatch && questionMatch[1] && questionMatch[1].length > 10) {
      // Encontrou uma pergunta válida, usa ela
      let extractedQuestion = questionMatch[1].trim();
      // Remove fragmentos JSON do início da pergunta extraída
      extractedQuestion = extractedQuestion.replace(/^[\s\}\]\[{,]+/g, '').trim();
      // Verifica se a pergunta extraída não contém JSON
      if (!extractedQuestion.includes('"label"') && !extractedQuestion.includes('"value"') && extractedQuestion.length > 10) {
        this.logger.debug('Extracted question from corrupted message', {
          function: 'sanitizeAssistantMessage',
          originalMessage: message.substring(0, 100),
          extractedQuestion
        });
        return extractedQuestion;
      }
    }

    // Remove fragmentos de JSON que podem ter vazado (button_options, etc)
    // Padrão: [{"label":"...", "value":"..."}] ou variações - versão mais agressiva
    sanitized = sanitized.replace(/\[\s*\{[^}]*["']?label["']?\s*:\s*["'][^"']*["'][^}]*["']?value["']?\s*:\s*["'][^"']*["'][^}]*\}[^\]]*\]/gi, '');
    
    // Remove padrões como {"label":"...", "value":"..."} soltos (com ou sem aspas)
    sanitized = sanitized.replace(/\{[^}]*["']?label["']?\s*:\s*["'][^"']*["'][^}]*["']?value["']?\s*:\s*["'][^"']*["'][^}]*\}/gi, '');
    
    // Remove fragmentos parciais de JSON no início
    // Ex: }] ou }, no início da mensagem
    sanitized = sanitized.replace(/^[\s\}\],]+/g, '');
    
    // Remove fragmentos parciais de JSON no fim
    // Ex: [{ ou , no fim da mensagem
    sanitized = sanitized.replace(/[\s\[\{,]+$/g, '');
    
    // Remove padrões específicos que aparecem no erro reportado
    // Ex: "Nenhuma","value":"0"},{"label":"1 criança"...
    sanitized = sanitized.replace(/["'][^"']*["']\s*,\s*["']?value["']?\s*:\s*["'][^"']*["']\s*\}/gi, '');
    sanitized = sanitized.replace(/\{\s*["']?label["']?\s*:\s*["'][^"']*["']/gi, '');
    
    // Remove vírgulas órfãs que podem sobrar
    sanitized = sanitized.replace(/,\s*,/g, ',');
    sanitized = sanitized.replace(/^\s*,\s*/g, '');
    sanitized = sanitized.replace(/\s*,\s*$/g, '');
    
    // Remove colchetes e chaves órfãos
    sanitized = sanitized.replace(/^\s*[\[\]{}]\s*/g, '');
    sanitized = sanitized.replace(/\s*[\[\]{}]\s*$/g, '');
    
    // Remove múltiplos espaços
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    // Se a mensagem ficou vazia ou muito curta após sanitização, retorna fallback
    if (!sanitized || sanitized.length < 5) {
      this.logger.warn('Assistant message was empty after sanitization, using fallback', {
        function: 'sanitizeAssistantMessage',
        originalMessage: message.substring(0, 100)
      });
      return 'Como posso ajudá-lo?';
    }

    // Log se houve mudança significativa
    if (sanitized !== message) {
      this.logger.debug('Assistant message was sanitized', {
        function: 'sanitizeAssistantMessage',
        originalLength: message.length,
        sanitizedLength: sanitized.length,
        originalPreview: message.substring(0, 100),
        sanitizedPreview: sanitized.substring(0, 100)
      });
    }

    return sanitized;
  }

  /**
   * Valida dados parseados
   */
  private validateParsedData(data: any): ValidationResult {
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
                availability_months: null,
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

      // CRÍTICO: Se é recomendação final, destino DEVE estar preenchido
      if (data.is_final_recommendation) {
        if (!data.data_collected.destination_name || !data.data_collected.destination_iata) {
          return {
            isValid: false,
            error: 'Recomendação final requer destination_name e destination_iata preenchidos'
          };
        }
      }

      // Valida conversation_stage
      const stageValidation = this.validateConversationStage(data.conversation_stage);
      if (!stageValidation.isValid) {
        return stageValidation;
      }

      // Ignore button_options from LLM - they are now generated statically by ButtonOptionsGenerator
      // Keep backward compatibility by not failing if button_options is present
      if (data.button_options) {
        this.logger.debug('Ignoring button_options from LLM response (now generated statically)', {
          function: 'validateParsedData'
        });
        delete data.button_options;
      }

      // SANITIZAÇÃO: Remove qualquer JSON que tenha vazado para o assistant_message
      // Isso é uma proteção contra LLMs que misturam texto com estruturas JSON
      data.assistant_message = this.sanitizeAssistantMessage(data.assistant_message);

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
  private validateCollectedData(data: any): ValidationResult {
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
      'availability_months',
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

    if (data.availability_months !== null && !Array.isArray(data.availability_months)) {
      return {
        isValid: false,
        error: 'availability_months deve ser array ou null'
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
  private validateConversationStage(stage: string): ValidationResult {
    const validStages: ConversationStage[] = [
      'collecting_origin',
      'collecting_budget',
      'collecting_passengers', // 🔧 ADICIONADO: para coleta de passageiros
      'collecting_availability',
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
  public generateFallback(
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
  private determineNextQuestion(data: CollectedData): 'origin' | 'budget' | 'availability' | 'activities' | 'purpose' | 'hobbies' | null {
    if (!data.origin_name || !data.origin_iata) return 'origin';
    if (!data.budget_in_brl) return 'budget';
    if (!data.availability_months || data.availability_months.length === 0) return 'availability';
    if (!data.activities || data.activities.length === 0) return 'activities';
    if (!data.purpose) return 'purpose';
    return null;
  }

  /**
   * Sanitiza resposta removendo caracteres problemáticos
   */
  public sanitizeResponse(response: string): string {
    let sanitized = response
      .replace(/\u0000/g, '') // Remove null bytes
      .replace(/^\s*```json\s*/gmi, '') // Remove marcadores de código JSON
      .replace(/^\s*```\s*/gmi, '') // Remove marcadores de código genéricos
      .replace(/```\s*$/gmi, '') // Remove fechamentos de código
      .replace(/^\s*Here's?\s+the\s+JSON\s*:?\s*/gmi, '') // Remove prefixos explicativos
      .replace(/^\s*JSON\s*:?\s*/gmi, ''); // Remove prefixos "JSON:"
    
    // 🔧 CONVERTE quebras de linha LITERAIS (os caracteres \ e n juntos) em espaços
    // Isso acontece quando a LLM retorna JSON "formatado" como string
    sanitized = sanitized
      .replace(/\\n/g, ' ')    // \n literais → espaços
      .replace(/\\r/g, ' ')    // \r literais → espaços
      .replace(/\\t/g, ' ')    // \t literais → espaços
      .replace(/\s+/g, ' ');   // Múltiplos espaços → um espaço
    
    // Remove quebras de linha REAIS (caracteres de controle)
    sanitized = sanitized
      .replace(/[\r\n]+/g, ' ') // Quebras reais → espaços
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove outros caracteres de controle
    
    return sanitized.trim();
  }

  /**
   * Verifica se a resposta está completa para recomendação
   */
  public isReadyForRecommendation(data: CollectedData): boolean {
    return !!(
      data.origin_name && 
      data.origin_iata && 
      data.budget_in_brl && 
      data.availability_months?.length &&
      data.activities?.length &&
      data.purpose
    );
  }

  /**
   * Extrai estatísticas de preenchimento do perfil
   */
  public getCompletionStats(data: CollectedData): {
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