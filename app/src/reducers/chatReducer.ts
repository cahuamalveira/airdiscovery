import { Socket } from 'socket.io-client';
import { UserProfile } from '../types/chat';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatMetadata {
  questionNumber?: number;
  totalQuestions?: number;
  interviewComplete?: boolean;
  profileData?: UserProfile;
  stopReason?: string;
  error?: string;
}

export interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  currentMessage: string;
  isConnected: boolean;
  isTyping: boolean;
  sessionId: string | null;
  metadata: ChatMetadata;
  socket: Socket | null;
}

export type ChatAction =
  | { type: 'OPEN_CHAT' }
  | { type: 'CLOSE_CHAT' }
  | { type: 'SET_CURRENT_MESSAGE'; payload: string }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_SESSION_ID'; payload: string | null }
  | { type: 'SET_METADATA'; payload: ChatMetadata }
  | { type: 'SET_SOCKET'; payload: Socket | null }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'ADD_GREETING_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_STREAMING_MESSAGE'; payload: { content: string; isComplete: boolean } }
  | { type: 'CREATE_STREAMING_MESSAGE'; payload: { content: string; isComplete: boolean } }
  | { type: 'COMPLETE_STREAMING' }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'RESET_CHAT' };

export const initialChatState: ChatState = {
  isOpen: false,
  messages: [],
  currentMessage: '',
  isConnected: false,
  isTyping: false,
  sessionId: null,
  metadata: {},
  socket: null,
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'OPEN_CHAT':
      return {
        ...state,
        isOpen: true,
      };

    case 'CLOSE_CHAT':
      return {
        ...state,
        isOpen: false,
      };

    case 'SET_CURRENT_MESSAGE':
      return {
        ...state,
        currentMessage: action.payload,
      };

    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: action.payload,
      };

    case 'SET_TYPING':
      return {
        ...state,
        isTyping: action.payload,
      };

    case 'SET_SESSION_ID':
      return {
        ...state,
        sessionId: action.payload,
      };

    case 'SET_METADATA':
      return {
        ...state,
        metadata: { ...state.metadata, ...action.payload },
      };

    case 'SET_SOCKET':
      return {
        ...state,
        socket: action.payload,
      };

    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case 'ADD_GREETING_MESSAGE':
      return {
        ...state,
        messages: [action.payload],
      };

    case 'UPDATE_STREAMING_MESSAGE':
      const lastMessage = state.messages[state.messages.length - 1];
      
      if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
        // Update existing streaming message
        return {
          ...state,
          messages: state.messages.map((msg, index) => 
            index === state.messages.length - 1 
              ? { 
                  ...msg, 
                  content: msg.content + action.payload.content, 
                  isStreaming: !action.payload.isComplete 
                }
              : msg
          ),
        };
      } else {
        // No existing streaming message, create new one
        const newStreamingMessage: ChatMessage = {
          id: crypto.randomUUID(),
          content: action.payload.content,
          role: 'assistant',
          timestamp: new Date(),
          isStreaming: !action.payload.isComplete,
        };
        return {
          ...state,
          messages: [...state.messages, newStreamingMessage],
        };
      }

    case 'CREATE_STREAMING_MESSAGE':
      // Only create if there's no existing streaming message
      const currentLastMessage = state.messages[state.messages.length - 1];
      if (currentLastMessage && currentLastMessage.role === 'assistant' && currentLastMessage.isStreaming) {
        return state; // Don't create, there's already a streaming message
      }
      
      const newStreamingMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: action.payload.content,
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: !action.payload.isComplete,
      };
      return {
        ...state,
        messages: [...state.messages, newStreamingMessage],
      };

    case 'COMPLETE_STREAMING':
      return {
        ...state,
        messages: state.messages.map(msg => ({ ...msg, isStreaming: false })),
      };

    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
      };

    case 'RESET_CHAT':
      return {
        ...initialChatState,
      };

    default:
      return state;
  }
}
