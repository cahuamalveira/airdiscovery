import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
  ConverseStreamCommandInput,
  ConversationRole
} from '@aws-sdk/client-bedrock-runtime';
import { fromEnv } from '@aws-sdk/credential-providers';
import { randomUUID } from 'crypto';

import {
  ChatbotJsonResponse,
  JsonChatSession,
  JsonChatMessage,
  JsonStreamChunk,
  ConversationStage,
  CollectedData,
  ValidationResult,
  NextQuestionKey
} from './interfaces/json-response.interface';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatSessionRepository } from './repositories/chat-session.repository';
import { ChatSession, UserProfile, ChatMessage } from './interfaces/chat.interface';
import { JsonPromptBuilder } from './utils/json-prompt-builder';
import { JsonResponseParser } from './utils/json-response-parser';
import { convertAvailabilityToDateRange } from './utils/date-converter.util';
import { PassengerValidationUtil } from './utils/passenger-validation.util';
import { ERROR_MESSAGES } from './constants/error-messages.constant';
import { LoggerService } from '../logger/logger.service';

/**
 * Nova implementação do ChatbotService focada em respostas JSON estruturadas
 * Esta versão elimina a necessidade de parsing manual de strings
 */
@Injectable()
export class ChatbotService {
  private readonly logger: LoggerService;
  private readonly bedrockClient: BedrockRuntimeClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly chatSessionRepository: ChatSessionRepository,
    private readonly jsonResponseParser: JsonResponseParser,
    private readonly loggerService: LoggerService,
  ) {
    this.logger = loggerService.child({ module: 'ChatbotService' });
    this.bedrockClient = new BedrockRuntimeClient({
      region: this.configService.get<string>('AWS_REGION', 'us-east-2'),
      credentials: fromEnv(),
    });
  }

  /**
   * Converte JsonChatSession para ChatSession (para salvar no DynamoDB)
   */
  private mapToLegacySession(jsonSession: JsonChatSession): ChatSession {
    const profileData: UserProfile = {
      origin: jsonSession.collectedData.origin_name || '',
      activities: Array.from(jsonSession.collectedData.activities || []),
      budget: jsonSession.collectedData.budget_in_brl || 0,
      availability_months: Array.from(jsonSession.collectedData.availability_months || []),
      purpose: jsonSession.collectedData.purpose || '',
      hobbies: Array.from(jsonSession.collectedData.hobbies || [])
    };

    const messages: ChatMessage[] = jsonSession.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    }));

    // Store passenger composition in a custom field for backward compatibility
    const session: any = {
      sessionId: jsonSession.sessionId,
      userId: jsonSession.userId,
      messages,
      profileData,
      currentQuestionIndex: this.getQuestionIndexFromStage(jsonSession.currentStage),
      interviewComplete: jsonSession.isComplete,
      readyForRecommendation: jsonSession.hasRecommendation,
      createdAt: jsonSession.createdAt,
      updatedAt: jsonSession.updatedAt,
      completedAt: jsonSession.completedAt?.toISOString(),
      questionsAsked: jsonSession.messages.filter(m => m.role === 'assistant').length,
      totalQuestionsAvailable: 6, // Updated to 6 to include passengers
      interviewEfficiency: jsonSession.isComplete ? 1.0 : 0.5
    };

    // Store passenger composition as a custom field
    if (jsonSession.collectedData.passenger_composition) {
      session.passengerComposition = jsonSession.collectedData.passenger_composition;
    }

    return session;
  }

  /**
   * Converte ChatSession para JsonChatSession (para retornar da consulta)
   */
  private mapFromLegacySession(chatSession: ChatSession): JsonChatSession {
    // Restore passenger composition from custom field if it exists
    const sessionAny = chatSession as any;
    const passengerComposition = sessionAny.passengerComposition || null;

    const collectedData: CollectedData = {
      origin_name: chatSession.profileData?.origin || null,
      origin_iata: null, // Precisará ser extraído ou inferido
      destination_name: null,
      destination_iata: null,
      activities: chatSession.profileData?.activities || null,
      budget_in_brl: chatSession.profileData?.budget || null,
      passenger_composition: passengerComposition, // Restore from custom field
      availability_months: chatSession.profileData?.availability_months || null,
      purpose: chatSession.profileData?.purpose || null,
      hobbies: chatSession.profileData?.hobbies || null
    };

    const messages: JsonChatMessage[] = chatSession.messages.map(msg => ({
      id: randomUUID(),
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: msg.timestamp
    }));

    return {
      sessionId: chatSession.sessionId,
      userId: chatSession.userId,
      messages,
      currentStage: this.getStageFromQuestionIndex(chatSession.currentQuestionIndex),
      collectedData,
      isComplete: chatSession.interviewComplete || false,
      hasRecommendation: chatSession.readyForRecommendation || false,
      createdAt: chatSession.createdAt,
      updatedAt: chatSession.updatedAt,
      completedAt: chatSession.completedAt ? new Date(chatSession.completedAt) : undefined
    };
  }

  /**
   * Mapeia estágio JSON para índice de pergunta legacy
   */
  private getQuestionIndexFromStage(stage: ConversationStage): number {
    const stageToIndex = {
      'collecting_origin': 0,
      'collecting_budget': 1,
      'collecting_passengers': 2,
      'collecting_availability': 3,
      'collecting_activities': 4,
      'collecting_purpose': 5,
      'collecting_hobbies': 6,
      'recommendation_ready': 7,
      'error': 0
    };
    return stageToIndex[stage] || 0;
  }

  /**
   * Mapeia índice de pergunta legacy para estágio JSON
   */
  private getStageFromQuestionIndex(index: number): ConversationStage {
    const indexToStage: ConversationStage[] = [
      'collecting_origin',
      'collecting_budget',
      'collecting_passengers',
      'collecting_availability',
      'collecting_activities',
      'collecting_purpose',
      'collecting_hobbies',
      'recommendation_ready'
    ];
    return indexToStage[index] || 'collecting_origin';
  }

  /**
   * Inicia uma nova sessão de chat com estrutura JSON ou recupera uma existente
   */
  async startChatSession(userId: string, sessionId?: string): Promise<string> {
    // Se um sessionId foi fornecido, tenta recuperar a sessão existente
    if (sessionId) {
      try {
        const existingSession = await this.chatSessionRepository.getSession(sessionId);
        if (existingSession && existingSession.userId === userId) {
          this.logger.log(`Sessão JSON existente recuperada: ${sessionId} para usuário ${userId}`);
          return sessionId;
        } else if (existingSession && existingSession.userId !== userId) {
          this.logger.warn(`Tentativa de acesso não autorizado à sessão ${sessionId} por usuário ${userId}`);
          // Gera novo sessionId para o usuário
          sessionId = undefined;
        } else {
          this.logger.warn(`Sessão ${sessionId} não encontrada, criando nova sessão`);
        }
      } catch (error) {
        this.logger.warn(`Erro ao recuperar sessão ${sessionId}, criando nova: ${error.message}`);
      }
    }

    // Cria nova sessão se não foi fornecido sessionId ou se não foi encontrada
    const id = sessionId || randomUUID();

    const jsonSession: JsonChatSession = {
      sessionId: id,
      userId,
      messages: [],
      currentStage: 'collecting_origin',
      collectedData: {
        origin_name: null,
        origin_iata: null,
        destination_name: null,
        destination_iata: null,
        activities: null,
        budget_in_brl: null,
        passenger_composition: null,
        availability_months: null,
        purpose: null,
        hobbies: null
      },
      isComplete: false,
      hasRecommendation: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Converte para formato legacy e salva
    const legacySession = this.mapToLegacySession(jsonSession);
    await this.chatSessionRepository.saveSession(legacySession);
    
    this.logger.log(`Nova sessão JSON iniciada: ${id} para usuário ${userId}`);
    return id;
  }

  /**
   * Obtém mensagem inicial do chatbot (nova sessão ou continuação)
   */
  async getInitialMessage(sessionId: string): Promise<JsonStreamChunk> {
    const legacySession = await this.chatSessionRepository.getSession(sessionId);
    if (!legacySession) {
      throw new Error('Sessão não encontrada');
    }

    const session = this.mapFromLegacySession(legacySession);
    
    // Verifica se é uma sessão com mensagens existentes
    const hasExistingMessages = session.messages && session.messages.length > 0;
    const isCompleted = session.isComplete;

    let assistantMessage: string;
    let conversationStage: ConversationStage = session.currentStage;

    if (isCompleted && session.hasRecommendation) {
      assistantMessage = 'Bem-vindo de volta! Sua consulta anterior foi concluída e já temos uma recomendação para você. Inicie outra sessão para uma nova consulta.';
      conversationStage = 'recommendation_ready';
    } else if (hasExistingMessages) {
      assistantMessage = `Bem-vindo de volta! Vamos continuar de onde paramos. ${this.getStageMessage(conversationStage)}`;
    } else {
      assistantMessage = 'Olá! Sou seu assistente de viagem da AIR Discovery. Vou te ajudar a encontrar o destino perfeito! De qual cidade você vai partir?';
      conversationStage = 'collecting_origin';
    }

    const initialResponse: ChatbotJsonResponse = {
      conversation_stage: conversationStage,
      data_collected: session.collectedData,
      next_question_key: this.getQuestionKeyFromStage(conversationStage),
      assistant_message: assistantMessage,
      is_final_recommendation: isCompleted && session.hasRecommendation
    };

    return {
      sessionId,
      content: assistantMessage,
      jsonData: initialResponse,
      isComplete: true
    };
  }

  /**
   * Obtém mensagem contextual baseada no estágio da conversa
   */
  private getStageMessage(stage: ConversationStage): string {
    switch (stage) {
      case 'collecting_origin':
        return 'De qual cidade você vai partir?';
      case 'collecting_budget':
        return 'Qual é o seu orçamento aproximado para a viagem (em reais)?';
      case 'collecting_activities':
        return 'Que tipo de atividades você gostaria de fazer no destino?';
      case 'collecting_purpose':
        return 'Qual é o propósito principal desta viagem?';
      case 'collecting_hobbies':
        return 'Quais são seus hobbies e interesses?';
      case 'recommendation_ready':
        return 'Tenho algumas recomendações para você!';
      default:
        return 'Como posso ajudá-lo com sua viagem?';
    }
  }

  /**
   * Obtém a próxima chave de pergunta baseada no estágio (para sessões continuadas)
   */
  private getQuestionKeyFromStage(stage: ConversationStage): NextQuestionKey {
    switch (stage) {
      case 'collecting_origin':
        return 'origin';
      case 'collecting_budget':
        return 'budget';
      case 'collecting_activities':
        return 'activities';
      case 'collecting_purpose':
        return 'purpose';
      case 'collecting_hobbies':
        return 'hobbies';
      default:
        return null;
    }
  }

  /**
   * Processa mensagem do usuário e gera resposta estruturada
   * Agora sem streaming para evitar problemas de parsing JSON
   */
  async processMessage(
    sessionId: string,
    message: ChatMessageDto,
    onResponse: (response: JsonStreamChunk) => void
  ): Promise<void> {
    const legacySession = await this.chatSessionRepository.getSession(sessionId);
    if (!legacySession) {
      throw new Error('Sessão não encontrada');
    }

    const session = this.mapFromLegacySession(legacySession);

    // Adiciona mensagem do usuário
    const userMessage: JsonChatMessage = {
      id: randomUUID(),
      role: 'user',
      content: message.content,
      timestamp: new Date()
    };

    // Atualiza a sessão local com a nova mensagem (apenas em memória)
    const updatedJsonSession = {
      ...session,
      messages: [...session.messages, userMessage],
      updatedAt: new Date()
    };

    try {
      // Envia indicador de "processando" para mostrar loading
      onResponse({
        content: '',
        isComplete: false,
        sessionId,
        isProcessing: true
      });

      // Gera resposta via Bedrock (sem streaming)
      const completeResponse = await this.generateCompleteJsonResponse(updatedJsonSession);
      
      // Envia resposta completa de uma vez
      onResponse(completeResponse);
      
    } catch (error) {
      this.logger.error(`Erro ao processar mensagem: ${error.message}`);
      
      // Resposta de erro estruturada
      const errorResponse: ChatbotJsonResponse = {
        conversation_stage: 'error',
        data_collected: session.collectedData,
        next_question_key: null,
        assistant_message: 'Desculpe, ocorreu um erro. Vamos tentar novamente.',
        is_final_recommendation: false
      };

      onResponse({
        content: errorResponse.assistant_message,
        isComplete: true,
        sessionId,
        jsonData: errorResponse,
        metadata: { error: error.message }
      });
    }
  }

  /**
   * Gera resposta JSON completa via Bedrock (sem streaming)
   */
  private async generateCompleteJsonResponse(
    session: JsonChatSession
  ): Promise<JsonStreamChunk> {
    const input = this.buildBedrockInput(session);
    const command = new ConverseStreamCommand(input);

    try {
      const response = await this.bedrockClient.send(command);
      let completeContent = '';
      let stopReason = '';

      // Acumula todo o conteúdo sem enviar chunks
      for await (const chunk of response.stream!) {
        if (chunk.contentBlockDelta?.delta?.text) {
          completeContent += chunk.contentBlockDelta.delta.text;
        }
        
        // Captura o motivo de parada
        if (chunk.messageStop?.stopReason) {
          stopReason = chunk.messageStop.stopReason;
          this.logger.debug(`🛑 Stream finalizado com stopReason: ${stopReason}`);
        }
        
        // Log de metadata do chunk para debug
        if (chunk.metadata) {
          this.logger.debug('Chunk metadata received', {
            function: 'processMessage',
            sessionId: session.sessionId,
            metadata: chunk.metadata
          });
        }
      }

      this.logger.info('Complete response received', {
        function: 'processMessage',
        sessionId: session.sessionId,
        contentLength: completeContent.length,
        contentPreview: completeContent.slice(-200)
      });
      
      // Verifica se o stream foi interrompido prematuramente
      if (stopReason && stopReason !== 'end_turn' && stopReason !== 'stop_sequence') {
        this.logger.warn(`⚠️ Stream interrompido com stopReason: ${stopReason}`);
      }
      
      // Verifica se a resposta parece incompleta
      if (!completeContent.includes('}') || !completeContent.trim().endsWith('}')) {
        this.logger.error(`❌ Resposta parece incompleta! Último char: "${completeContent.slice(-1)}"`);
      }

      // Processa resposta completa de uma vez
      return await this.processCompleteResponse(session, completeContent);

    } catch (error) {
      this.logger.error(`Erro no Bedrock: ${error.message}`);
      throw error;
    }
  }

  /**
   * Processa resposta completa e valida JSON
   */
  private async processCompleteResponse(
    session: JsonChatSession,
    rawResponse: string
  ): Promise<JsonStreamChunk> {
    // Sanitiza resposta
    const sanitizedResponse = this.jsonResponseParser.sanitizeResponse(rawResponse);
    
    // Valida e parsea JSON
    const validation = this.jsonResponseParser.parseResponse(sanitizedResponse, session.sessionId);

    if (!validation.isValid || !validation.parsedData) {
      this.logger.error('Invalid JSON received from LLM', undefined, {
        function: 'processCompleteResponse',
        sessionId: session.sessionId,
        error: validation.error
      });
      
      // Resposta de fallback
      const fallbackResponse = this.jsonResponseParser.generateFallback(
        session.currentStage,
        session.collectedData,
        validation.error || 'Resposta inválida'
      );

      return {
        content: fallbackResponse.assistant_message,
        isComplete: true,
        sessionId: session.sessionId,
        jsonData: fallbackResponse,
        metadata: { error: validation.error }
      };
    }

    const jsonResponse = validation.parsedData;

    // Validate passenger composition if it was collected in this response
    if (jsonResponse.data_collected.passenger_composition) {
      const passengerValidation = PassengerValidationUtil.validatePassengerComposition(
        jsonResponse.data_collected.passenger_composition
      );

      if (!passengerValidation.isValid) {
        this.logger.warn(`Validação de passageiros falhou: ${passengerValidation.errors.join(', ')}`);
        
        // Return error response to allow user to correct
        const errorResponse: ChatbotJsonResponse = {
          conversation_stage: session.currentStage, // Stay in same stage
          data_collected: session.collectedData, // Don't save invalid data
          next_question_key: 'passengers',
          assistant_message: `Desculpe, há um problema com os dados dos passageiros:\n\n${passengerValidation.errors.join('\n')}\n\nPor favor, informe novamente a composição de passageiros.`,
          is_final_recommendation: false
        };

        return {
          content: errorResponse.assistant_message,
          isComplete: true,
          sessionId: session.sessionId,
          jsonData: errorResponse,
          metadata: { error: passengerValidation.errors.join('; ') }
        };
      }

      // Validate budget if both budget and passengers are available
      const budget = jsonResponse.data_collected.budget_in_brl || session.collectedData.budget_in_brl;
      if (budget) {
        const budgetValidation = PassengerValidationUtil.validateBudgetForPassengers(
          budget,
          jsonResponse.data_collected.passenger_composition
        );

        if (!budgetValidation.isValid) {
          this.logger.warn(`Validação de orçamento falhou: ${budgetValidation.errors.join(', ')}`);
          
          // Return error response
          const errorResponse: ChatbotJsonResponse = {
            conversation_stage: 'collecting_budget', // Go back to budget collection
            data_collected: session.collectedData, // Don't save invalid data
            next_question_key: 'budget',
            assistant_message: `${budgetValidation.errors.join('\n')}\n\nPor favor, informe um orçamento maior ou reduza o número de passageiros.`,
            is_final_recommendation: false
          };

          return {
            content: errorResponse.assistant_message,
            isComplete: true,
            sessionId: session.sessionId,
            jsonData: errorResponse,
            metadata: { error: budgetValidation.errors.join('; ') }
          };
        }
      }
    }
    
    // CORREÇÃO: Calcula o stage correto baseado nos dados coletados, ignorando o que a LLM retornou
    const correctStage = this.calculateCorrectStage(jsonResponse.data_collected, jsonResponse.is_final_recommendation);
    
    this.logger.log(`📊 Stage da LLM: ${jsonResponse.conversation_stage} → Stage correto: ${correctStage}`);

    // Log especial para recomendações finais
    if (jsonResponse.is_final_recommendation) {
      this.logger.log(`🎯 Recomendação final recebida: ${jsonResponse.data_collected.destination_name} (${jsonResponse.data_collected.destination_iata})`);
    }

    // � MERGE: Mescla dados antigos com novos (não sobrescreve com null)
    const mergedData: CollectedData = {
      origin_name: jsonResponse.data_collected.origin_name ?? session.collectedData.origin_name,
      origin_iata: jsonResponse.data_collected.origin_iata ?? session.collectedData.origin_iata,
      destination_name: jsonResponse.data_collected.destination_name ?? session.collectedData.destination_name,
      destination_iata: jsonResponse.data_collected.destination_iata ?? session.collectedData.destination_iata,
      activities: jsonResponse.data_collected.activities ?? session.collectedData.activities,
      budget_in_brl: jsonResponse.data_collected.budget_in_brl ?? session.collectedData.budget_in_brl,
      passenger_composition: jsonResponse.data_collected.passenger_composition ?? session.collectedData.passenger_composition,
      availability_months: jsonResponse.data_collected.availability_months ?? session.collectedData.availability_months,
      purpose: jsonResponse.data_collected.purpose ?? session.collectedData.purpose,
      hobbies: jsonResponse.data_collected.hobbies ?? session.collectedData.hobbies
    };

    // Atualiza sessão com novos dados (usando o stage CORRETO calculado)
    const updatedSession = await this.updateSession(session, {
      currentStage: correctStage, // USA O STAGE CORRETO, NÃO O DA LLM
      collectedData: mergedData, // USA DADOS MESCLADOS
      isComplete: jsonResponse.is_final_recommendation,
      hasRecommendation: jsonResponse.is_final_recommendation,
      updatedAt: new Date(),
      completedAt: jsonResponse.is_final_recommendation ? new Date() : undefined
    });

    // Adiciona mensagem do assistente
    const assistantMessage: JsonChatMessage = {
      id: randomUUID(),
      role: 'assistant',
      content: jsonResponse.assistant_message,
      timestamp: new Date(),
      jsonData: jsonResponse
    };

    await this.updateSession(updatedSession, {
      messages: [...updatedSession.messages, assistantMessage]
    });

    // Retorna resposta final
    return {
      content: jsonResponse.assistant_message,
      isComplete: true,
      sessionId: session.sessionId,
      jsonData: jsonResponse,
      metadata: {
        stage: jsonResponse.conversation_stage,
        collectedData: jsonResponse.data_collected
      }
    };
  }

  /**
   * Constrói input para Bedrock
   */
  private buildBedrockInput(session: JsonChatSession): ConverseStreamCommandInput {
    const messages = session.messages.map(msg => ({
      role: msg.role as ConversationRole,
      content: [{ text: msg.content }]
    }));

    // Usa o prompt builder para contexto
    const lastUserMessage = session.messages
      .filter(msg => msg.role === 'user')
      .slice(-1)[0]?.content || '';

    const contextPrompt = JsonPromptBuilder.buildContextualPrompt(
      session.currentStage,
      session.collectedData,
      lastUserMessage
    );

    this.logger.debug('Bedrock prompt prepared', {
      function: 'buildBedrockInput',
      sessionId: session.sessionId,
      userId: session.userId,
      currentStage: session.currentStage,
      promptPreview: contextPrompt.substring(0, 200)
    });

    return {
      modelId: 'us.meta.llama4-scout-17b-instruct-v1:0',
      messages,
      system: [{ text: contextPrompt }],
      inferenceConfig: {
        maxTokens: 4096, // Aumentado para garantir resposta completa
        temperature: 0.2,
        topP: 0.6
      }
    };
  }

  /**
   * Calcula o stage correto baseado nos dados coletados
   * Ignora o que a LLM retornou e usa lógica determinística
   */
  private calculateCorrectStage(data: CollectedData, isFinalRecommendation: boolean): ConversationStage {
    if (isFinalRecommendation) {
      return 'recommendation_ready';
    }
    
    // Verifica qual é o próximo dado que precisa ser coletado
    // Stage progression: origin → budget → passengers → availability → activities → purpose → hobbies
    if (!data.origin_name || !data.origin_iata) {
      return 'collecting_origin';
    }
    if (!data.budget_in_brl) {
      return 'collecting_budget';
    }
    // NEW: Check for passenger composition before proceeding to availability
    if (!data.passenger_composition || !data.passenger_composition.adults || data.passenger_composition.adults === 0) {
      return 'collecting_passengers';
    }
    if (!data.availability_months || data.availability_months.length === 0) {
      return 'collecting_availability';
    }
    if (!data.activities || data.activities.length === 0) {
      return 'collecting_activities';
    }
    if (!data.purpose) {
      return 'collecting_purpose';
    }
    
    // Se tem todos os dados, deveria estar pronto para recomendação
    return 'recommendation_ready';
  }

  /**
   * Determina próxima pergunta baseada nos dados coletados
   */
  private getNextQuestionKey(data: CollectedData): NextQuestionKey {
    if (!data.origin_name || !data.origin_iata) return 'origin';
    if (!data.budget_in_brl) return 'budget';
    if (!data.availability_months || data.availability_months.length === 0) return 'availability';
    if (!data.activities || data.activities.length === 0) return 'activities';
    if (!data.purpose) return 'purpose';
    return null;
  }

  /**
   * Atualiza sessão no DynamoDB
   */
  private async updateSession(session: JsonChatSession, updates: Partial<JsonChatSession>): Promise<JsonChatSession> {
    const updatedSession = { ...session, ...updates, updatedAt: new Date() };
    const legacySession = this.mapToLegacySession(updatedSession);
    await this.chatSessionRepository.saveSession(legacySession);
    return updatedSession;
  }

  /**
   * Obtém sessão por ID
   */
  async getChatSession(sessionId: string): Promise<JsonChatSession | undefined> {
    const legacySession = await this.chatSessionRepository.getSession(sessionId);
    return legacySession ? this.mapFromLegacySession(legacySession) : undefined;
  }

  /**
   * Finaliza sessão e retorna dados coletados
   */
  async endChatSession(sessionId: string): Promise<CollectedData | undefined> {
    const legacySession = await this.chatSessionRepository.getSession(sessionId);
    if (!legacySession) return undefined;

    await this.chatSessionRepository.deleteSession(sessionId);
    this.logger.log(`Sessão finalizada: ${sessionId}`);

    const jsonSession = this.mapFromLegacySession(legacySession);
    return jsonSession.collectedData;
  }

  /**
   * Obtém estatísticas das sessões
   */
  async getSessionStats(): Promise<{ active: number; completed: number }> {
    // Como não há método específico no ChatSessionRepository, simulamos
    // Em uma implementação real, seria necessário adicionar este método ao repositório
    return {
      active: 0,
      completed: 0
    };
  }

  /**
   * Obtém parâmetros de busca de voos prontos a partir dos dados coletados
   * Converte availability_months em departureDate e returnDate
   * 
   * NOTA: Todas as regras de negócio (duração, voos diretos, etc) estão no prompt da LLM.
   * Este método apenas converte os meses em datas e monta os parâmetros básicos.
   * 
   * @param sessionId - ID da sessão
   * @param tripDuration - Duração da viagem em dias (padrão: 7)
   * @returns Parâmetros prontos para busca de voos ou null se dados insuficientes
   */
  async getFlightSearchParamsFromSession(
    sessionId: string,
    tripDuration: number = 7
  ): Promise<{
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
    returnDate: string;
    adults: number;
    children?: number;
    infants?: number;
  } | null> {
    const session = await this.getChatSession(sessionId);
    if (!session || !session.collectedData) {
      return null;
    }

    const data = session.collectedData;

    // Valida se temos os dados mínimos
    if (!data.origin_iata || !data.destination_iata) {
      return null;
    }

    // Converte os meses em datas específicas
    const dateRange = convertAvailabilityToDateRange(
      data.availability_months,
      tripDuration
    );

    const composition = data.passenger_composition;

    const adults = composition?.adults || 1; // Default to 1 adult for backward compatibility
    const children = composition?.children || 0;

    // Validate flight search parameters before returning
    const validation = PassengerValidationUtil.validateFlightSearchParams(
      adults,
      children > 0 ? children : undefined,
      undefined // No infants - simplified
    );

    if (!validation.isValid) {
      this.logger.error(`Parâmetros de busca inválidos: ${validation.errors.join(', ')}`);
      throw new Error(`${ERROR_MESSAGES.AMADEUS_INVALID_PARAMS}: ${validation.errors.join(', ')}`);
    }

    const params: {
      originLocationCode: string;
      destinationLocationCode: string;
      departureDate: string;
      returnDate: string;
      adults: number;
      children?: number;
    } = {
      originLocationCode: data.origin_iata,
      destinationLocationCode: data.destination_iata,
      departureDate: dateRange.departureDate,
      returnDate: dateRange.returnDate,
      adults
    };

    // Only add children field if count > 0
    if (children > 0) {
      params.children = children;
    }

    return params;
  }
}