import { 
  JsonChatState, 
  JsonChatAction, 
  JsonChatMessage, 
  CollectedTravelData,
  ConversationStage 
} from '../types/json-chat';

/**
 * Estado inicial do chat JSON
 */
const initialCollectedData: CollectedTravelData = {
  origin_name: null,
  origin_iata: null,
  destination_name: null,
  destination_iata: null,
  activities: null,
  budget_in_brl: null,
  purpose: null,
  hobbies: null
};

const initialState: JsonChatState = {
  sessionId: null,
  messages: [],
  isConnected: false,
  isTyping: false,
  currentStage: 'collecting_origin',
  collectedData: initialCollectedData,
  isComplete: false,
  hasRecommendation: false,
  error: null,
  metadata: {
    completionPercentage: 0,
    missingFields: ['origin_name', 'origin_iata', 'budget_in_brl', 'activities'],
    readyForRecommendation: false
  }
};

/**
 * Calcula metadados baseados nos dados coletados
 */
function calculateMetadata(data: CollectedTravelData) {
  const requiredFields = ['origin_name', 'origin_iata', 'budget_in_brl'];
  const optionalFields = ['activities', 'purpose'];
  
  const filledRequired = requiredFields.filter(field => 
    data[field as keyof CollectedTravelData] !== null
  );

  const filledOptional = optionalFields.filter(field => {
    const value = data[field as keyof CollectedTravelData];
    return value !== null && (Array.isArray(value) ? value.length > 0 : true);
  });

  const missingFields = [
    ...requiredFields.filter(field => data[field as keyof CollectedTravelData] === null),
    ...(filledOptional.length === 0 ? ['activities ou purpose'] : [])
  ];

  const total = requiredFields.length + 1; // +1 para pelo menos um optional
  const current = filledRequired.length + Math.min(filledOptional.length, 1);
  const completionPercentage = Math.round((current / total) * 100);
  
  const readyForRecommendation = !!(
    data.origin_name && 
    data.origin_iata && 
    data.budget_in_brl && 
    (data.activities?.length || data.purpose)
  );

  return {
    completionPercentage,
    missingFields,
    readyForRecommendation
  };
}

/**
 * Reducer para gerenciar estado do chat JSON
 */
export function jsonChatReducer(state: JsonChatState, action: JsonChatAction): JsonChatState {
  switch (action.type) {
    case 'SET_SESSION_ID':
      return {
        ...state,
        sessionId: action.payload
      };

    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: action.payload,
        error: action.payload ? null : state.error // Limpa erro se conectado
      };

    case 'SET_TYPING':
      return {
        ...state,
        isTyping: action.payload
      };

    case 'ADD_MESSAGE': {
      const newMessage = action.payload;
      const messages = [...state.messages, newMessage];

      // Se é mensagem do assistant com dados JSON, atualiza estado
      if (newMessage.role === 'assistant' && newMessage.jsonData) {
        const jsonData = newMessage.jsonData;
        const metadata = calculateMetadata(jsonData.data_collected);
        
        return {
          ...state,
          messages,
          currentStage: jsonData.conversation_stage,
          collectedData: jsonData.data_collected,
          isComplete: jsonData.is_final_recommendation,
          hasRecommendation: jsonData.is_final_recommendation,
          isTyping: false,
          metadata
        };
      }

      return {
        ...state,
        messages
      };
    }

    case 'UPDATE_STREAMING_MESSAGE': {
      const { content, isComplete, jsonData } = action.payload;
      const messages = [...state.messages];
      
      // Encontra ou cria mensagem de streaming
      let streamingMessage = messages.find(msg => 
        msg.role === 'assistant' && msg.isStreaming
      );

      if (!streamingMessage) {
        // Cria nova mensagem de streaming
        streamingMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content,
          timestamp: new Date(),
          isStreaming: true
        };
        messages.push(streamingMessage);
      } else {
        // Atualiza mensagem existente
        const index = messages.findIndex(msg => msg.id === streamingMessage!.id);
        messages[index] = {
          ...streamingMessage,
          content: streamingMessage.content + content,
          jsonData: jsonData || streamingMessage.jsonData
        };
      }

      let newState = {
        ...state,
        messages,
        isTyping: !isComplete
      };

      // Se tem dados JSON e está completo, atualiza estado
      if (jsonData && isComplete) {
        const metadata = calculateMetadata(jsonData.data_collected);
        
        newState = {
          ...newState,
          currentStage: jsonData.conversation_stage,
          collectedData: jsonData.data_collected,
          isComplete: jsonData.is_final_recommendation,
          hasRecommendation: jsonData.is_final_recommendation,
          metadata
        };
      }

      return newState;
    }

    case 'COMPLETE_STREAMING': {
      const messages = state.messages.map(msg => {
        if (msg.role === 'assistant' && msg.isStreaming) {
          return {
            ...msg,
            isStreaming: false
          };
        }
        return msg;
      });

      return {
        ...state,
        messages,
        isTyping: false
      };
    }

    case 'UPDATE_COLLECTED_DATA': {
      const metadata = calculateMetadata(action.payload);
      
      return {
        ...state,
        collectedData: action.payload,
        metadata
      };
    }

    case 'SET_STAGE':
      return {
        ...state,
        currentStage: action.payload
      };

    case 'SET_COMPLETE': {
      const isComplete = action.payload;
      return {
        ...state,
        isComplete,
        hasRecommendation: isComplete,
        isTyping: false
      };
    }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isTyping: false
      };

    case 'SET_METADATA':
      return {
        ...state,
        metadata: action.payload
      };

    case 'RESET_CHAT':
      return {
        ...initialState,
        isConnected: state.isConnected // Mantém status de conexão
      };

    default:
      return state;
  }
}

/**
 * Seletores para o estado do chat JSON
 */
export const jsonChatSelectors = {
  /**
   * Obtém última mensagem do assistant
   */
  getLastAssistantMessage: (state: JsonChatState): JsonChatMessage | null => {
    const assistantMessages = state.messages.filter(msg => msg.role === 'assistant');
    return assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : null;
  },

  /**
   * Obtém mensagens do usuário
   */
  getUserMessages: (state: JsonChatState): JsonChatMessage[] => {
    return state.messages.filter(msg => msg.role === 'user');
  },

  /**
   * Verifica se pode enviar mensagem
   */
  canSendMessage: (state: JsonChatState): boolean => {
    return state.isConnected && !state.isTyping && !state.isComplete && !state.error;
  },

  /**
   * Obtém dados da recomendação final
   */
  getRecommendation: (state: JsonChatState) => {
    if (!state.hasRecommendation || !state.collectedData.destination_name) {
      return null;
    }

    return {
      destination: {
        name: state.collectedData.destination_name,
        iata: state.collectedData.destination_iata!
      },
      origin: {
        name: state.collectedData.origin_name!,
        iata: state.collectedData.origin_iata!
      },
      budget: state.collectedData.budget_in_brl!,
      activities: state.collectedData.activities || [],
      purpose: state.collectedData.purpose || undefined,
      recommendationReason: `Recomendação baseada em seu orçamento de R$ ${state.collectedData.budget_in_brl} e suas preferências de viagem.`
    };
  },

  /**
   * Obtém próxima pergunta sugerida
   */
  getNextQuestion: (state: JsonChatState): string | null => {
    switch (state.currentStage) {
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
  },

  /**
   * Verifica se está em estado de erro
   */
  hasError: (state: JsonChatState): boolean => {
    return !!state.error || state.currentStage === 'error';
  },

  /**
   * Obtém progresso atual
   */
  getProgress: (state: JsonChatState) => {
    return {
      current: Math.round((state.metadata?.completionPercentage || 0) / 100 * 4),
      total: 4,
      percentage: state.metadata?.completionPercentage || 0
    };
  }
};

export { initialState as jsonChatInitialState };