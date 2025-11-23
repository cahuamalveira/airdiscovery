import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Chip,
  Typography,
  Box,
  Stack,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { BookingResponseDto, BookingStatus } from '../../types/booking';

interface BookingCardProps {
  booking: BookingResponseDto;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking }) => {
  const navigate = useNavigate();

  // Handle card click to navigate to detail page
  const handleCardClick = () => {
    navigate(`/minhas-reservas/${booking.id}`);
  };

  // Status configuration
  const getStatusConfig = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PAID:
        return {
          label: 'Confirmada',
          color: 'success' as const,
          icon: <CheckCircleIcon fontSize="small" />,
        };
      case BookingStatus.AWAITING_PAYMENT:
        return {
          label: 'Aguardando Pagamento',
          color: 'warning' as const,
          icon: <ScheduleIcon fontSize="small" />,
        };
      case BookingStatus.PENDING:
        return {
          label: 'Pendente',
          color: 'info' as const,
          icon: <InfoIcon fontSize="small" />,
        };
      case BookingStatus.CANCELLED:
        return {
          label: 'Cancelada',
          color: 'error' as const,
          icon: <CancelIcon fontSize="small" />,
        };
      default:
        return {
          label: 'Desconhecido',
          color: 'default' as const,
          icon: <InfoIcon fontSize="small" />,
        };
    }
  };

  // Format currency in BRL
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Format date in pt-BR locale
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Data não disponível';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  // Get passenger count text
  const getPassengerCountText = (count: number): string => {
    if (count === 0) return '0 passageiros';
    if (count === 1) return '1 passageiro';
    return `${count} passageiros`;
  };

  const statusConfig = getStatusConfig(booking.status);
  const passengerCount = booking.passengers?.length || 0;

  return (
    <Card
      data-testid="booking-card"
      onClick={handleCardClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          {/* Status Chip */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Chip
              data-testid="booking-status-chip"
              label={statusConfig.label}
              color={statusConfig.color}
              icon={statusConfig.icon}
              size="small"
            />
            <Typography variant="caption" color="text.secondary">
              {formatDate(booking.createdAt)}
            </Typography>
          </Box>

          {/* Flight Route */}
          <Box>
            <Typography variant="h6" component="div" gutterBottom>
              Reserva #{booking.id.slice(0, 8)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Voo: GRU → JFK
            </Typography>
          </Box>

          {/* Passenger Count */}
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">
              {getPassengerCountText(passengerCount)}
            </Typography>
          </Box>

          {/* Total Amount */}
          <Box
            sx={{
              pt: 1,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" color="primary" fontWeight="bold">
              {formatCurrency(booking.totalAmount)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default BookingCard;
