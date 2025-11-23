import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Grid,
  Paper,
} from '@mui/material';
import { BookingStatus } from '../../types/booking';

interface PaymentDetailsSectionProps {
  status: BookingStatus;
  totalAmount: number;
  currency: string;
  paymentDate?: string;
  paymentMethod?: string;
}

const PaymentDetailsSection: React.FC<PaymentDetailsSectionProps> = React.memo(({
  status,
  totalAmount,
  currency,
  paymentDate,
  paymentMethod,
}) => {
  // Map status to display label
  const getStatusLabel = (status: BookingStatus): string => {
    const statusLabels: Record<BookingStatus, string> = {
      [BookingStatus.PAID]: 'Pago',
      [BookingStatus.AWAITING_PAYMENT]: 'Aguardando Pagamento',
      [BookingStatus.PENDING]: 'Pendente',
      [BookingStatus.CANCELLED]: 'Cancelado',
    };
    return statusLabels[status];
  };

  // Map status to color
  const getStatusColor = (status: BookingStatus): 'success' | 'warning' | 'default' | 'error' => {
    const statusColors: Record<BookingStatus, 'success' | 'warning' | 'default' | 'error'> = {
      [BookingStatus.PAID]: 'success',
      [BookingStatus.AWAITING_PAYMENT]: 'warning',
      [BookingStatus.PENDING]: 'default',
      [BookingStatus.CANCELLED]: 'error',
    };
    return statusColors[status];
  };

  // Format currency in BRL
  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format date in pt-BR locale (DD/MM/YYYY)
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <Box
      data-testid="payment-details-section"
      className="MuiBox-root"
      sx={{ mb: 4 }}
    >
      {/* Section Title */}
      <Typography
        variant="h5"
        component="h2"
        sx={{
          fontWeight: 'bold',
          color: '#212121',
          mb: 3,
        }}
      >
        Detalhes do Pagamento
      </Typography>

      <Paper
        elevation={1}
        sx={{
          p: 3,
          borderRadius: 2,
        }}
      >
        <Grid container spacing={3}>
          {/* Status */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography
              variant="caption"
              sx={{ color: '#757575', display: 'block', mb: 1 }}
            >
              Status
            </Typography>
            <Chip
              label={getStatusLabel(status)}
              color={getStatusColor(status)}
              sx={{ fontWeight: 'medium' }}
            />
          </Grid>

          {/* Total Amount */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography
              variant="caption"
              sx={{ color: '#757575', display: 'block', mb: 1 }}
            >
              Valor Total
            </Typography>
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: 'bold', color: '#212121' }}
            >
              {formatCurrency(totalAmount, currency)}
            </Typography>
          </Grid>

          {/* Payment Date (conditional) */}
          {paymentDate && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography
                variant="caption"
                sx={{ color: '#757575', display: 'block', mb: 1 }}
              >
                Data do Pagamento
              </Typography>
              <Typography variant="body1" sx={{ color: '#212121' }}>
                {formatDate(paymentDate)}
              </Typography>
            </Grid>
          )}

          {/* Payment Method (conditional) */}
          {paymentMethod && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography
                variant="caption"
                sx={{ color: '#757575', display: 'block', mb: 1 }}
              >
                Método de Pagamento
              </Typography>
              <Typography variant="body1" sx={{ color: '#212121' }}>
                {paymentMethod}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
});

PaymentDetailsSection.displayName = 'PaymentDetailsSection';

export default PaymentDetailsSection;
