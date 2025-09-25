import { useState, useCallback, useEffect } from 'react';
import { useHttpInterceptor } from '@/utils/httpInterceptor';
import { BookingData } from '@/components/checkout/types';

interface PixPreferenceResponse {
  preferenceId: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string;
  expirationDate: string;
  totalAmount: number;
}

type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed';

/**
 * Hook para gerenciar pagamento com Mercado Pago (Checkout Pro + Wallet)
 */
export const usePixPayment = () => {
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<PixPreferenceResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [paymentTimer, setPaymentTimer] = useState<number | null>(null);
  const httpInterceptor = useHttpInterceptor();

  const createPixPreference = async (booking: BookingData): Promise<PixPreferenceResponse> => {
    try {
      setLoading(true);

      const response = await httpInterceptor.post(`${import.meta.env.VITE_API_URL}/payments/create-preference`, {
        bookingId: booking.id,
        amount: booking.totalAmount,
        currency: booking.currency,
        description: `Passagem aérea - ${booking.flightId}`,
        payerEmail: booking.passengers?.[0]?.email || ''
      });

      const result = await response.json();
      const pixResponse: PixPreferenceResponse = result.data;
      setPixData(pixResponse);
      setPaymentStatus('processing');
      
      // Iniciar polling para verificar status do pagamento usando bookingId
      startPaymentPolling(booking.id);
      
      return pixResponse;
    } catch (error) {
      console.error('Erro ao criar preferência Pix:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (bookingId: string) => {
    try {
      const response = await httpInterceptor.get(`${import.meta.env.VITE_API_URL}/payments/status/${bookingId}`);
      const result = await response.json();
      const backendStatus = result.data?.status;
      
      // Mapear status do backend (PaymentStatus enum) para status do frontend
      let frontendStatus: PaymentStatus = 'processing';
      switch (backendStatus) {
        case 'approved':
          frontendStatus = 'success';
          break;
        case 'rejected':
        case 'cancelled':
          frontendStatus = 'failed';
          break;
        case 'pending':
        case 'in_process':
        default:
          frontendStatus = 'processing';
          break;
      }
      
      setPaymentStatus(frontendStatus);
      
      if (frontendStatus === 'success' || frontendStatus === 'failed') {
        if (paymentTimer) {
          clearInterval(paymentTimer);
          setPaymentTimer(null);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
    }
  };

  const startPaymentPolling = useCallback((bookingId: string) => {
    const timer = window.setInterval(() => {
      checkPaymentStatus(bookingId);
    }, 5000); // Verificar a cada 5 segundos
    
    setPaymentTimer(timer);
  }, []);

  const stopPaymentPolling = useCallback(() => {
    if (paymentTimer) {
      clearInterval(paymentTimer);
      setPaymentTimer(null);
    }
  }, [paymentTimer]);

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      stopPaymentPolling();
    };
  }, [stopPaymentPolling]);

  return {
    createPixPreference,
    checkPaymentStatus,
    startPaymentPolling,
    stopPaymentPolling,
    pixData,
    paymentStatus,
    loading
  };
};