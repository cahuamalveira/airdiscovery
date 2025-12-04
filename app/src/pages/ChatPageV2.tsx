import React, { useEffect, useRef, useState } from 'react';
import {
    Box,
    Container,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    CircularProgress,
    Alert,
    Button,
    Paper,
    useTheme,
    Fab,
    LinearProgress,
    Chip,
    Stack,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Refresh as RefreshIcon,
    Chat as ChatIcon,
    Person as PersonIcon,
    CheckCircle as CheckCircleIcon,
    FlightTakeoff as FlightIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { ChatErrorBoundary } from '@/components/chat/ChatErrorBoundary';
import { MessageInput } from '@/components/chat/MessageInput';
import { MessageList } from '@/components/chat/MessageList';
import { JsonChatProgress } from '@/components/chat/JsonChatProgress';
import { JsonChatRecommendations } from '@/components/chat/JsonChatRecommendations';
import { ChatButtons } from '@/components/chat/ChatButtons';
import { useAuth } from '@/contexts/AuthContext';
import { useJsonChatProgress, useJsonChatFormatters } from '@/hooks/useJsonChat';
import { useJsonSocketConnection } from '@/hooks/useJsonSocketConnection';
import { JsonChatUtils, getButtonOptionsForStage } from '@/types/json-chat';
import { generateChatId, isValidChatId, createChatUrl } from '@/utils/chatUtils';
import { createRecommendationsUrl, createDefaultTravelParams } from '@/utils/navigationUtils';

/**
 * ChatPageV2 - Nova versão com arquitetura JSON estruturada
 * 
 * Funcionalidades:
 * - Respostas JSON estruturadas do LLM
 * - Extração confiável de dados sem regex
 * - Progresso visual em tempo real
 * - State management robusto
 * - Recomendações estruturadas
 * - Debug info avançado
 */
const ChatPageV2: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { sessionId } = useParams<{ sessionId: string }>();
    const { user } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(true);
    const [hasActiveButtons, setHasActiveButtons] = useState(false);

    // Hook de conexão JSON - agora autocontido e completo
    const {
        state,
        sendMessage,
        resetChat,
        startNewSession,
        isReady
    } = useJsonSocketConnection({
        isOpen,
        user,
        chatId: sessionId
    });

    // Hooks auxiliares
    const progressInfo = useJsonChatProgress(state);
    const formatters = useJsonChatFormatters();

    // Calcula progresso e recomendação
    const progress = JsonChatUtils.calculateProgress(state.collectedData);
    const recommendation = JsonChatUtils.extractRecommendation(state.collectedData);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [state.messages]);

    // Generate button options based on current stage and collected data
    // This is the source of truth - NOT the LLM response
    const frontendButtonOptions = getButtonOptionsForStage(state.currentStage, state.collectedData);

    // Check if we should show buttons (frontend-generated takes priority)
    useEffect(() => {
        const lastMessage = state.messages[state.messages.length - 1];
        const hasLLMButtons = !!(lastMessage?.role === 'assistant' && lastMessage.buttonOptions && lastMessage.buttonOptions.length > 0);
        const hasFrontendButtons = !!(frontendButtonOptions && frontendButtonOptions.length > 0);
        
        // Show buttons if either frontend or LLM provides them (frontend takes priority)
        setHasActiveButtons(hasFrontendButtons || hasLLMButtons);
    }, [state.messages, frontendButtonOptions]);

    // Handle sessionId validation and redirection
    useEffect(() => {
        if (!sessionId) {
            // If no sessionId in URL, redirect to chat session manager
            navigate('/chat', { replace: true });
            return;
        }

        // Validate sessionId format (basic validation)
        if (!isValidChatId(sessionId)) {
            console.warn('Invalid sessionId format, redirecting to session manager');
            navigate('/chat', { replace: true });
            return;
        }
    }, [sessionId, navigate]);

    // Handle sending messages
    const handleSendMessage = async (content: string) => {
        try {
            sendMessage(content);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    // Handle button click - send button label as user message and value to backend
    const handleButtonClick = (value: string, label: string) => {
        try {
            // Hide buttons immediately after click
            setHasActiveButtons(false);
            // Send the button label as the user's message
            sendMessage(label);
        } catch (error) {
            console.error('Failed to send button selection:', error);
        }
    };

    // Handle starting new chat
    const handleStartNewChat = async () => {
        try {
            // Navigate to session manager for new chat
            navigate('/chat');
        } catch (error) {
            console.error('Failed to start chat:', error);
        }
    };

    // Handle ending chat and navigate to recommendations
    const navigateToRecommendations = async () => {
        if (!recommendation) {
            console.warn('No recommendation available');
            return;
        }

        console.log('Navigating to recommendations with context:', {
            origin: recommendation.origin.iata,
            destination: recommendation.destination.iata,
            recommendation,
            collectedData: state.collectedData
        });

        // Calculate total adults from passenger composition
        const passengerComposition = state.collectedData.passenger_composition;
        const adults = passengerComposition?.adults || 1;
        
        // Calculate departure date from availability_months
        const availabilityMonths = state.collectedData.availability_months;
        let departureDate: string | undefined;
        
        if (availabilityMonths && availabilityMonths.length > 0) {
            // Use the first available month to calculate a departure date
            const monthName = availabilityMonths[0];
            const monthMap: Record<string, number> = {
                'Janeiro': 0, 'Fevereiro': 1, 'Março': 2, 'Abril': 3,
                'Maio': 4, 'Junho': 5, 'Julho': 6, 'Agosto': 7,
                'Setembro': 8, 'Outubro': 9, 'Novembro': 10, 'Dezembro': 11
            };
            
            const monthIndex = monthMap[monthName];
            if (monthIndex !== undefined) {
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth();
                
                // If the month is in the past, use next year
                const year = monthIndex < currentMonth ? currentYear + 1 : currentYear;
                
                // Set to the 15th of the month as a reasonable default
                const date = new Date(year, monthIndex, 15);
                departureDate = date.toISOString().split('T')[0];
            }
        }

        // Create travel params with collected data
        const travelParams = {
            origin: recommendation.origin.iata,
            destination: recommendation.destination.iata,
            departureDate: departureDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            adults,
            nonStop: false
        };

        console.log('Travel params:', travelParams);

        // Navigate using utility function for consistent URL building
        const recommendationsUrl = createRecommendationsUrl(travelParams);
        
        // Add sessionId to URL for checkout to access passenger data
        const urlWithSession = `${recommendationsUrl}&sessionId=${sessionId}`;
        
        console.log('Navigating to:', urlWithSession);
        navigate(urlWithSession);
    };

    // Handle refresh/retry
    const handleRetryConnection = () => {
        setIsOpen(false);
        setTimeout(() => setIsOpen(true), 1000);
    };

    // Show loading while connecting
    if (!state.isConnected && !state.error) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    gap: 2,
                }}
            >
                <CircularProgress size={60} />
                <Typography variant="h6" color="text.secondary">
                    Conectando ao chat...
                </Typography>
            </Box>
        );
    }

    // Show connection error
    if (state.error && !state.isConnected) {
        return (
            <Container maxWidth="md">
                <AppBar position="static" elevation={0}>
                    <Toolbar>
                        <IconButton
                            edge="start"
                            color="inherit"
                            onClick={() => navigate('/chat')}
                            sx={{ mr: 2 }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            Chat AIR Discovery
                        </Typography>
                    </Toolbar>
                </AppBar>

                <Box sx={{ mt: 4 }}>
                    <Alert
                        severity="error"
                        action={
                            <Button color="inherit" onClick={handleRetryConnection}>
                                Tentar Novamente
                            </Button>
                        }
                    >
                        <Typography variant="h6" gutterBottom>
                            Erro de Conexão
                        </Typography>
                        <Typography variant="body2">
                            {state.error}
                        </Typography>
                    </Alert>
                </Box>
            </Container>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Header */}
            <AppBar position="static" elevation={0}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => navigate('/chat')}
                        sx={{ mr: 2 }}
                    >
                        <ArrowBackIcon />
                    </IconButton>

                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Chat AIR Discovery
                    </Typography>

                    {/* Progress indicator */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                        <Typography variant="caption">
                            {progress.percentage}%
                        </Typography>
                        <Box
                            sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: state.isConnected ? 'success.main' : 'error.main',
                            }}
                        />
                    </Box>

                    <Typography variant="body2">
                        {state.isConnected ? 'Conectado' : 'Desconectado'}
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Progress Bar */}
            {state.sessionId && (
                <Box sx={{ px: 2, py: 1 }}>
                    <LinearProgress 
                        variant="determinate" 
                        value={progress.percentage} 
                        sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {progressInfo.stageDescription} ({progress.current}/{progress.total})
                    </Typography>
                </Box>
            )}

            {/* Main content */}
            <Container maxWidth="lg" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', py: 2 }}>
                
                {/* Progress Card */}
                {state.sessionId && (
                    <JsonChatProgress 
                        state={state} 
                        showDetails={true} 
                        compact={false} 
                    />
                )}

                {/* Collected Data Summary */}
                {state.sessionId && (
                    <Box sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {state.collectedData.origin_name && (
                                <Chip
                                    icon={<CheckCircleIcon />}
                                    label={`Origem: ${state.collectedData.origin_name} (${state.collectedData.origin_iata})`}
                                    variant="outlined"
                                    color="success"
                                    size="small"
                                />
                            )}
                            {state.collectedData.budget_in_brl && (
                                <Chip
                                    icon={<CheckCircleIcon />}
                                    label={`Orçamento: ${formatters.formatBudget(state.collectedData.budget_in_brl)}`}
                                    variant="outlined"
                                    color="success"
                                    size="small"
                                />
                            )}
                            {state.collectedData.activities && (
                                <Chip
                                    icon={<CheckCircleIcon />}
                                    label={`Atividades: ${formatters.formatActivities(state.collectedData.activities)}`}
                                    variant="outlined"
                                    color="success"
                                    size="small"
                                />
                            )}
                            {state.collectedData.purpose && (
                                <Chip
                                    icon={<CheckCircleIcon />}
                                    label={`Propósito: ${state.collectedData.purpose}`}
                                    variant="outlined"
                                    color="success"
                                    size="small"
                                />
                            )}
                        </Stack>
                    </Box>
                )}

                {/* Error Alert */}
                {state.error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {state.error}
                    </Alert>
                )}

                {/* Chat Interface */}
                {state.isConnected && (
                    <Paper
                        elevation={1}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            flexGrow: 1,
                            overflow: 'hidden',
                            borderRadius: 2,
                        }}
                    >
                        {/* Messages Area */}
                        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                            {state.messages.map((message: any, index: number) => {
                                const isLastMessage = index === state.messages.length - 1;
                                // Use frontend-generated buttons as primary source, fallback to LLM buttons
                                const buttonsToShow = isLastMessage && message.role === 'assistant' 
                                    ? (frontendButtonOptions || message.buttonOptions)
                                    : null;
                                const showButtons = buttonsToShow && buttonsToShow.length > 0;
                                
                                return (
                                    <Box key={message.id} sx={{ mb: 2 }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                                            }}
                                        >
                                            <Box sx={{ maxWidth: '70%' }}>
                                                <Paper
                                                    elevation={1}
                                                    sx={{
                                                        p: 2,
                                                        bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                                                        color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    <Typography variant="body1">
                                                        {message.content}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
                                                        {message.timestamp.toLocaleTimeString()}
                                                    </Typography>
                                                    
                                                    {/* Debug info para desenvolvimento */}
                                                    {/* {message.role === 'assistant' && message.jsonData && process.env.NODE_ENV === 'development' && (
                                                        <Typography variant="caption" sx={{ opacity: 0.5, display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                                                            Estágio: {message.jsonData.conversation_stage} | 
                                                            Próxima: {message.jsonData.next_question_key || 'N/A'}
                                                        </Typography>
                                                    )} */}
                                                </Paper>
                                                
                                                {/* Render buttons - frontend-generated takes priority over LLM */}
                                                {showButtons && (
                                                    <ChatButtons
                                                        options={buttonsToShow}
                                                        onButtonClick={handleButtonClick}
                                                        disabled={!isReady || state.isTyping}
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                );
                            })}

                            {/* Typing indicator */}
                            {state.isTyping && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            AIR Discovery está digitando...
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}
                        </Box>

                        {/* Scroll anchor */}
                        <div ref={messagesEndRef} />

                        {/* Message Input - Hidden when buttons are displayed */}
                        {state.sessionId && !state.isComplete && !hasActiveButtons && (
                            <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                                <MessageInput
                                    onSendMessage={handleSendMessage}
                                    disabled={!isReady || state.isTyping}
                                    placeholder={
                                        state.isTyping
                                            ? "Aguarde a resposta do assistente..."
                                            : progressInfo.nextStep || "Digite sua mensagem..."
                                    }
                                />
                            </Box>
                        )}
                        
                        {/* Show hint when buttons are active */}
                        {state.sessionId && !state.isComplete && hasActiveButtons && (
                            <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Selecione uma opção acima
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                )}

                {/* No Active Session State */}
                {state.isConnected && !state.sessionId && (
                    <Paper
                        elevation={1}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexGrow: 1,
                            p: 4,
                            textAlign: 'center',
                        }}
                    >
                        <ChatIcon
                            sx={{
                                fontSize: 80,
                                color: theme.palette.grey[400],
                                mb: 2,
                            }}
                        />
                        <Typography variant="h5" color="text.secondary" gutterBottom>
                            Bem-vindo ao Chat AIR Discovery!
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                            Descubra seu destino ideal através de uma conversa personalizada com nosso assistente inteligente.
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleStartNewChat}
                            startIcon={<ChatIcon />}
                            sx={{ mt: 2 }}
                        >
                            Iniciar Nova Conversa
                        </Button>
                    </Paper>
                )}
            </Container>

            {/* Recommendation Panel */}
            {recommendation && (
                <Box
                    sx={{
                        position: 'fixed',
                        right: 24,
                        bottom: 24,
                        width: 400,
                        maxHeight: '50vh',
                        overflow: 'auto',
                        zIndex: theme.zIndex.fab,
                        display: { xs: 'none', lg: 'block' },
                    }}
                >
                    <JsonChatRecommendations
                        recommendations={[recommendation]}
                        onSelectRecommendation={navigateToRecommendations}
                        showDetails={false}
                    />
                </Box>
            )}

            {/* Mobile Recommendation Button */}
            {recommendation && (
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: theme.zIndex.fab,
                        display: { xs: 'block', lg: 'none' },
                    }}
                >
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={navigateToRecommendations}
                        sx={{
                            borderRadius: 3,
                            px: 3,
                            py: 1,
                        }}
                        startIcon={<FlightIcon />}
                    >
                        Ver Recomendações
                    </Button>
                </Box>
            )}

            {/* Reset Chat FAB */}
            {state.sessionId && !recommendation && (
                <Fab
                    color="primary"
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                    }}
                    onClick={handleStartNewChat}
                    title="Recomeçar chat"
                >
                    <RefreshIcon />
                </Fab>
            )}
        </Box>
    );
};

// Wrap the component with Error Boundary
const ChatPageV2WithErrorBoundary: React.FC = () => {
    return (
        <ChatErrorBoundary>
            <ChatPageV2 />
        </ChatErrorBoundary>
    );
};

export default ChatPageV2WithErrorBoundary;