import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { StripeCheckout } from './StripeCheckout';

interface PaymentSectionProps {
  onBack: () => void;
  onPaymentSuccess?: (paymentIntent: any) => void;
  onPaymentError?: (error: any) => void;
  loading?: boolean;
  bookingId: string;
  amount: number;
  description?: string;
  paymentStatus?: 'pending' | 'processing' | 'success' | 'failed';
}

/**
 * Componente para seção de pagamento com Stripe
 */
export const PaymentSection: React.FC<PaymentSectionProps> = ({
  onBack,
  onPaymentSuccess,
  onPaymentError,
  bookingId,
  amount,
  description,
  paymentStatus = 'pending'
}) => {
  // Função para determinar a cor do status
  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'success':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  // Função para obter o ícone do status
  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'processing':
        return <CreditCardIcon color="warning" />;
      case 'failed':
        return <CreditCardIcon color="error" />;
      default:
        return <CreditCardIcon color="primary" />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            {getStatusIcon()}
            Pagamento via Stripe
          </Typography>
          
          <Chip 
            label={paymentStatus === 'success' ? 'Confirmado' : paymentStatus === 'processing' ? 'Processando' : paymentStatus === 'failed' ? 'Falhou' : 'Aguardando'}
            color={getStatusColor() as any}
            variant="outlined"
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {paymentStatus === 'success' 
              ? 'O pagamento foi processado com sucesso. Você receberá a confirmação da reserva por email.' 
              : paymentStatus === 'processing'
              ? 'Seu pagamento está sendo processado. Aguarde a confirmação.'
              : paymentStatus === 'failed'
              ? 'Houve um problema com o pagamento. Tente novamente.'
              : 'O pagamento via Stripe é seguro e instantâneo. Após a confirmação do pagamento, você receberá a confirmação da reserva por email.'
            }
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          {paymentStatus === 'success' ? (
            <Box sx={{ textAlign: 'center' }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" color="success.main" fontWeight="bold">
                Pagamento Confirmado!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Sua reserva foi processada com sucesso
              </Typography>
            </Box>
          ) : (
            <StripeCheckout
              bookingId={bookingId}
              amount={amount}
              description={description}
              onPaymentSuccess={onPaymentSuccess}
              onPaymentError={onPaymentError}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button onClick={onBack}>
            Voltar
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};