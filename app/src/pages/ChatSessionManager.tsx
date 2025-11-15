import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    Grid,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Alert,
    Fab,
    Stack,
} from '@mui/material';
import {
    Add as AddIcon,
    Chat as ChatIcon,
    Delete as DeleteIcon,
    AccessTime as TimeIcon,
    Message as MessageIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { generateChatId } from '@/utils/chatUtils';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import HistoryPanel from '@/components/HistoryPanel';

interface ChatSession {
    sessionId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
    isActive: boolean;
    lastMessage?: string;
}

/**
 * ChatSessionManager - Componente para gerenciar sessões de chat
 * 
 * Funcionalidades:
 * - Lista sessões existentes do usuário (via API do DynamoDB)
 * - Permite criar nova sessão
 * - Permite navegar para sessão existente
 * - Permite deletar sessões antigas
 */
const ChatSessionManager: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // Hook para buscar histórico via API
    const { sessions: apiSessions, loading: apiLoading, error: apiError, refetch } = useSessionHistory();
    
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newSessionTitle, setNewSessionTitle] = useState('');
    const [creatingSession, setCreatingSession] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();

    // ✅ FIX: Memoizar loadSessionsFromStorage para evitar recriação
    const loadSessionsFromStorage = useCallback(async (): Promise<ChatSession[]> => {
        const sessions: ChatSession[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('chat_session_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key) || '{}');
                    const sessionId = data.sessionId || key.replace('chat_session_', '');
                    
                    sessions.push({
                        sessionId,
                        title: data.title || 'Chat Session',
                        createdAt: data.createdAt || new Date().toISOString(),
                        updatedAt: data.updatedAt || new Date().toISOString(),
                        messageCount: data.messages?.length || 0,
                        isActive: true,
                        lastMessage: data.messages?.[data.messages.length - 1]?.content?.slice(0, 100)
                    });
                } catch (error) {
                    console.warn('Error parsing session data:', key, error);
                }
            }
        }
        
        return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, []); // ✅ Sem dependências, função estável

    // Atualiza sessões quando os dados da API chegam
    useEffect(() => {
        // ✅ FIX: Função async dentro do useEffect para evitar warnings
        const updateSessions = async () => {
            if (apiSessions && apiSessions.length > 0) {
                const mappedSessions: ChatSession[] = apiSessions.map(session => ({
                    sessionId: session.sessionId,
                    title: session.summary.substring(0, 50) + '...',
                    createdAt: session.startTime.toISOString(),
                    updatedAt: session.lastUpdated.toISOString(),
                    messageCount: session.messageCount,
                    isActive: true,
                    lastMessage: session.summary
                }));
                setSessions(mappedSessions);
            } else if (!apiLoading && !apiError) {
                // Fallback para localStorage se API não retornar nada
                const localSessions = await loadSessionsFromStorage();
                setSessions(localSessions);
            }
            setLoading(apiLoading);
            setError(apiError);
        };

        updateSessions();
    }, [apiSessions, apiLoading, apiError, loadSessionsFromStorage]); // ✅ Todas as dependências incluídas

    const loadSessions = async () => {
        // Agora usa refetch do hook
        refetch();
    };

    // ✅ loadSessionsFromStorage agora está definido acima com useCallback

    const handleCreateNewSession = async () => {
        try {
            setCreatingSession(true);
            const sessionId = generateChatId();
            
            // Navega direto para a nova sessão
            navigate(`/chat/session/${sessionId}`);
        } catch (error) {
            console.error('Error creating session:', error);
            setError('Erro ao criar nova sessão');
        } finally {
            setCreatingSession(false);
            setCreateDialogOpen(false);
            setNewSessionTitle('');
        }
    };

    const handleOpenSession = (sessionId: string) => {
        navigate(`/chat/session/${sessionId}`);
    };

    const handleDeleteSession = async (sessionId: string) => {
        try {
            // Remove do localStorage
            localStorage.removeItem(`chat_session_${sessionId}`);
            
            // TODO: Implementar chamada API para deletar sessão
            
            // Atualiza a lista
            setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
        } catch (error) {
            console.error('Error deleting session:', error);
            setError('Erro ao deletar sessão');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Hoje';
        } else if (diffDays === 1) {
            return 'Ontem';
        } else if (diffDays < 7) {
            return `${diffDays} dias atrás`;
        } else {
            return date.toLocaleDateString('pt-BR');
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress size={60} />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box mb={4}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Suas Conversas
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Gerencie suas sessões de chat com o AIR Discovery
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Quick Create Button */}
            <Box mb={4}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={handleCreateNewSession}
                    disabled={creatingSession}
                    sx={{ minWidth: 200 }}
                >
                    {creatingSession ? 'Criando...' : 'Nova Conversa'}
                </Button>
            </Box>

            {/* Histórico usando o novo componente HistoryPanel */}
            {apiSessions && apiSessions.length > 0 && (
                <Box mb={4}>
                    <HistoryPanel
                        sessions={apiSessions}
                        loading={apiLoading}
                        error={apiError}
                        onRefresh={refetch}
                        onSessionSelect={handleOpenSession}
                        selectedSessionId={selectedSessionId}
                    />
                </Box>
            )}

            {/* Sessions Grid (mantido para compatibilidade) */}
            {sessions.length > 0 && !apiSessions.length ? (
                <Grid container spacing={3}>
                    {sessions.map((session) => (
                        <Grid item xs={12} sm={6} md={4} key={session.sessionId}>
                            <Card 
                                sx={{ 
                                    height: '100%', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: 3,
                                    }
                                }}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                                        <ChatIcon color="primary" />
                                        <Typography variant="h6" component="h2" noWrap>
                                            {session.title}
                                        </Typography>
                                    </Box>
                                    
                                    <Stack direction="row" spacing={1} mb={2}>
                                        <Chip 
                                            icon={<MessageIcon />} 
                                            label={`${session.messageCount} mensagens`} 
                                            size="small" 
                                            variant="outlined"
                                        />
                                        <Chip 
                                            icon={<TimeIcon />} 
                                            label={formatDate(session.updatedAt)} 
                                            size="small" 
                                            variant="outlined"
                                        />
                                    </Stack>

                                    {session.lastMessage && (
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary" 
                                            sx={{ 
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {session.lastMessage}...
                                        </Typography>
                                    )}
                                </CardContent>
                                
                                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                                    <Button 
                                        variant="contained" 
                                        size="small"
                                        onClick={() => handleOpenSession(session.sessionId)}
                                    >
                                        Continuar
                                    </Button>
                                    
                                    <IconButton 
                                        size="small" 
                                        color="error"
                                        onClick={() => handleDeleteSession(session.sessionId)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Box textAlign="center" py={6}>
                    <ChatIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" gutterBottom color="text.secondary">
                        Nenhuma conversa encontrada
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        Comece uma nova conversa para descobrir destinos incríveis!
                    </Typography>
                    <Button 
                        variant="contained" 
                        size="large" 
                        startIcon={<AddIcon />}
                        onClick={handleCreateNewSession}
                        disabled={creatingSession}
                    >
                        {creatingSession ? 'Criando...' : 'Primeira Conversa'}
                    </Button>
                </Box>
            )}

            {/* Create Session Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
                <DialogTitle>Nova Conversa</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Título da Conversa (opcional)"
                        fullWidth
                        variant="outlined"
                        value={newSessionTitle}
                        onChange={(e) => setNewSessionTitle(e.target.value)}
                        placeholder="Ex: Viagem para Europa"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleCreateNewSession} 
                        variant="contained"
                        disabled={creatingSession}
                    >
                        {creatingSession ? 'Criando...' : 'Criar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ChatSessionManager;