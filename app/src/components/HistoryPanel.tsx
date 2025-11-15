import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  Paper,
  Divider,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import HistoryItem, { HistoryItemProps } from './HistoryItem';

export interface SessionSummary {
  sessionId: string;
  userId: string;
  startTime: Date;
  lastUpdated: Date;
  summary: string;
  messageCount: number;
  recommendedDestination?: string;
}

export interface HistoryPanelProps {
  sessions: SessionSummary[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSessionSelect: (sessionId: string) => void;
  selectedSessionId?: string;
  collapsed?: boolean;
}

/**
 * HistoryPanel - Painel de histórico de conversas
 * 
 * Exibe a lista de sessões de chat passadas do usuário.
 * Permite navegação entre conversas e refresh da lista.
 * 
 * @param sessions - Lista de sessões
 * @param loading - Estado de carregamento
 * @param error - Mensagem de erro (se houver)
 * @param onRefresh - Callback para atualizar a lista
 * @param onSessionSelect - Callback quando uma sessão é selecionada
 * @param selectedSessionId - ID da sessão atualmente selecionada
 * @param collapsed - Se o painel está colapsado (opcional)
 */
export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  sessions,
  loading,
  error,
  onRefresh,
  onSessionSelect,
  selectedSessionId,
  collapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  /**
   * Agrupa sessões por data relativa (Hoje, Ontem, Esta Semana, etc)
   */
  const groupSessionsByDate = (sessions: SessionSummary[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const groups: { [key: string]: SessionSummary[] } = {
      'Hoje': [],
      'Ontem': [],
      'Esta Semana': [],
      'Este Mês': [],
      'Mais Antigos': [],
    };

    sessions.forEach((session) => {
      const sessionDate = new Date(session.lastUpdated);
      const sessionDateOnly = new Date(
        sessionDate.getFullYear(),
        sessionDate.getMonth(),
        sessionDate.getDate()
      );

      if (sessionDateOnly.getTime() === today.getTime()) {
        groups['Hoje'].push(session);
      } else if (sessionDateOnly.getTime() === yesterday.getTime()) {
        groups['Ontem'].push(session);
      } else if (sessionDate >= lastWeek) {
        groups['Esta Semana'].push(session);
      } else if (sessionDate >= lastMonth) {
        groups['Este Mês'].push(session);
      } else {
        groups['Mais Antigos'].push(session);
      }
    });

    // Remove grupos vazios
    return Object.entries(groups).filter(([_, sessions]) => sessions.length > 0);
  };

  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <Paper
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Typography variant="h6" component="h2">
          Histórico de Conversas
        </Typography>
        <Box>
          <IconButton
            onClick={onRefresh}
            disabled={loading}
            size="small"
            sx={{ color: 'inherit', mr: 1 }}
            aria-label="Atualizar histórico"
          >
            <RefreshIcon />
          </IconButton>
          <IconButton
            onClick={toggleCollapse}
            size="small"
            sx={{ color: 'inherit' }}
            aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
          >
            {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>
      </Box>

      <Divider />

      {/* Content */}
      <Collapse in={!isCollapsed} timeout="auto">
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            minHeight: 200,
            maxHeight: 'calc(100vh - 200px)',
          }}
        >
          {/* Loading State */}
          {loading && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 200,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Erro ao carregar histórico</AlertTitle>
              {error}
            </Alert>
          )}

          {/* Empty State */}
          {!loading && !error && sessions.length === 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 200,
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <Typography variant="h6" gutterBottom>
                Nenhuma conversa encontrada
              </Typography>
              <Typography variant="body2">
                Inicie uma nova conversa para começar!
              </Typography>
            </Box>
          )}

          {/* Sessions List */}
          {!loading && !error && sessions.length > 0 && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                {sessions.length} conversa{sessions.length !== 1 ? 's' : ''} encontrada
                {sessions.length !== 1 ? 's' : ''}
              </Typography>
              
              {groupedSessions.map(([groupLabel, groupSessions]) => (
                <Box key={groupLabel} sx={{ mb: 3 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      display: 'block',
                      color: 'text.secondary',
                      fontWeight: 600,
                      mb: 1,
                      px: 1,
                    }}
                  >
                    {groupLabel}
                  </Typography>
                  {groupSessions.map((session) => (
                    <HistoryItem
                      key={session.sessionId}
                      sessionId={session.sessionId}
                      summary={session.summary}
                      startTime={session.startTime}
                      lastUpdated={session.lastUpdated}
                      messageCount={session.messageCount}
                      recommendedDestination={session.recommendedDestination}
                      onClick={onSessionSelect}
                      isSelected={session.sessionId === selectedSessionId}
                    />
                  ))}
                </Box>
              ))}
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default HistoryPanel;
