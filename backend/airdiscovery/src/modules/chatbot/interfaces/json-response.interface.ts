/**
 * Interfaces para as respostas JSON estruturadas do chatbot
 */

export type ConversationStage = 
  | 'collecting_origin' 
  | 'collecting_budget' 
  | 'collecting_activities' 
  | 'collecting_purpose' 
  | 'collecting_hobbies' 
  | 'recommendation_ready'
  | 'error';

export type NextQuestionKey = 
  | 'origin' 
  | 'budget' 
  | 'activities' 
  | 'purpose' 
  | 'hobbies' 
  | null;

export interface CollectedData {
  readonly origin_name: string | null;
  readonly origin_iata: string | null;
  readonly destination_name: string | null;
  readonly destination_iata: string | null;
  readonly activities: readonly string[] | null;
  readonly budget_in_brl: number | null;
  readonly purpose: string | null;
  readonly hobbies: readonly string[] | null;
}

/**
 * Estrutura da resposta JSON esperada do LLM
 */
export interface ChatbotJsonResponse {
  readonly conversation_stage: ConversationStage;
  readonly data_collected: CollectedData;
  readonly next_question_key: NextQuestionKey;
  readonly assistant_message: string;
  readonly is_final_recommendation: boolean;
}

/**
 * Interface para validação da resposta do LLM
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
  readonly parsedData?: ChatbotJsonResponse;
}

/**
 * Interface para o estado da sessão com dados JSON
 */
export interface JsonChatSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly messages: readonly JsonChatMessage[];
  readonly currentStage: ConversationStage;
  readonly collectedData: CollectedData;
  readonly isComplete: boolean;
  readonly hasRecommendation: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly completedAt?: Date;
}

/**
 * Mensagem de chat com suporte a dados JSON estruturados
 */
export interface JsonChatMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
  readonly timestamp: Date;
  readonly jsonData?: ChatbotJsonResponse; // Dados estruturados apenas para mensagens do assistant
}

/**
 * Chunk de streaming com dados JSON
 */
export interface JsonStreamChunk {
  readonly content: string;
  readonly isComplete: boolean;
  readonly sessionId: string;
  readonly isProcessing?: boolean; // Indica que está processando (para mostrar loading)
  readonly jsonData?: Partial<ChatbotJsonResponse>;
  readonly metadata?: {
    readonly stage?: ConversationStage;
    readonly collectedData?: Partial<CollectedData>;
    readonly error?: string;
  };
}

/**
 * Configuração do prompt para respostas JSON
 */
export interface JsonPromptConfig {
  readonly systemPrompt: string;
  readonly jsonSchema: string;
  readonly examples: readonly ChatbotJsonResponse[];
  readonly maxTokens: number;
  readonly temperature: number;
}