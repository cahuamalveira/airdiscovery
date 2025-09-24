import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    Stack,
    Divider,
    IconButton,
    Collapse,
    useTheme
} from '@mui/material';
import {
    Flight as FlightIcon,
    LocationOn as LocationIcon,
    AttachMoney as MoneyIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Map as MapIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { TravelRecommendation } from '@/types/json-chat';
import { useJsonChatFormatters } from '@/hooks/useJsonChat';

interface JsonChatRecommendationsProps {
    recommendations: TravelRecommendation[];
    onSelectRecommendation?: (recommendation: TravelRecommendation) => void;
    showDetails?: boolean;
}

interface RecommendationCardProps {
    recommendation: TravelRecommendation;
    onSelect?: (recommendation: TravelRecommendation) => void;
    showDetails?: boolean;
}

/**
 * Card individual para cada recomendação
 */
const RecommendationCard: React.FC<RecommendationCardProps> = ({
    recommendation,
    onSelect,
    showDetails = true
}) => {
    const theme = useTheme();
    const formatters = useJsonChatFormatters();
    const [expanded, setExpanded] = React.useState(false);

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    const handleSelectClick = () => {
        onSelect?.(recommendation);
    };

    return (
        <Card 
            elevation={2} 
            sx={{ 
                mb: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4]
                }
            }}
        >
            <CardContent>
                {/* Header com destino */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                        {recommendation.destination.name}
                    </Typography>
                    {recommendation.destination.iata && (
                        <Chip 
                            label={recommendation.destination.iata} 
                            size="small" 
                            variant="outlined"
                            color="primary"
                        />
                    )}
                </Box>

                {/* Informações principais */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    {recommendation.budget && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <MoneyIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                {formatters.formatBudget(recommendation.budget)}
                            </Typography>
                        </Box>
                    )}
                    
                    {recommendation.destination.description && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                            <InfoIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                {recommendation.destination.description}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Razão da recomendação */}
                {recommendation.recommendationReason && (
                    <Typography variant="body2" color="text.primary" sx={{ mb: 2 }}>
                        {recommendation.recommendationReason}
                    </Typography>
                )}

                {/* Tags de atividades */}
                {recommendation.activities?.length > 0 && (
                    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                        {recommendation.activities.map((activity, index) => (
                            <Chip
                                key={index}
                                label={activity}
                                size="small"
                                variant="outlined"
                                color="secondary"
                            />
                        ))}
                    </Stack>
                )}

                {/* Detalhes expandíveis */}
                {showDetails && (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                                {expanded ? 'Menos detalhes' : 'Mais detalhes'}
                            </Typography>
                            <IconButton
                                onClick={handleExpandClick}
                                aria-expanded={expanded}
                                aria-label="mostrar mais"
                                size="small"
                            >
                                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Box>

                        <Collapse in={expanded} timeout="auto" unmountOnExit>
                            <Divider sx={{ my: 2 }} />
                            
                            {/* Informações da origem */}
                            <Stack spacing={2}>
                                {recommendation.origin && (
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Partindo de
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {recommendation.origin.name} ({recommendation.origin.iata})
                                        </Typography>
                                    </Box>
                                )}

                                {recommendation.purpose && (
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Propósito da viagem
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {recommendation.purpose}
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>
                        </Collapse>
                    </>
                )}
            </CardContent>

            <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSelectClick}
                    startIcon={<FlightIcon />}
                    fullWidth
                >
                    Selecionar este destino
                </Button>
            </CardActions>
        </Card>
    );
};

/**
 * Componente principal para exibir lista de recomendações
 */
export const JsonChatRecommendations: React.FC<JsonChatRecommendationsProps> = ({
    recommendations,
    onSelectRecommendation,
    showDetails = true
}) => {
    if (!recommendations || recommendations.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    Nenhuma recomendação disponível
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Continue a conversa para receber sugestões personalizadas de destinos
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <MapIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5" component="h2">
                    Recomendações de Destinos
                </Typography>
                <Chip 
                    label={`${recommendations.length} opções`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ ml: 2 }}
                />
            </Box>

            <Stack spacing={2}>
                {recommendations.map((recommendation, index) => (
                    <RecommendationCard
                        key={index}
                        recommendation={recommendation}
                        onSelect={onSelectRecommendation}
                        showDetails={showDetails}
                    />
                ))}
            </Stack>

            {recommendations.length > 3 && (
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        Mostrando {recommendations.length} recomendações baseadas no seu perfil
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default JsonChatRecommendations;