/**
 * Tipos específicos para autenticação
 */

// Estados possíveis do fluxo de autenticação
export type AuthFlowState = 'signIn' | 'signUp' | 'confirmSignUp' | 'forgotPassword';

// Interface para o estado da UI de autenticação
export interface AuthUIState {
  currentState: AuthFlowState;
  pendingEmail: string;
  isLoading: boolean;
  error: string;
  success: string;
}

// Tipos para dados de formulário (derivados dos schemas Zod)
export interface SignInFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  name: string;
  email: string;
  password: string;
}

export interface ConfirmationFormData {
  confirmationCode: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  email: string;
  confirmationCode: string;
  newPassword: string;
}

// Tipos para erros específicos do AWS Cognito
export type CognitoErrorType = 
  | 'UserNotConfirmedException'
  | 'NotAuthorizedException'
  | 'UsernameExistsException'
  | 'InvalidPasswordException'
  | 'CodeMismatchException'
  | 'UserNotFoundException'
  | 'LimitExceededException'
  | 'TooManyRequestsException';

// Interface para erro estruturado
export interface AuthError {
  name: CognitoErrorType;
  message: string;
  code?: string;
}

// Configurações de validação
export interface ValidationConfig {
  minPasswordLength: number;
  passwordRegex: RegExp;
  minNameLength: number;
  minCodeLength: number;
}

// Constantes de validação padrão
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  minPasswordLength: 8,
  passwordRegex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  minNameLength: 2,
  minCodeLength: 6,
};

// Mensagens de erro padronizadas
export const AUTH_ERROR_MESSAGES: Record<CognitoErrorType, string> = {
  UserNotConfirmedException: 'Email não confirmado. Verifique sua caixa de entrada.',
  NotAuthorizedException: 'Email ou senha incorretos.',
  UsernameExistsException: 'Este email já está em uso.',
  InvalidPasswordException: 'Senha não atende aos critérios de segurança.',
  CodeMismatchException: 'Código de confirmação inválido.',
  UserNotFoundException: 'Usuário não encontrado.',
  LimitExceededException: 'Muitas tentativas. Tente novamente mais tarde.',
  TooManyRequestsException: 'Muitas solicitações. Aguarde antes de tentar novamente.',
};
