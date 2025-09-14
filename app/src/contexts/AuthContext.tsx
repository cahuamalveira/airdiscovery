import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { signIn, getCurrentUser, fetchAuthSession, signUp, confirmSignUp, resendSignUpCode, fetchUserAttributes, AuthUser } from 'aws-amplify/auth';
import { authReducer, initialAuthState } from '../reducers/authReducer';
import '../config/amplify';

export interface User {
    id: string;
    name: string;
    email: string;
    isAdmin?: boolean;
    groups?: string[];
    username?: string;
    phoneNumber?: string;
    attributes?: Record<string, string>;
    accessToken?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignUpData {
    name: string;
    email: string;
    password: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    // Funções originais (mantidas para compatibilidade)
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    signUp: (data: SignUpData) => Promise<void>;
    confirmSignUp: (email: string, code: string) => Promise<void>;
    resendConfirmationCode: (email: string) => Promise<void>;
    getAccessToken: () => Promise<string | null>;
    userAttributes: Record<string, string> | null; // Atributos completos do usuário
    attributesLoading: boolean; // Loading específico para atributos
}

// Definir tipos para as props do provider
interface AuthProviderProps {
    user: AuthUser | null;
    signOut: (() => void) | undefined;
    children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Provedor do contexto de autenticação
export const AuthProvider: React.FC<AuthProviderProps> = ({ children, user, signOut }) => {
    const [state, dispatch] = useReducer(authReducer, initialAuthState);
    
    const {
        isAuthenticated,
        isAdmin,
        loading,
        userAttributes,
        attributesLoading
    } = state;

    // Verificar se o usuário já está autenticado ao carregar a página
    useEffect(() => {
        checkAuthState();
    }, [user]); // Dependência do amplifyUser para atualizar quando mudar

    // Buscar atributos do usuário quando estiver autenticado
    useEffect(() => {
        if (user && isAuthenticated) {
            fetchUserAttributesData();
        } else {
            dispatch({ type: 'SET_USER_ATTRIBUTES', payload: null });
        }
    }, [user, isAuthenticated]);

    const fetchUserAttributesData = async () => {
        try {
            dispatch({ type: 'SET_ATTRIBUTES_LOADING', payload: true });
            const attributes = await fetchUserAttributes();
            dispatch({ type: 'SET_USER_ATTRIBUTES', payload: attributes as Record<string, string> });
        } catch (error) {
            console.error('Erro ao buscar atributos do usuário:', error);
            dispatch({ type: 'SET_USER_ATTRIBUTES', payload: null });
        } finally {
            dispatch({ type: 'SET_ATTRIBUTES_LOADING', payload: false });
        }
    };

    const checkAuthState = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            if (user) {
                const session = await fetchAuthSession();

                if (session.tokens) {
                    const groups = session.tokens.accessToken.payload['cognito:groups'] as string[] || [];
                    const isUserAdmin = groups.includes('admins');

                    // Melhorar o userData com informações dos atributos quando disponíveis
                    const userData: User = {
                        id: user.userId,
                        email: user.signInDetails?.loginId || user.username || '',
                        name: user.username, // Será atualizado com atributos depois
                        username: user.username,
                        isAdmin: isUserAdmin,
                        groups: groups,
                        attributes: userAttributes || undefined,
                        accessToken: session.tokens?.accessToken?.toString() || undefined,
                    };

                    console.log({ userData })

                    // Se temos atributos, usar o nome real
                    if (userAttributes?.name) {
                        userData.name = userAttributes.name;
                    }
                    if (userAttributes?.email) {
                        userData.email = userAttributes.email;
                    }
                    if (userAttributes?.phone_number) {
                        userData.phoneNumber = userAttributes.phone_number;
                    }

                    dispatch({ type: 'AUTH_SUCCESS', payload: { user: userData, isAdmin: isUserAdmin } });
                    return;
                }
            }

            const currentUser = await getCurrentUser();
            const session = await fetchAuthSession();

            if (currentUser && session.tokens) {
                const groups = session.tokens.accessToken.payload['cognito:groups'] as string[] || [];
                const isUserAdmin = groups.includes('admins');

                const userData: User = {
                    id: currentUser.userId,
                    email: currentUser.signInDetails?.loginId || '',
                    name: currentUser.username,
                    username: currentUser.username,
                    isAdmin: isUserAdmin,
                    groups: groups,
                    accessToken: session.tokens?.accessToken?.toString() || undefined,
                };

                dispatch({ type: 'AUTH_SUCCESS', payload: { user: userData, isAdmin: isUserAdmin } });
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
            // Usuário não está autenticado
            dispatch({ type: 'AUTH_ERROR' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const handleLogin = async (credentials: LoginCredentials): Promise<void> => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const signInResult = await signIn({
                username: credentials.email,
                password: credentials.password,
            });

            console.log('SignIn Result:', signInResult);

            if (signInResult.isSignedIn) {
          //      await checkAuthState();
            }
        } catch (error) {

            if ((error as Error).message === "There is already a signed in user.") {
               await checkAuthState();
            } else {
                throw error;
            }
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const handleLogout = async (): Promise<void> => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            signOut?.();

            dispatch({ type: 'AUTH_LOGOUT' });
        } catch (error) {
            console.error('Error during sign out:', error);
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const handleSignUp = async (data: SignUpData): Promise<void> => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            await signUp({
                username: data.email,
                password: data.password,
                options: {
                    userAttributes: {
                        email: data.email,
                        given_name: data.name,
                    },
                },
            });
        } catch (error) {
            console.error('Error during sign up:', error);
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const handleConfirmSignUp = async (email: string, code: string): Promise<void> => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            await confirmSignUp({
                username: email,
                confirmationCode: code,
            });
        } catch (error) {
            console.error('Error during confirmation:', error);
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const handleResendConfirmationCode = async (email: string): Promise<void> => {
        try {
            await resendSignUpCode({
                username: email,
            });
        } catch (error) {
            console.error('Error resending confirmation code:', error);
            throw error;
        }
    };

    const getAccessToken = async (): Promise<string | null> => {
        try {
            const session = await fetchAuthSession();
            return session.tokens?.accessToken?.toString() || null;
        } catch (error) {
            console.error('Error getting access token:', error);
            return null;
        }
    };

    const value: AuthContextType = {
        isAuthenticated,
        user: state.user,
        isAdmin,
        loading,
        login: handleLogin,
        logout: handleLogout,
        signUp: handleSignUp,
        confirmSignUp: handleConfirmSignUp,
        resendConfirmationCode: handleResendConfirmationCode,
        getAccessToken,
        // Novos campos integrados do Amplify
        userAttributes,
        attributesLoading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
