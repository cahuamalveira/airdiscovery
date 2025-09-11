import { useReducer, useCallback } from 'react';
import { 
  AuthFlowState, 
  CognitoErrorType, 
  AUTH_ERROR_MESSAGES 
} from '../types/auth';
import { 
  authUIReducer, 
  initialAuthUIState, 
  AuthUIAction 
} from '../reducers/authUIReducer';

/**
 * Hook personalizado para gerenciar o estado da UI de autenticação
 * Refatorado para usar useReducer ao invés de useState
 * 
 * Benefícios:
 * - Transições de estado mais previsíveis
 * - Melhor performance (menos re-renders)
 * - Lógica centralizada no reducer
 * - Debugging facilitado
 * - Testabilidade superior
 */
export const useAuthUI = () => {
  const [uiState, dispatch] = useReducer(authUIReducer, initialAuthUIState);

  // Função para iniciar loading
  const startLoading = useCallback(() => {
    dispatch({ type: 'START_LOADING' });
  }, []);

  // Função para parar loading
  const stopLoading = useCallback(() => {
    dispatch({ type: 'STOP_LOADING' });
  }, []);

  // Função para mostrar erro com tratamento inteligente
  const showError = useCallback((error: any) => {
    let errorMessage = 'Erro inesperado. Tente novamente.';
    
    if (error.name && AUTH_ERROR_MESSAGES[error.name as CognitoErrorType]) {
      errorMessage = AUTH_ERROR_MESSAGES[error.name as CognitoErrorType];
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    dispatch({ type: 'SHOW_ERROR', payload: errorMessage });
  }, []);

  // Função para mostrar sucesso
  const showSuccess = useCallback((message: string) => {
    dispatch({ type: 'SHOW_SUCCESS', payload: message });
  }, []);

  // Função para limpar mensagens
  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);

  // Função para transição de estado
  const transitionTo = useCallback((newState: AuthFlowState, email?: string) => {
    dispatch({ 
      type: 'TRANSITION_TO', 
      payload: { state: newState, email } 
    });
  }, []);

  // Função para tratar erro específico de confirmação necessária
  const handleConfirmationRequired = useCallback((email: string) => {
    dispatch({ type: 'HANDLE_CONFIRMATION_REQUIRED', payload: email });
  }, []);

  // Função para reset completo do estado
  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Função para atualizações parciais do estado (caso necessário)
  const updateUIState = useCallback((updates: Partial<typeof uiState>) => {
    dispatch({ type: 'UPDATE_STATE', payload: updates });
  }, []);

  return {
    uiState,
    dispatch, // Expor dispatch para casos avançados
    startLoading,
    stopLoading,
    showError,
    showSuccess,
    clearMessages,
    transitionTo,
    handleConfirmationRequired,
    resetState,
    updateUIState,
  };
};
