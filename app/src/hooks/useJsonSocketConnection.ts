import { useReducer, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { jsonChatReducer, jsonChatInitialState } from '../reducers/jsonChatReducer';
import { JsonChatAction } from '../types/json-chat';

interface UseJsonSocketConnectionProps {
  isOpen: boolean;
  user: any;
  chatId?: string; // Optional sessionId from URL
}

/**
 * Hook completo para gerenciar conexão WebSocket e estado JSON do chat
 * Substitui completamente o useSocket para a nova arquitetura
 */
export const useJsonSocketConnection = ({ isOpen, user, chatId }: UseJsonSocketConnectionProps) => {
  const [state, dispatch] = useReducer(jsonChatReducer, jsonChatInitialState);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Só inicializar se não tiver socket e as condições estiverem atendidas
    if (!isOpen || !user) {
      return;
    }

    // Se já tem socket, não criar outro
    if (socketRef.current) {
      return;
    }

    // Obter token do usuário
    const token = user.accessToken || 'temp-token-for-dev';

    console.log('🚀 Iniciando conexão JSON WebSocket:', `${import.meta.env.VITE_API_URL}/chat`);
    console.log('🔑 Usando token:', token ? 'Token presente' : 'No token');

    const newSocket = io(`${import.meta.env.VITE_API_URL}/chat`, {
      auth: {
        token: token,
      },
      transports: ['websocket'],
      forceNew: true,
      reconnection: true,
      timeout: 20000,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    socketRef.current = newSocket;

    // Configura listeners para eventos JSON
    const handleJsonChatChunk = (chunk: any) => {
      console.log('📦 JSON chunk recebido:', chunk);
      
      dispatch({ type: 'SET_TYPING', payload: !chunk.isComplete });

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

      if (chunk.isComplete) {
        dispatch({ type: 'COMPLETE_STREAMING' });
        
        if (chunk.jsonData?.is_final_recommendation) {
          dispatch({ type: 'SET_COMPLETE', payload: true });
        }
      }
    };

    const handleChatResponse = (response: any) => {
      console.log('📨 Chat response recebido:', response);
      
      // Se não há sessão ativa e recebemos uma resposta, esta é a mensagem inicial
      if (!state.sessionId && response.sessionId) {
        console.log('📝 SessionId extraído da resposta inicial:', response.sessionId);
        dispatch({ type: 'SET_SESSION_ID', payload: response.sessionId });
      }

      // Se está processando, apenas mostra loading
      if (response.isProcessing) {
        dispatch({ type: 'SET_TYPING', payload: true });
        return;
      }

      // Se é resposta completa, para o loading e processa
      if (response.isComplete) {
        dispatch({ type: 'SET_TYPING', payload: false });
        
        // Adiciona mensagem do assistente
        if (response.content || response.jsonData) {
          const assistantMessage = {
            id: crypto.randomUUID(),
            content: response.content,
            role: 'assistant' as const,
            timestamp: new Date(),
            jsonData: response.jsonData,
            buttonOptions: response.jsonData?.button_options
          };
          
          dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
          
          // Atualiza dados coletados se disponível
          if (response.jsonData?.data_collected) {
            dispatch({ type: 'UPDATE_COLLECTED_DATA', payload: response.jsonData.data_collected });
          }
          
          // Atualiza estágio da conversa
          if (response.jsonData?.conversation_stage) {
            dispatch({ type: 'SET_STAGE', payload: response.jsonData.conversation_stage });
          }
          
          // Verifica se é recomendação final
          if (response.jsonData?.is_final_recommendation) {
            dispatch({ type: 'SET_COMPLETE', payload: true });
          }
        }
        return;
      }

      // Fallback para compatibilidade (caso ainda venha streaming)
      // Tenta parsear como JSON se for string
      let parsedResponse = response;
      if (typeof response.content === 'string') {
        try {
          const jsonMatch = response.content.match(/\{.*\}/s);
          if (jsonMatch) {
            parsedResponse.jsonData = JSON.parse(jsonMatch[0]);
          }
        } catch (error) {
          console.warn('Não foi possível parsear JSON da resposta:', error);
        }
      }

      dispatch({ 
        type: 'UPDATE_STREAMING_MESSAGE', 
        payload: {
          content: response.content,
          isComplete: true,
          jsonData: parsedResponse.jsonData
        }
      });

      dispatch({ type: 'COMPLETE_STREAMING' });
    };

    const handleConnect = () => {
      console.log('✅ Socket JSON conectado');
      dispatch({ type: 'SET_CONNECTED', payload: true });
    };

    const handleDisconnect = () => {
      console.log('❌ Socket JSON desconectado');
      dispatch({ type: 'SET_CONNECTED', payload: false });
    };

    const handleError = (error: any) => {
      console.error('❌ Erro do socket JSON:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Erro de conexão' });
    };

    // Registra listeners
    newSocket.on('connect', handleConnect);
    newSocket.on('disconnect', handleDisconnect);
    newSocket.on('error', handleError);
    newSocket.on('chatChunk', handleJsonChatChunk);
    newSocket.on('chatResponse', handleChatResponse);

    // Se já conectado, atualiza estado
    if (newSocket.connected) {
      dispatch({ type: 'SET_CONNECTED', payload: true });
    }

    // Cleanup
    return () => {
      if (socketRef.current) {
        console.log('🧹 Limpando conexão JSON WebSocket');
        socketRef.current.off('connect', handleConnect);
        socketRef.current.off('disconnect', handleDisconnect);
        socketRef.current.off('error', handleError);
        socketRef.current.off('chatChunk', handleJsonChatChunk);
        socketRef.current.off('chatResponse', handleChatResponse);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isOpen, user]);

  // Effect to handle session initialization when chatId changes
  useEffect(() => {
    if (state.isConnected && socketRef.current && !state.sessionId && chatId) {
      console.log('🔄 Iniciando sessão automaticamente com chatId:', chatId);
      startNewSession();
    }
  }, [state.isConnected, chatId, state.sessionId]);

  // Funções para envio de mensagens
  const sendMessage = (content: string) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected || !state.sessionId) {
      console.error('❌ Socket não conectado ou sem sessão ativa');
      return;
    }

    console.log('📤 Enviando mensagem JSON:', { content, sessionId: state.sessionId });
    
    // Adiciona mensagem do usuário
    const userMessage = {
      id: crypto.randomUUID(),
      content,
      role: 'user' as const,
      timestamp: new Date()
    };
    
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_TYPING', payload: true });

    // Envia via socket
    socket.emit('sendMessage', { content, sessionId: state.sessionId });
  };

  const resetChat = () => {
    const socket = socketRef.current;
    if (socket && socket.connected && state.sessionId) {
      socket.emit('endChat', { sessionId: state.sessionId });
    }
    dispatch({ type: 'RESET_CHAT' });
  };

  const startNewSession = () => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      console.error('❌ Socket não conectado para iniciar sessão');
      return;
    }

    console.log('📝 Iniciando nova sessão JSON...', chatId ? `com sessionId: ${chatId}` : 'sem sessionId específico');
    // Envia o chatId se disponível para recuperar ou criar sessão
    socket.emit('startChat', { sessionId: chatId });
  };

  return {
    state,
    dispatch,
    sendMessage,
    resetChat,
    startNewSession,
    isReady: state.isConnected && !!socketRef.current
  };
};