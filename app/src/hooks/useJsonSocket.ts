import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  JsonChatAction, 
  JsonStreamChunk, 
  ChatbotJsonResponse,
  JsonChatMessage 
} from '../types/json-chat';

interface UseJsonSocketParams {
  isOpen: boolean;
  user: any;
  socket: Socket | null;
  dispatch: React.Dispatch<JsonChatAction>;
}

/**
 * Hook para gerenciar conexão WebSocket com suporte a respostas JSON estruturadas
 */
export const useJsonSocket = ({ isOpen, user, socket, dispatch }: UseJsonSocketParams) => {
  useEffect(() => {
    // Só inicializar se não tiver socket e as condições estiverem atendidas
    if (!isOpen || !user || socket) {
      return;
    }

    // Obter token do usuário
    const token = user.accessToken || 'temp-token-for-dev';

    console.log('🚀 Conectando ao WebSocket JSON:', `${import.meta.env.VITE_API_URL}/chat`);
    console.log('🔑 Token:', token ? 'Presente' : 'Ausente');

    const newSocket = io(`${import.meta.env.VITE_API_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
      reconnection: true,
      timeout: 20000,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    // Connection handlers
    newSocket.on('connect', () => {
      console.log('✅ Conectado ao servidor JSON');
      console.log('Socket ID:', newSocket.id);
      dispatch({ type: 'SET_CONNECTED', payload: true });

      // Inicia sessão de chat
      setTimeout(() => {
        console.log('📡 Iniciando sessão de chat JSON...');
        
        newSocket.emit('startChat', {}, (response: { sessionId: string }) => {
          console.log('📝 Sessão JSON iniciada:', response);
          dispatch({ type: 'SET_SESSION_ID', payload: response.sessionId });

          // Solicita mensagem inicial
          newSocket.emit('getInitialMessage', { sessionId: response.sessionId }, 
            (initialChunk: JsonStreamChunk) => {
              console.log('🎬 Mensagem inicial JSON:', initialChunk);
              
              if (initialChunk.jsonData) {
                const initialMessage: JsonChatMessage = {
                  id: crypto.randomUUID(),
                  content: initialChunk.jsonData.assistant_message,
                  role: 'assistant',
                  timestamp: new Date(),
                  jsonData: initialChunk.jsonData
                };
                
                dispatch({ type: 'ADD_MESSAGE', payload: initialMessage });
              }
            }
          );
        });
      }, 1000);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Desconectado do servidor JSON. Motivo:', reason);
      dispatch({ type: 'SET_CONNECTED', payload: false });
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔥 Erro de conexão JSON:', error);
      dispatch({ type: 'SET_CONNECTED', payload: false });
      dispatch({ type: 'SET_ERROR', payload: `Erro de conexão: ${error.message}` });
    });

    // JSON Stream handlers
    newSocket.on('jsonChatChunk', (chunk: JsonStreamChunk) => {
      console.log('📦 Chunk JSON recebido:', chunk);
      
      dispatch({ type: 'SET_TYPING', payload: !chunk.isComplete });

      // Atualiza mensagem de streaming
      if (chunk.content) {
        dispatch({ 
          type: 'UPDATE_STREAMING_MESSAGE', 
          payload: {
            content: chunk.content,
            isComplete: chunk.isComplete,
            jsonData: chunk.jsonData
          }
        });
      }

      // Atualiza metadados se fornecidos
      if (chunk.metadata) {
        dispatch({ type: 'SET_METADATA', payload: {
          completionPercentage: chunk.metadata.completionPercentage || 0,
          missingFields: [],
          readyForRecommendation: false,
          ...chunk.metadata
        }});
      }

      // Completa streaming quando necessário
      if (chunk.isComplete) {
        dispatch({ type: 'COMPLETE_STREAMING' });
        
        // Se tem recomendação final, marca como completo
        if (chunk.jsonData?.is_final_recommendation) {
          dispatch({ type: 'SET_COMPLETE', payload: true });
        }
      }
    });

    // Resposta JSON completa (fallback)
    newSocket.on('jsonChatResponse', (response: ChatbotJsonResponse & { sessionId: string }) => {
      console.log('📨 Resposta JSON completa:', response);
      
      const message: JsonChatMessage = {
        id: crypto.randomUUID(),
        content: response.assistant_message,
        role: 'assistant',
        timestamp: new Date(),
        jsonData: response
      };

      dispatch({ type: 'ADD_MESSAGE', payload: message });
      dispatch({ type: 'SET_TYPING', payload: false });

      // Atualiza estado baseado na resposta
      if (response.is_final_recommendation) {
        dispatch({ type: 'SET_COMPLETE', payload: true });
      }
    });

    // Chat finalizado
    newSocket.on('jsonChatEnded', (data: { 
      sessionId: string; 
      collectedData?: any;
      recommendation?: any;
    }) => {
      console.log('🏁 Chat JSON finalizado:', data);
      
      if (data.recommendation) {
        // Adiciona mensagem final de recomendação se necessário
        const endMessage: JsonChatMessage = {
          id: crypto.randomUUID(),
          content: `Perfeito! Sua recomendação está pronta.`,
          role: 'assistant',
          timestamp: new Date()
        };
        
        dispatch({ type: 'ADD_MESSAGE', payload: endMessage });
      }
      
      dispatch({ type: 'SET_COMPLETE', payload: true });
      dispatch({ type: 'SET_TYPING', payload: false });
    });

    // Status da sessão
    newSocket.on('jsonSessionStatus', (status: { 
      sessionId: string;
      stage: string;
      collectedData: any;
      isComplete: boolean;
      hasRecommendation: boolean;
    }) => {
      console.log('📊 Status da sessão JSON:', status);
      
      if (status.collectedData) {
        dispatch({ type: 'UPDATE_COLLECTED_DATA', payload: status.collectedData });
      }
      
      if (status.stage) {
        dispatch({ type: 'SET_STAGE', payload: status.stage as any });
      }
      
      if (status.isComplete) {
        dispatch({ type: 'SET_COMPLETE', payload: true });
      }
    });

    // Erros
    newSocket.on('error', (error: any) => {
      console.error('❌ Erro do chat JSON:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Erro desconhecido' });
      dispatch({ type: 'SET_TYPING', payload: false });
    });

    // Reconexão
    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconectado JSON após', attemptNumber, 'tentativas');
      dispatch({ type: 'SET_ERROR', payload: null });
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('🔄❌ Erro de reconexão JSON:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro de reconexão' });
    });

    newSocket.on('reconnect_failed', () => {
      console.error('🔄💀 Reconexão JSON falhou completamente');
      dispatch({ type: 'SET_ERROR', payload: 'Falha na reconexão. Recarregue a página.' });
    });

    // Cleanup function
    return () => {
      console.log('🧹 Limpando conexão JSON');
      newSocket.disconnect();
    };
  }, [isOpen, user, socket, dispatch]);

  /**
   * Função para enviar mensagem JSON
   */
  const sendJsonMessage = (content: string, sessionId: string) => {
    if (!socket || !socket.connected) {
      console.error('❌ Socket não conectado para enviar mensagem JSON');
      return;
    }

    console.log('📤 Enviando mensagem JSON:', { content, sessionId });
    
    // Adiciona mensagem do usuário ao estado
    const userMessage: JsonChatMessage = {
      id: crypto.randomUUID(),
      content,
      role: 'user',
      timestamp: new Date()
    };
    
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_TYPING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    // Envia mensagem via socket
    socket.emit('sendMessage', { content, sessionId }, (response: any) => {
      if (response?.error) {
        console.error('❌ Erro ao enviar mensagem JSON:', response.error);
        dispatch({ type: 'SET_ERROR', payload: response.error });
        dispatch({ type: 'SET_TYPING', payload: false });
      }
    });
  };

  /**
   * Função para resetar chat JSON
   */
  const resetJsonChat = (sessionId: string | null) => {
    if (socket && socket.connected && sessionId) {
      console.log('🔄 Resetando chat JSON');
      socket.emit('endChat', { sessionId });
    }
    
    dispatch({ type: 'RESET_CHAT' });
  };

  return {
    sendJsonMessage,
    resetJsonChat
  };
};