import { AuthUIState, AuthFlowState } from '../types/auth';

/**
 * Actions para o reducer de Auth UI
 */
export type AuthUIAction =
  | { type: 'START_LOADING' }
  | { type: 'STOP_LOADING' }
  | { type: 'SHOW_ERROR'; payload: string }
  | { type: 'SHOW_SUCCESS'; payload: string }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'TRANSITION_TO'; payload: { state: AuthFlowState; email?: string } }
  | { type: 'HANDLE_CONFIRMATION_REQUIRED'; payload: string }
  | { type: 'RESET_STATE' }
  | { type: 'UPDATE_STATE'; payload: Partial<AuthUIState> };

/**
 * Estado inicial do Auth UI
 */
export const initialAuthUIState: AuthUIState = {
  currentState: 'signIn',
  pendingEmail: '',
  isLoading: false,
  error: '',
  success: '',
};

/**
 * Reducer para gerenciar o estado da UI de autenticação
 * 
 * Benefícios do useReducer vs useState:
 * - Transições de estado previsíveis
 * - Lógica centralizada
 * - Melhor performance (menos re-renders)
 * - Debugging mais fácil
 * - Testabilidade superior
 */
export const authUIReducer = (state: AuthUIState, action: AuthUIAction): AuthUIState => {
  switch (action.type) {
    case 'START_LOADING':
      return {
        ...state,
        isLoading: true,
        error: '',
        success: '',
      };

    case 'STOP_LOADING':
      return {
        ...state,
        isLoading: false,
      };

    case 'SHOW_ERROR':
      return {
        ...state,
        error: action.payload,
        success: '',
        isLoading: false,
      };

    case 'SHOW_SUCCESS':
      return {
        ...state,
        success: action.payload,
        error: '',
        isLoading: false,
      };

    case 'CLEAR_MESSAGES':
      return {
        ...state,
        error: '',
        success: '',
      };

    case 'TRANSITION_TO':
      return {
        ...state,
        currentState: action.payload.state,
        pendingEmail: action.payload.email || state.pendingEmail,
        error: '',
        success: '',
      };

    case 'HANDLE_CONFIRMATION_REQUIRED':
      return {
        ...state,
        currentState: 'confirmSignUp',
        pendingEmail: action.payload,
        error: 'Email não confirmado. Verifique sua caixa de entrada.',
        isLoading: false,
      };

    case 'RESET_STATE':
      return initialAuthUIState;

    case 'UPDATE_STATE':
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
};
