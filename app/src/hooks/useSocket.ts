import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChatAction, ChatMessage } from '../reducers/chatReducer';

interface UseSocketParams {
    isOpen: boolean;
    user: any;
    socket: Socket | null;
    dispatch: React.Dispatch<ChatAction>;
}

export const useSocket = ({ isOpen, user, socket, dispatch }: UseSocketParams) => {
    useEffect(() => {
        // Só inicializar se não tiver socket e as condições estiverem atendidas
        if (!isOpen || !user) {
            return;
        }

        // Se já tem socket, não criar outro
        if (socket) {
            return;
        }

        // Obter token do usuário de forma mais direta
        const token = user.accessToken || 'temp-token-for-dev';

        console.log('🚀 Attempting to connect to WebSocket:', `${import.meta.env.VITE_API_URL}/chat`);
        console.log('🔑 Using token:', token ? 'Token present' : 'No token');

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

        // Set socket in state
        dispatch({ type: 'SET_SOCKET', payload: newSocket });

        // Connection handlers
        newSocket.on('connect', () => {
            console.log('✅ Connected to chat server');
            console.log('Socket ID:', newSocket.id);
            console.log('Socket connected:', newSocket.connected);
            dispatch({ type: 'SET_CONNECTED', payload: true });

            // Start chat session
            setTimeout(() => {
                console.log('⏳ Waiting before starting chat session...');
                console.log('📡 Emitting startChat event...');

                newSocket.emit('startChat', {}, (response: { sessionId: string }) => {
                    console.log('📝 Chat session started:', response);
                    dispatch({ type: 'SET_SESSION_ID', payload: response.sessionId });

                    // Add initial greeting message
                    const greetingMessage: ChatMessage = {
                        id: crypto.randomUUID(),
                        content: 'Olá! Sou seu assistente de viagem da AIR Discovery e estou aqui para te ajudar a encontrar o destino perfeito! 🌍✈️ Para começar, me conta: que tipo de atividades você mais gosta de fazer quando está de férias?',
                        role: 'assistant',
                        timestamp: new Date()
                    };
                    dispatch({ type: 'ADD_GREETING_MESSAGE', payload: greetingMessage });

                }, 1000); // Espera 1 segundo para garantir que o servidor esteja pronto
            });
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from chat server. Reason:', reason);
            dispatch({ type: 'SET_CONNECTED', payload: false });
        });

        newSocket.on('connect_error', (error) => {
            console.error('🔥 Connection error:', error);
            console.error('Error details:', {
                message: error.message,
                description: (error as any).description,
                context: (error as any).context,
                type: (error as any).type,
            });
            dispatch({ type: 'SET_CONNECTED', payload: false });
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log('🔄 Reconnected after', attemptNumber, 'attempts');
        });

        newSocket.on('reconnect_error', (error) => {
            console.error('🔄❌ Reconnection error:', error);
        });

        newSocket.on('reconnect_failed', () => {
            console.error('🔄💀 Reconnection failed completely');
        });

        // Message handlers
        newSocket.on('chatChunk', (chunk: { content: string; isComplete: boolean; metadata?: any }) => {
            dispatch({ type: 'SET_TYPING', payload: !chunk.isComplete });

            if (chunk.metadata) {
                dispatch({ type: 'SET_METADATA', payload: chunk.metadata });
            }

            if (chunk.content) {
                // This action will either update existing streaming message or create a new one
                dispatch({ type: 'UPDATE_STREAMING_MESSAGE', payload: chunk });
            }

            if (chunk.isComplete) {
                dispatch({ type: 'COMPLETE_STREAMING' });
            }
        });

        // Handle complete chat responses (non-streaming)
        newSocket.on('chatResponse', (response: { 
            content: string; 
            sessionId: string; 
            metadata?: any; 
            isComplete?: boolean;
        }) => {
            console.log('📨 Received chatResponse:', response);
            
            // Handle streaming response similar to chatChunk
            dispatch({ type: 'SET_TYPING', payload: !response.isComplete });

            // Update metadata if provided
            if (response.metadata) {
                dispatch({ type: 'SET_METADATA', payload: response.metadata });
            }

            // Handle streaming content
            if (response.content) {
                // This action will either update existing streaming message or create a new one
                dispatch({ type: 'UPDATE_STREAMING_MESSAGE', payload: {
                    content: response.content,
                    isComplete: response.isComplete || false
                }});
            }

            // When streaming is complete
            if (response.isComplete) {
                dispatch({ type: 'COMPLETE_STREAMING' });
            }

            // Update session ID if provided
            if (response.sessionId) {
                dispatch({ type: 'SET_SESSION_ID', payload: response.sessionId });
            }
        });

        // Handle chat ended event
        newSocket.on('chatEnded', (data: { message: string; profile?: any }) => {
            console.log('🏁 Chat session ended:', data);
            
            // Add final message if provided
            if (data.message) {
                const endMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    content: data.message,
                    role: 'assistant',
                    timestamp: new Date(),
                    isStreaming: false
                };
                dispatch({ type: 'ADD_MESSAGE', payload: endMessage });
            }
            
            // Set typing to false and clear session
            dispatch({ type: 'SET_TYPING', payload: false });
            dispatch({ type: 'SET_SESSION_ID', payload: null });
        });

        // Handle session status updates
        newSocket.on('sessionStatus', (status: { 
            hasActiveSession: boolean; 
            sessionId?: string; 
            interviewComplete?: boolean;
            messageCount?: number;
        }) => {
            console.log('📊 Session status:', status);
            
            if (status.sessionId) {
                dispatch({ type: 'SET_SESSION_ID', payload: status.sessionId });
            }
            
            if (status.interviewComplete !== undefined) {
                dispatch({ type: 'SET_METADATA', payload: { 
                    interviewComplete: status.interviewComplete 
                }});
            }
        });

        newSocket.on('error', (error: any) => {
            console.error('Chat error:', error);
        });

        // Cleanup function
        return () => {
            console.log('🧹 Cleaning up socket connection');
            newSocket.disconnect();
            dispatch({ type: 'SET_SOCKET', payload: null });
        };
    }, [isOpen, user]); // Removido socket e dispatch das dependências
};
