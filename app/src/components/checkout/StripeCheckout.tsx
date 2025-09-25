import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Box, Typography, Alert, Button, CircularProgress } from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { httpInterceptor } from '@/utils/httpInterceptor';

interface StripeCheckoutProps {
  bookingId: string;
  amount: number;
  currency?: string;
  description?: string;
  onPaymentSuccess?: (paymentIntent: any) => void;
  onPaymentError?: (error: any) => void;
}

interface PaymentIntentResponse {
  id: string;
  clientSecret: string;
  status: string;
  amount: number;
  currency: string;
}

/**
 * Componente de checkout do Stripe usando React Stripe Elements
 * 
 * Substitui o MercadoPagoWallet com funcionalidades equivalentes:
 * - Criação de Payment Intent
 * - Processamento de pagamento
 * - Feedback visual para o usuário
 */
export const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  bookingId,
  amount,
  currency = 'brl',
  description,
  onPaymentSuccess,
  onPaymentError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Criar Payment Intent
  const createPaymentIntentMutation = useMutation({
    mutationFn: async (data: {
      bookingId: string;
      amount: number;
      currency: string;
      description?: string;
    }) => {
    const response = await httpInterceptor.post(
      `${import.meta.env.VITE_API_URL}/payments/stripe/create-intent`,
      data
    );

      const result = await response.json()
      console.log('Payment Intent criado:', result);
      return result.data as PaymentIntentResponse;
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setPaymentError('Stripe não foi carregado corretamente');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // 1. Criar Payment Intent no backend
      const paymentIntentData = await createPaymentIntentMutation.mutateAsync({
        bookingId,
        amount: amount * 100, // Converter para centavos
        currency,
        description,
      });

      // 2. Confirmar o pagamento no frontend
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Elemento do cartão não encontrado');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (error) {
        setPaymentError(error.message || 'Erro no processamento do pagamento');
        onPaymentError?.(error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentSuccess(true);
        onPaymentSuccess?.(paymentIntent);
      }
    } catch (error: any) {
      console.error('Erro no pagamento:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro interno do servidor';
      setPaymentError(errorMessage);
      onPaymentError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Estilos do CardElement
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  };

  if (!bookingId) {
    return (
      <Alert severity="warning">
        ID da reserva não encontrado
      </Alert>
    );
  }

  if (paymentSuccess) {
    return (
      <Alert severity="success">
        ✅ Pagamento processado com sucesso! Você receberá a confirmação por email.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Informações de Pagamento
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 2, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
        💳 Ambiente de teste - Use cartões de teste do Stripe (ex: 4242 4242 4242 4242)
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, mx: 'auto' }}>
        <Box 
          sx={{ 
            p: 2, 
            border: '1px solid #ccc', 
            borderRadius: 1, 
            mb: 2,
            backgroundColor: 'white'
          }}
        >
          <CardElement options={cardElementOptions} />
        </Box>

        {paymentError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {paymentError}
          </Alert>
        )}

        {createPaymentIntentMutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Erro ao criar intenção de pagamento. Tente novamente.
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!stripe || isProcessing || createPaymentIntentMutation.isPending}
            startIcon={
              (isProcessing || createPaymentIntentMutation.isPending) && 
              <CircularProgress size={16} />
            }
            sx={{ 
              minWidth: 200,
              backgroundColor: '#635bff', // Cor padrão do Stripe
              '&:hover': {
                backgroundColor: '#4f46e5',
              },
            }}
          >
            {isProcessing || createPaymentIntentMutation.isPending
              ? 'Processando...'
              : `Pagar R$ ${amount.toFixed(2)}`
            }
          </Button>
        </Box>

        <Typography variant="caption" display="block" sx={{ textAlign: 'center', mt: 2 }}>
          🔒 Seus dados estão seguros com criptografia SSL
        </Typography>
      </Box>
    </Box>
  );
};