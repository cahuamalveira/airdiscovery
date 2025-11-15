import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Stack,
  Box,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  Message as MessageIcon,
  Flight as FlightIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface HistoryItemProps {
  sessionId: string;
  summary: string;
  startTime: Date;
  lastUpdated: Date;
  messageCount: number;
  recommendedDestination?: string;
  onClick: (sessionId: string) => void;
  isSelected?: boolean;
}

/**
 * HistoryItem - Componente para exibir um item do histórico de conversas
 * 
 * @param sessionId - ID da sessão
 * @param summary - Resumo da conversa (primeira mensagem)
 * @param startTime - Data/hora de início
 * @param lastUpdated - Data/hora da última atualização
 * @param messageCount - Número de mensagens na conversa
 * @param recommendedDestination - Destino recomendado (se houver)
 * @param onClick - Callback quando o item é clicado
 * @param isSelected - Se o item está selecionado
 */
export const HistoryItem: React.FC<HistoryItemProps> = ({
  sessionId,
  summary,
  startTime,
  lastUpdated,
  messageCount,
  recommendedDestination,
  onClick,
  isSelected = false,
}) => {
  const handleClick = () => {
    onClick(sessionId);
  };

  const formatDate = (date: Date): string => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  return (
    <Card
      sx={{
        mb: 1,
        borderLeft: isSelected ? 4 : 0,
        borderColor: 'primary.main',
        backgroundColor: isSelected ? 'action.selected' : 'background.paper',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: 'action.hover',
          transform: 'translateX(4px)',
          boxShadow: 2,
        },
      }}
    >
      <CardActionArea onClick={handleClick}>
        <CardContent>
          {/* Resumo da conversa */}
          <Typography
            variant="body1"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 1,
              fontWeight: isSelected ? 600 : 400,
            }}
          >
            {summary}
          </Typography>

          {/* Chips informativos */}
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} mb={1}>
            <Chip
              icon={<MessageIcon />}
              label={`${messageCount} msgs`}
              size="small"
              variant="outlined"
              sx={{ height: 24 }}
            />
            <Chip
              icon={<TimeIcon />}
              label={formatDate(lastUpdated)}
              size="small"
              variant="outlined"
              sx={{ height: 24 }}
            />
            {recommendedDestination && (
              <Chip
                icon={<FlightIcon />}
                label={recommendedDestination}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ height: 24 }}
              />
            )}
          </Stack>

          {/* Data de início */}
          <Typography variant="caption" color="text.secondary">
            Iniciado em {new Date(startTime).toLocaleDateString('pt-BR')} às{' '}
            {new Date(startTime).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default HistoryItem;
