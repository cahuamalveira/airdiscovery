import { useReducer, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { 
  JsonChatState, 
  JsonChatAction,
  UseJsonChatState,
  TravelRecommendation,
  JsonChatUtils
} from '../types/json-chat';
import { 
  jsonChatReducer, 
  jsonChatInitialState, 
  jsonChatSelectors 
} from '../reducers/jsonChatReducer';
import { useJsonSocket } from './useJsonSocket';

interface UseJsonChatProps {
  isOpen: boolean;
  user: any;
  socket: Socket | null;
}

/**
 * Hook principal para gerenciar chat com respostas JSON estruturadas
 * Combina state management, WebSocket e utility functions
 */
export const useJsonChat = ({ isOpen, user, socket }: UseJsonChatProps): UseJsonChatState => {
  const [state, dispatch] = useReducer(jsonChatReducer, jsonChatInitialState);

  // Configura WebSocket com handlers
  const { sendJsonMessage, resetJsonChat } = useJsonSocket({
    isOpen,
    user,
    socket,
    dispatch
  });

  /**
   * Envia mensagem do usuário
   */
  const sendMessage = useCallback((content: string) => {
    if (!state.sessionId) {
      console.error('❌ Tentativa de enviar mensagem sem sessão ativa');
      return;
    }

    if (!jsonChatSelectors.canSendMessage(state)) {
      console.warn('⚠️ Não é possível enviar mensagem no estado atual');
      return;
    }

    sendJsonMessage(content, state.sessionId);
  }, [state.sessionId, sendJsonMessage, state]);

  /**
   * Reseta o chat para o estado inicial
   */
  const resetChat = useCallback(() => {
    resetJsonChat(state.sessionId);
  }, [resetJsonChat, state.sessionId]);

  /**
   * Verifica se o chat está pronto para uso
   */
  const isReady = state.isConnected && !!state.sessionId && !state.error;

  /**
   * Extrai recomendação final dos dados coletados
   */
  const recommendation: TravelRecommendation | null = jsonChatSelectors.getRecommendation(state);

  /**
   * Calcula progresso atual
   */
  const progress = JsonChatUtils.calculateProgress(state.collectedData);

  return {
    state,
    sendMessage,
    resetChat,
    isReady,
    recommendation,
    progress
  };
};

/**
 * Hook específico para dados de progresso do chat
 */
export const useJsonChatProgress = (state: JsonChatState) => {
  const progress = JsonChatUtils.calculateProgress(state.collectedData);
  const completionStats = {
    hasOrigin: !!(state.collectedData.origin_name && state.collectedData.origin_iata),
    hasBudget: !!state.collectedData.budget_in_brl,
    hasActivities: !!(state.collectedData.activities?.length),
    hasPurpose: !!state.collectedData.purpose,
    isReadyForRecommendation: JsonChatUtils.isReadyForRecommendation(state.collectedData)
  };

  return {
    ...progress,
    ...completionStats,
    nextStep: jsonChatSelectors.getNextQuestion(state),
    stageDescription: getStageDescription(state.currentStage)
  };
};

/**
 * Hook para formatação de dados coletados
 */
export const useJsonChatFormatters = () => {
  return {
    formatBudget: JsonChatUtils.formatBudget,
    formatActivities: JsonChatUtils.formatActivities,
    formatProgress: (current: number, total: number) => `${current}/${total}`,
    formatPercentage: (percentage: number) => `${percentage}%`,
    formatStage: (stage: string) => getStageDescription(stage),
    formatRecommendation: (rec: TravelRecommendation | null) => {
      if (!rec) return null;
      return `${rec.destination.name} (${rec.destination.iata})`;
    }
  };
};

/**
 * Hook para ações do chat JSON
 */
export const useJsonChatActions = (
  state: JsonChatState, 
  dispatch: React.Dispatch<JsonChatAction>
) => {
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, [dispatch]);

  const setTyping = useCallback((isTyping: boolean) => {
    dispatch({ type: 'SET_TYPING', payload: isTyping });
  }, [dispatch]);

  const updateMetadata = useCallback((metadata: JsonChatState['metadata']) => {
    dispatch({ type: 'SET_METADATA', payload: metadata });
  }, [dispatch]);

  return {
    clearError,
    setTyping,
    updateMetadata,
    canSendMessage: jsonChatSelectors.canSendMessage(state),
    hasError: jsonChatSelectors.hasError(state),
    lastAssistantMessage: jsonChatSelectors.getLastAssistantMessage(state),
    userMessages: jsonChatSelectors.getUserMessages(state)
  };
};

/**
 * Utilitário para obter descrição amigável do estágio
 */
function getStageDescription(stage: string): string {
  const descriptions: Record<string, string> = {
    'collecting_origin': 'Coletando cidade de origem',
    'collecting_budget': 'Coletando orçamento',
    'collecting_activities': 'Coletando atividades preferidas',
    'collecting_purpose': 'Coletando propósito da viagem',
    'collecting_hobbies': 'Coletando hobbies e interesses',
    'recommendation_ready': 'Recomendação pronta',
    'error': 'Erro na conversa'
  };

  return descriptions[stage] || 'Estado desconhecido';
}

/**
 * Hook para debug do estado do chat JSON
 */
export const useJsonChatDebug = (state: JsonChatState) => {
  const debugInfo = {
    sessionId: state.sessionId,
    stage: state.currentStage,
    messageCount: state.messages.length,
    isComplete: state.isComplete,
    hasRecommendation: state.hasRecommendation,
    isConnected: state.isConnected,
    isTyping: state.isTyping,
    error: state.error,
    collectedFields: Object.entries(state.collectedData)
      .filter(([_, value]) => value !== null)
      .map(([key, _]) => key),
    progress: JsonChatUtils.calculateProgress(state.collectedData)
  };

  return debugInfo;
};