import { User } from '../contexts/AuthContext';

// Types para as actions do reducer
export type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ATTRIBUTES_LOADING'; payload: boolean }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ADMIN'; payload: boolean }
  | { type: 'SET_USER_ATTRIBUTES'; payload: Record<string, string> | null }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; isAdmin: boolean } }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_ERROR' };

// Estado do reducer
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  userAttributes: Record<string, string> | null;
  attributesLoading: boolean;
}

// Estado inicial
export const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  isAdmin: false,
  loading: true,
  userAttributes: null,
  attributesLoading: false,
};

// Reducer
export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    
    case 'SET_ATTRIBUTES_LOADING':
      return {
        ...state,
        attributesLoading: action.payload,
      };
    
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        isAuthenticated: action.payload,
      };
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
      };
    
    case 'SET_ADMIN':
      return {
        ...state,
        isAdmin: action.payload,
      };
    
    case 'SET_USER_ATTRIBUTES':
      return {
        ...state,
        userAttributes: action.payload,
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        isAdmin: action.payload.isAdmin,
        loading: false,
      };
    
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isAdmin: false,
        userAttributes: null,
        loading: false,
      };
    
    case 'AUTH_ERROR':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isAdmin: false,
        loading: false,
      };
    
    default:
      return state;
  }
};

export default authReducer;
