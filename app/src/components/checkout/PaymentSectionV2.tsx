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

interface PaymentSectionV2Props {
  onBack: () => void;
  onPaymentSuccess?: (paymentIntent: any) => void;
  onPaymentError?: (error: any) => void;
  loading?: boolean;
  bookingId: string;
  amount: number; // Display-only: comes from booking.totalAmount (backend-calculated)
  description?: string;
  paymentStatus?: 'pending' | 'processing' | 'success' | 'failed';
}

/**
 * PaymentSectionV2 - Componente moderno de pagamento com Stripe
 * 
 * Versão simplificada e otimizada que substitui o sistema de PIX/MercadoPago
 * por pagamento com cartão via Stripe.
 * 
 * SECURITY NOTE: Amount is display-only and comes from booking.totalAmount.
 * The actual payment amount is calculated and validated on the backend.
 * Only bookingId is sent to the payment API.
 */
export const PaymentSectionV2: React.FC<PaymentSectionV2Props> = ({
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

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
        return 'O pagamento foi processado com sucesso. Você receberá a confirmação da reserva por email.';
      case 'processing':
        return 'Seu pagamento está sendo processado. Aguarde a confirmação.';
      case 'failed':
        return 'Houve um problema com o pagamento. Tente novamente.';
      default:
        return 'Preencha as informações do cartão para finalizar a compra. Todos os dados são protegidos com criptografia SSL.';
    }
  };

  const getStatusLabel = () => {
    switch (paymentStatus) {
      case 'success':
        return 'Confirmado';
      case 'processing':
        return 'Processando';
      case 'failed':
        return 'Falhou';
      default:
        return 'Aguardando Pagamento';
    }
  };

  return (
    <Card elevation={3}>
      <CardContent sx={{ p: 4 }}>
        {/* Header com status */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 2,
              fontWeight: 600,
              color: 'primary.main'
            }}
          >
            {getStatusIcon()}
            Finalizar Pagamento
          </Typography>
          
          <Chip 
            label={getStatusLabel()}
            color={getStatusColor() as any}
            variant="outlined"
            size="large"
            sx={{ fontSize: '1rem', py: 1 }}
          />
          
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ mt: 2, maxWidth: 500, mx: 'auto', lineHeight: 1.6 }}
          >
            {getStatusMessage()}
          </Typography>
        </Box>

        {/* Conteúdo principal */}
        <Box sx={{ mb: 4 }}>
          {paymentStatus === 'success' ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon 
                color="success" 
                sx={{ fontSize: 80, mb: 3, filter: 'drop-shadow(0 4px 8px rgba(76, 175, 80, 0.3))' }} 
              />
              <Typography variant="h5" color="success.main" fontWeight="bold" gutterBottom>
                Pagamento Confirmado!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sua reserva foi processada com sucesso. Em breve você receberá um email com todos os detalhes.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
              <StripeCheckout
                bookingId={bookingId}
                amount={amount}
                description={description}
                onPaymentSuccess={onPaymentSuccess}
                onPaymentError={onPaymentError}
              />
            </Box>
          )}
        </Box>

        {/* Resumo do valor */}
        {paymentStatus !== 'success' && (
          <Box sx={{ 
            backgroundColor: 'grey.50', 
            borderRadius: 2, 
            p: 3, 
            mb: 4,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Typography variant="h6" gutterBottom color="text.primary">
              Resumo do Pagamento
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">
                {description || 'Passagem Aérea'}
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                R$ {amount.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Botões de ação */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button 
            onClick={onBack}
            variant="outlined"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Voltar
          </Button>
          
          {paymentStatus === 'success' && (
            <Button 
              variant="contained"
              size="large"
              onClick={() => window.location.href = '/'}
              sx={{ minWidth: 150 }}
            >
              Ir para Home
            </Button>
          )}
        </Box>

        {/* Footer informativo */}
        <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'grey.200' }}>
          <Typography variant="caption" color="text.secondary">
            🔒 Pagamento seguro processado pelo Stripe • Seus dados estão protegidos
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};