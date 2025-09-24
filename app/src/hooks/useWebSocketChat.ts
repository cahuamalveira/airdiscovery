import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

// Utility function to deduplicate exact messages
const deduplicateMessages = (messages: ChatMessage[]): ChatMessage[] => {
  const seen = new Set<string>();
  return messages.filter(message => {
    // Create a unique key based on role, content, and timestamp (to nearest second)
    const key = `${message.role}:${message.content.trim()}:${Math.floor(new Date(message.timestamp).getTime() / 1000)}`;
    
    if (seen.has(key)) {
      console.log('🔄 Duplicate message detected and removed:', {
        role: message.role,
        content: message.content.substring(0, 50) + '...',
        timestamp: message.timestamp
      });
      return false;
    }
    
    seen.add(key);
    return true;
  });
};

// Types based on the backend interfaces
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface UserProfile {
  origin: string;
  activities: string[];
  budget: number;
  purpose: string;
  hobbies: string[];
}

export interface ChatSession {
  sessionId: string;
  userId: string;
  messages: ChatMessage[];
  profileData: UserProfile;
  currentQuestionIndex: number;
  interviewComplete: boolean;
  readyForRecommendation: boolean;
  recommendedDestination?: string;
  questionsAsked: number;
  totalQuestionsAvailable: number;
  interviewEfficiency: number;
  completedAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamChunk {
  content: string;
  isComplete: boolean;
  sessionId: string;
  metadata?: {
    questionNumber?: number;
    totalQuestions?: number;
    interviewComplete?: boolean;
    profileData?: UserProfile;
    stopReason?: string;
    error?: string;
  };
}

export interface WebSocketChatState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Session state
  session: ChatSession | null;
  hasActiveSession: boolean;
  isLoadingSession: boolean;
  
  // Messages state
  messages: ChatMessage[];
  isStreaming: boolean;
  currentStreamContent: string;
  
  // UI state
  error: string | null;
  isInitializing: boolean;
}

const initialState: WebSocketChatState = {
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  session: null,
  hasActiveSession: false,
  isLoadingSession: false,
  messages: [],
  isStreaming: false,
  currentStreamContent: '',
  error: null,
  isInitializing: true,
};

export interface UseWebSocketChatHook {
  // State
  state: WebSocketChatState;
  
  // Actions
  startChat: (sessionId?: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  endChat: () => Promise<void>;
  requestSessionInfo: () => Promise<void>;
  
  // Connection management
  connect: () => void;
  disconnect: () => void;
  
  // Utils
  canSendMessage: boolean;
}

export const useWebSocketChat = (): UseWebSocketChatHook => {
  const { user } = useAuth();
  const [state, setState] = useState<WebSocketChatState>(initialState);
  const socketRef = useRef<Socket | null>(null);
  const streamingMessageRef = useRef<string>('');

  // Update state helper
  const updateState = useCallback((updates: Partial<WebSocketChatState> | ((prev: WebSocketChatState) => Partial<WebSocketChatState>)) => {
    if (typeof updates === 'function') {
      setState(prev => ({ ...prev, ...updates(prev) }));
    } else {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Connection management
  const connect = useCallback(() => {
    if (!user || socketRef.current?.connected) {
      return;
    }

    updateState({ isConnecting: true, connectionError: null });

    const token = user.accessToken || (user as any).signInUserSession?.accessToken?.jwtToken;
    if (!token) {
      updateState({ 
        isConnecting: false, 
        connectionError: 'No authentication token available' 
      });
      return;
    }

    const socket = io(`${import.meta.env.VITE_API_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
      reconnection: true,
      timeout: 20000,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Connected to chat server');
      updateState({ 
        isConnected: true, 
        isConnecting: false, 
        connectionError: null,
        isInitializing: false
      });
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server');
      updateState({ 
        isConnected: false, 
        isConnecting: false 
      });
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      updateState({ 
        isConnected: false, 
        isConnecting: false,
        connectionError: error.message 
      });
    });

    // Chat events
    socket.on('chatResponse', (chunk: StreamChunk) => {
      console.log('📨 Received chat response:', chunk);
      
      if (chunk.isComplete) {
        // Complete message received
        const finalContent = streamingMessageRef.current + chunk.content;
        
        // Only add message if content is not empty
        if (finalContent.trim()) {
          const newMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: finalContent,
            timestamp: new Date(),
          };

          updateState(prev => {
            const updatedMessages = deduplicateMessages([...prev.messages, newMessage]);
            return {
              messages: updatedMessages,
              isStreaming: false,
              currentStreamContent: '',
              hasActiveSession: true, // Ensure we mark session as active when receiving responses
              isLoadingSession: false, // Stop loading when we get first response
            };
          });
        } else {
          // Just update state without adding empty message
          updateState({
            isStreaming: false,
            currentStreamContent: '',
            hasActiveSession: true,
            isLoadingSession: false,
          });
        }

        streamingMessageRef.current = '';

        // Check if interview is complete
        if (chunk.metadata?.interviewComplete) {
          requestSessionInfo();
        }
      } else {
        // Streaming chunk - only update if we have content
        streamingMessageRef.current += chunk.content;
        
        // Only show streaming if there's actual content
        if (streamingMessageRef.current.trim()) {
          updateState({
            isStreaming: true,
            currentStreamContent: streamingMessageRef.current,
            hasActiveSession: true, // Mark session as active during streaming
            isLoadingSession: false, // Stop loading when streaming starts
          });
        } else {
          // Just mark session as active without showing empty streaming
          updateState({
            hasActiveSession: true,
            isLoadingSession: false,
          });
        }
      }
    });

    socket.on('sessionInfo', (sessionData: { hasActiveSession: boolean } & Partial<ChatSession>) => {
      console.log('📋 Received session info:', sessionData);
      
      if (sessionData.hasActiveSession && sessionData.sessionId) {
        const session: ChatSession = {
          sessionId: sessionData.sessionId,
          userId: sessionData.userId || '',
          messages: sessionData.messages || [],
          profileData: sessionData.profileData || {
            origin: '',
            activities: [],
            budget: 0,
            purpose: '',
            hobbies: [],
          },
          currentQuestionIndex: sessionData.currentQuestionIndex || 0,
          interviewComplete: sessionData.interviewComplete || false,
          readyForRecommendation: sessionData.readyForRecommendation || false,
          recommendedDestination: sessionData.recommendedDestination,
          questionsAsked: sessionData.questionsAsked || 0,
          totalQuestionsAvailable: sessionData.totalQuestionsAvailable || 5,
          interviewEfficiency: sessionData.interviewEfficiency || 0,
          completedAt: sessionData.completedAt,
          createdAt: sessionData.createdAt ? new Date(sessionData.createdAt) : new Date(),
          updatedAt: sessionData.updatedAt ? new Date(sessionData.updatedAt) : new Date(),
        };

        updateState({
          session,
          hasActiveSession: true,
          isLoadingSession: false,
          messages: deduplicateMessages(session.messages),
        });
      } else {
        updateState({
          session: null,
          hasActiveSession: false,
          isLoadingSession: false,
        });
      }
    });

    socket.on('chatEnded', (data) => {
      console.log('🏁 Chat ended:', data);
      updateState({
        session: null,
        hasActiveSession: false,
        messages: [],
        currentStreamContent: '',
        isStreaming: false,
      });
    });

    socket.on('error', (error) => {
      console.error('❌ Chat error:', error);
      updateState({ error: error.message || 'An error occurred' });
    });

  }, [user, updateState]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    updateState({
      isConnected: false,
      isConnecting: false,
      session: null,
      hasActiveSession: false,
      messages: [],
      currentStreamContent: '',
      isStreaming: false,
    });
  }, [updateState]);

  // Chat actions
  const startChat = useCallback(async (sessionId?: string) => {
    if (!socketRef.current?.connected) {
      throw new Error('Not connected to chat server');
    }

    updateState({ isLoadingSession: true, error: null });

    try {
      socketRef.current.emit('startChat', { sessionId });
      // Chat started successfully - the actual session state will be updated
      // when we receive the initial chatResponse or sessionInfo from the server
      console.log('🚀 Chat start request sent successfully', { sessionId });
    } catch (error) {
      updateState({ 
        isLoadingSession: false, 
        error: error instanceof Error ? error.message : 'Failed to start chat' 
      });
      throw error;
    }
  }, [updateState]);

  const sendMessage = useCallback(async (content: string) => {
    if (!socketRef.current?.connected) {
      throw new Error('Not connected to chat server');
    }

    if (!state.hasActiveSession) {
      throw new Error('No active chat session');
    }

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    updateState(prev => {
      const updatedMessages = deduplicateMessages([...prev.messages, userMessage]);
      return {
        messages: updatedMessages,
        error: null,
      };
    });

    // Reset streaming state
    streamingMessageRef.current = '';

    try {
      socketRef.current.emit('sendMessage', {
        content,
        role: 'user',
      });
    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to send message' 
      });
      throw error;
    }
  }, [state.hasActiveSession, updateState]);

  const endChat = useCallback(async () => {
    if (!socketRef.current?.connected) {
      throw new Error('Not connected to chat server');
    }

    try {
      socketRef.current.emit('endChat');
    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to end chat' 
      });
      throw error;
    }
  }, [updateState]);

  const requestSessionInfo = useCallback(async () => {
    if (!socketRef.current?.connected) {
      return;
    }

    updateState({ isLoadingSession: true });
    
    try {
      socketRef.current.emit('sessionInfo');
    } catch (error) {
      updateState({ 
        isLoadingSession: false,
        error: error instanceof Error ? error.message : 'Failed to get session info' 
      });
    }
  }, [updateState]);

  // Auto-connect when user is available
  useEffect(() => {
    if (user && !socketRef.current) {
      connect();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, connect]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const canSendMessage = state.isConnected && !state.session?.interviewComplete && state.hasActiveSession && !state.isStreaming;

  return {
    state,
    startChat,
    sendMessage,
    endChat,
    requestSessionInfo,
    connect,
    disconnect,
    canSendMessage,
  };
};