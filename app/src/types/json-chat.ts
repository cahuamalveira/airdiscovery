/**
 * Interfaces do frontend para trabalhar com respostas JSON estruturadas do chatbot
 */

export type ConversationStage = 
  | 'collecting_origin' 
  | 'collecting_budget'
  | 'collecting_passengers'
  | 'collecting_availability'
  | 'collecting_activities' 
  | 'collecting_purpose' 
  | 'collecting_hobbies' 
  | 'recommendation_ready'
  | 'error';

/**
 * Child passenger information
 */
export interface ChildPassenger {
  readonly age: number;
  readonly isPaying: boolean;
}

/**
 * Passenger composition for multi-passenger bookings
 */
export interface PassengerComposition {
  readonly adults: number;
  readonly children: readonly ChildPassenger[] | null;
}

export interface CollectedTravelData {
  readonly origin_name: string | null;
  readonly origin_iata: string | null;
  readonly destination_name: string | null;
  readonly destination_iata: string | null;
  readonly activities: readonly string[] | null;
  readonly budget_in_brl: number | null;
  readonly availability_months: readonly string[] | null;
  readonly purpose: string | null;
  readonly hobbies: readonly string[] | null;
  readonly passenger_composition: PassengerComposition | null;
}

/**
 * Button option for interactive chat responses
 */
export interface ButtonOption {
  readonly label: string;
  readonly value: string;
}

/**
 * Resposta estruturada do chatbot
 */
export interface ChatbotJsonResponse {
  readonly conversation_stage: ConversationStage;
  readonly data_collected: CollectedTravelData;
  readonly next_question_key: string | null;
  readonly assistant_message: string;
  readonly is_final_recommendation: boolean;
  readonly button_options?: readonly ButtonOption[];
}

/**
 * Mensagem de chat com dados JSON estruturados
 */
export interface JsonChatMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
  readonly timestamp: Date;
  readonly jsonData?: ChatbotJsonResponse;
  readonly isStreaming?: boolean;
  readonly buttonOptions?: readonly ButtonOption[];
}

/**
 * Chunk de streaming com dados JSON
 */
export interface JsonStreamChunk {
  readonly content: string;
  readonly isComplete: boolean;
  readonly sessionId: string;
  readonly jsonData?: ChatbotJsonResponse;
  readonly metadata?: {
    readonly stage?: ConversationStage;
    readonly collectedData?: Partial<CollectedTravelData>;
    readonly error?: string;
    readonly completionPercentage?: number;
  };
}

/**
 * Estado da sessão de chat JSON
 */
export interface JsonChatState {
  readonly sessionId: string | null;
  readonly messages: readonly JsonChatMessage[];
  readonly isConnected: boolean;
  readonly isTyping: boolean;
  readonly currentStage: ConversationStage;
  readonly collectedData: CollectedTravelData;
  readonly isComplete: boolean;
  readonly hasRecommendation: boolean;
  readonly error: string | null;
  readonly metadata?: {
    readonly completionPercentage: number;
    readonly missingFields: readonly string[];
    readonly readyForRecommendation: boolean;
  };
}

/**
 * Actions para o reducer de chat JSON
 */
export type JsonChatAction =
  | { type: 'SET_SESSION_ID'; payload: string | null }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'ADD_MESSAGE'; payload: JsonChatMessage }
  | { type: 'UPDATE_STREAMING_MESSAGE'; payload: { content: string; isComplete: boolean; jsonData?: ChatbotJsonResponse } }
  | { type: 'COMPLETE_STREAMING' }
  | { type: 'UPDATE_COLLECTED_DATA'; payload: CollectedTravelData }
  | { type: 'SET_STAGE'; payload: ConversationStage }
  | { type: 'SET_COMPLETE'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_METADATA'; payload: JsonChatState['metadata'] }
  | { type: 'RESET_CHAT' };

/**
 * Props para componentes de chat JSON
 */
export interface JsonChatInterfaceProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly user: any;
}

/**
 * Dados para recomendação de viagem
 */
export interface TravelRecommendation {
  readonly destination: {
    readonly name: string;
    readonly iata: string;
    readonly description?: string;
  };
  readonly origin: {
    readonly name: string;
    readonly iata: string;
  };
  readonly budget: number;
  readonly activities: readonly string[];
  readonly purpose?: string;
  readonly recommendationReason: string;
}

/**
 * Configuração do chat JSON
 */
export interface JsonChatConfig {
  readonly maxMessages: number;
  readonly streamingEnabled: boolean;
  readonly autoAdvance: boolean;
  readonly showProgress: boolean;
  readonly allowEdit: boolean;
}

/**
 * Hook state para chat JSON
 */
export interface UseJsonChatState {
  readonly state: JsonChatState;
  readonly sendMessage: (content: string) => void;
  readonly resetChat: () => void;
  readonly isReady: boolean;
  readonly recommendation: TravelRecommendation | null;
  readonly progress: {
    readonly current: number;
    readonly total: number;
    readonly percentage: number;
  };
}

/**
 * Eventos do WebSocket para chat JSON
 */
export interface JsonWebSocketEvents {
  // Eventos enviados
  startChat: () => void;
  sendMessage: (data: { content: string; sessionId: string }) => void;
  endChat: (data: { sessionId: string }) => void;

  // Eventos recebidos
  chatChunk: (chunk: JsonStreamChunk) => void;
  chatResponse: (response: ChatbotJsonResponse & { sessionId: string }) => void;
  chatEnded: (data: { sessionId: string; recommendation?: TravelRecommendation }) => void;
  sessionStatus: (status: { sessionId: string; stage: ConversationStage; isComplete: boolean }) => void;
  error: (error: { message: string; sessionId?: string }) => void;
}

/**
 * Utilitários para trabalhar com dados do chat JSON
 */
export class JsonChatUtils {
  /**
   * Verifica se os dados estão prontos para recomendação
   */
  public static isReadyForRecommendation(data: CollectedTravelData): boolean {
    return !!(
      data.origin_name && 
      data.origin_iata && 
      data.budget_in_brl && 
      (data.activities?.length || data.purpose)
    );
  }

  /**
   * Calcula progresso de preenchimento
   */
  public static calculateProgress(data: CollectedTravelData): { current: number; total: number; percentage: number } {
    const requiredFields = ['origin_name', 'origin_iata', 'budget_in_brl'];
    const optionalFields = ['activities', 'purpose'];
    
    const requiredFilled = requiredFields.filter(field => 
      data[field as keyof CollectedTravelData] !== null
    ).length;

    const optionalFilled = optionalFields.filter(field => {
      const value = data[field as keyof CollectedTravelData];
      return value !== null && (Array.isArray(value) ? value.length > 0 : true);
    }).length;

    // Precisa de todos os required + pelo menos 1 optional
    const current = requiredFilled + Math.min(optionalFilled, 1);
    const total = requiredFields.length + 1; // +1 para pelo menos um optional

    return {
      current,
      total,
      percentage: Math.round((current / total) * 100)
    };
  }

  /**
   * Extrai recomendação dos dados coletados
   */
  public static extractRecommendation(data: CollectedTravelData): TravelRecommendation | null {
    if (!this.isReadyForRecommendation(data) || !data.destination_name || !data.destination_iata) {
      return null;
    }

    return {
      destination: {
        name: data.destination_name,
        iata: data.destination_iata
      },
      origin: {
        name: data.origin_name!,
        iata: data.origin_iata!
      },
      budget: data.budget_in_brl!,
      activities: data.activities || [],
      purpose: data.purpose || undefined,
      recommendationReason: `Baseado no seu orçamento de R$ ${data.budget_in_brl} e preferências.`
    };
  }

  /**
   * Formata orçamento para exibição
   */
  public static formatBudget(amount: number | null): string {
    if (!amount) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  /**
   * Formata lista de atividades
   */
  public static formatActivities(activities: readonly string[] | null): string {
    if (!activities || activities.length === 0) return 'Não informado';
    if (activities.length === 1) return activities[0];
    if (activities.length === 2) return activities.join(' e ');
    return `${activities.slice(0, -1).join(', ')} e ${activities[activities.length - 1]}`;
  }

  /**
   * Obtém próxima pergunta sugerida
   */
  public static getNextSuggestedQuestion(stage: ConversationStage, data: CollectedTravelData): string | null {
    switch (stage) {
      case 'collecting_origin':
        return 'De qual cidade você vai partir?';
      case 'collecting_budget':
        return 'Qual é o seu orçamento para esta viagem?';
      case 'collecting_activities':
        return 'Que tipo de atividades você gosta de fazer?';
      case 'collecting_purpose':
        return 'Qual é o propósito principal desta viagem?';
      case 'collecting_hobbies':
        return 'Quais são seus hobbies e interesses?';
      default:
        return null;
    }
  }
}