import React from 'react';
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
  Paper,
  Grid,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CompleteIcon,
  Schedule as InProgressIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { ChatSession } from '../../hooks/useWebSocketChat';

interface SessionStatusProps {
  session: ChatSession | null;
  hasActiveSession: boolean;
  isLoadingSession: boolean;
}

export const SessionStatus: React.FC<SessionStatusProps> = ({
  session,
  hasActiveSession,
  isLoadingSession,
}) => {
  const theme = useTheme();

  if (isLoadingSession) {
    return (
      <Paper
        elevation={1}
        sx={{
          padding: 2,
          mb: 2,
          bgcolor: theme.palette.grey[50],
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <InfoIcon color="info" fontSize="small" />
          <Typography variant="subtitle2">
            Carregando informações da sessão...
          </Typography>
        </Box>
        <LinearProgress />
      </Paper>
    );
  }

  if (!hasActiveSession || !session) {
    return (
      <Paper
        elevation={1}
        sx={{
          padding: 2,
          mb: 2,
          bgcolor: theme.palette.grey[50],
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Inicie uma nova conversa para descobrir seu destino ideal!
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={1}
      sx={{
        padding: 2,
        mb: 2,
        bgcolor: session.interviewComplete 
          ? theme.palette.success.light + '10'
          : theme.palette.info.light + '10',
      }}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {session.interviewComplete ? (
              <CompleteIcon color="success" fontSize="small" />
            ) : (
              <InProgressIcon color="info" fontSize="small" />
            )}
            <Typography variant="subtitle2">
              {session.interviewComplete ? 'Entrevista Concluída' : 'Entrevista em Andamento'}
            </Typography>
            <Chip
              label={`Sessão: ${session.sessionId.slice(-8)}`}
              size="small"
              variant="outlined"
              sx={{ ml: 'auto' }}
            />
          </Box>
        </Grid>
    </Grid>
    </Paper>
  );
};