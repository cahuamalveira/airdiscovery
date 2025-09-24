/**
 * Chat state reducer with clean architecture and immutable updates
 */

import { ChatMessage, StreamChunk, UserProfile } from '../types/chat';

export interface ChatActionsState {
  readonly messages: readonly ChatMessage[];
  readonly currentMessage: string;
  readonly isConnected: boolean;
  readonly isTyping: boolean;
  readonly sessionId: string | null;
  readonly error: string | null;
}

export type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_CURRENT_MESSAGE'; payload: string }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_SESSION_ID'; payload: string | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'UPDATE_STREAM_CHUNK'; payload: StreamChunk };

export const initialChatState: ChatActionsState = {
  messages: [],
  currentMessage: '',
  isConnected: false,
  isTyping: false,
  sessionId: null,
  error: null
};

export function chatReducer(
  state: ChatActionsState, 
  action: ChatAction
): ChatActionsState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        error: null
      };

    case 'SET_CURRENT_MESSAGE':
      return {
        ...state,
        currentMessage: action.payload
      };

    case 'SET_TYPING':
      return {
        ...state,
        isTyping: action.payload
      };

    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: action.payload,
        error: action.payload ? null : state.error // Clear error on successful connection
      };

    case 'SET_SESSION_ID':
      return {
        ...state,
        sessionId: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isTyping: action.payload ? false : state.isTyping // Stop typing on error
      };

    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
        currentMessage: '',
        isTyping: false,
        error: null
      };

    case 'UPDATE_STREAM_CHUNK':
      // Handle streaming updates - this could be used for real-time typing indicators
      return {
        ...state,
        error: action.payload.metadata?.error || null
      };

    default:
      return state;
  }
}

/**
 * Selectors for derived state
 */

export function selectLastMessage(state: ChatActionsState): ChatMessage | null {
  return state.messages.length > 0 ? state.messages[state.messages.length - 1] : null;
}

export function selectLastUserMessage(state: ChatActionsState): ChatMessage | null {
  const userMessages = state.messages.filter(msg => msg.role === 'user');
  return userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
}

export function selectLastAssistantMessage(state: ChatActionsState): ChatMessage | null {
  const assistantMessages = state.messages.filter(msg => msg.role === 'assistant');
  return assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : null;
}

export function selectCanSendMessage(state: ChatActionsState): boolean {
  return (
    state.currentMessage.trim().length > 0 &&
    state.isConnected &&
    !state.isTyping &&
    state.sessionId !== null &&
    !state.error
  );
}

export function selectMessageCount(state: ChatActionsState): number {
  return state.messages.length;
}

export function selectUserMessageCount(state: ChatActionsState): number {
  return state.messages.filter(msg => msg.role === 'user').length;
}

export function selectIsSessionActive(state: ChatActionsState): boolean {
  return state.sessionId !== null && state.isConnected;
}

export function selectHasError(state: ChatActionsState): boolean {
  return state.error !== null;
}