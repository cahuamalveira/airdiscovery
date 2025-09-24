import React from 'react';
import {
    Box,
    Typography,
    LinearProgress,
    Stack,
    Chip,
    Paper,
    useTheme
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as UncheckedIcon,
    LocationOn as LocationIcon,
    AttachMoney as BudgetIcon,
    LocalActivity as ActivityIcon,
    Flag as PurposeIcon,
} from '@mui/icons-material';
import { JsonChatState, CollectedTravelData } from '@/types/json-chat';
import { useJsonChatProgress, useJsonChatFormatters } from '@/hooks/useJsonChat';

interface JsonChatProgressProps {
    state: JsonChatState;
    showDetails?: boolean;
    compact?: boolean;
}

/**
 * Componente para exibir progresso do chat JSON de forma visual
 */
export const JsonChatProgress: React.FC<JsonChatProgressProps> = ({
    state,
    showDetails = true,
    compact = false
}) => {
    const theme = useTheme();
    const progressInfo = useJsonChatProgress(state);
    const formatters = useJsonChatFormatters();

    const steps = [
        {
            key: 'origin',
            label: 'Origem',
            icon: LocationIcon,
            completed: !!(state.collectedData.origin_name && state.collectedData.origin_iata),
            value: state.collectedData.origin_name ? 
                `${state.collectedData.origin_name} (${state.collectedData.origin_iata})` : 
                null
        },
        {
            key: 'budget',
            label: 'Orçamento',
            icon: BudgetIcon,
            completed: !!state.collectedData.budget_in_brl,
            value: state.collectedData.budget_in_brl ? 
                formatters.formatBudget(state.collectedData.budget_in_brl) : 
                null
        },
        {
            key: 'activities',
            label: 'Atividades',
            icon: ActivityIcon,
            completed: !!(state.collectedData.activities?.length),
            value: state.collectedData.activities?.length ? 
                formatters.formatActivities(state.collectedData.activities) : 
                null
        },
        {
            key: 'purpose',
            label: 'Propósito',
            icon: PurposeIcon,
            completed: !!state.collectedData.purpose,
            value: state.collectedData.purpose
        }
    ];

    const completedSteps = steps.filter(step => step.completed).length;
    const progress = Math.round((completedSteps / steps.length) * 100);

    if (compact) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ flexGrow: 1, height: 4, borderRadius: 2 }}
                />
                <Typography variant="caption" color="text.secondary">
                    {completedSteps}/{steps.length}
                </Typography>
            </Box>
        );
    }

    return (
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Progresso da Entrevista
                </Typography>
                <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                    {progressInfo.stageDescription} - {completedSteps} de {steps.length} etapas concluídas
                </Typography>
            </Box>

            {showDetails && (
                <Stack spacing={1}>
                    {steps.map((step) => {
                        const Icon = step.icon;
                        
                        return (
                            <Box
                                key={step.key}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 1,
                                    borderRadius: 1,
                                    bgcolor: step.completed ? 
                                        theme.palette.success.light + '20' : 
                                        theme.palette.grey[100],
                                    border: step.completed ? 
                                        `1px solid ${theme.palette.success.light}` : 
                                        `1px solid ${theme.palette.grey[300]}`
                                }}
                            >
                                {step.completed ? (
                                    <CheckCircleIcon 
                                        color="success" 
                                        sx={{ fontSize: 20 }}
                                    />
                                ) : (
                                    <UncheckedIcon 
                                        color="disabled" 
                                        sx={{ fontSize: 20 }}
                                    />
                                )}
                                
                                <Icon 
                                    sx={{ 
                                        fontSize: 16, 
                                        color: step.completed ? 
                                            theme.palette.success.main : 
                                            theme.palette.grey[500]
                                    }}
                                />
                                
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            fontWeight: step.completed ? 500 : 400,
                                            color: step.completed ? 
                                                theme.palette.success.dark : 
                                                theme.palette.text.secondary
                                        }}
                                    >
                                        {step.label}
                                    </Typography>
                                    {step.value && (
                                        <Typography 
                                            variant="caption" 
                                            color="text.secondary"
                                            sx={{ display: 'block' }}
                                        >
                                            {step.value}
                                        </Typography>
                                    )}
                                </Box>

                                {step.completed && (
                                    <Chip
                                        label="✓"
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                        sx={{ minWidth: 'unset', width: 24, height: 24 }}
                                    />
                                )}
                            </Box>
                        );
                    })}
                </Stack>
            )}

            {progressInfo.isReadyForRecommendation && (
                <Box sx={{ mt: 2, p: 1, bgcolor: theme.palette.success.light + '20', borderRadius: 1 }}>
                    <Typography variant="body2" color="success.dark" sx={{ fontWeight: 500 }}>
                        ✅ Dados suficientes coletados! Aguardando recomendação...
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default JsonChatProgress;