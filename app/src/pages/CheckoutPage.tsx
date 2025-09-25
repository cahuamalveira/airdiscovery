import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Alert,
  IconButton,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  CreditCard as CreditCardIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { AmadeusFlightOffer, AmadeusDictionaries } from '@/hooks/useFlightSearch';
import { useFlight } from '@/hooks/useFlight';

// Componentes do checkout
import {
  FlightSummary as FlightSummaryComponent,
  PriceSummary as PriceSummaryComponent,
  CheckoutStepper,
  PassengerForm,
  BookingConfirmation,
  type BookingData,
  type PassengerFormData
} from '@/components/checkout';
import { PaymentSection } from '@/components/checkout/PaymentSectionNew';

// Hooks customizados
import {
  useBooking,
  usePixPayment,
  useCheckoutSteps
} from '@/hooks/checkout';

/**
 * Interface para resposta do Pix
 */
interface PixPreferenceResponse {
  preferenceId: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string;
  expirationDate: string;
  totalAmount: number;
}

/**
 * Componente principal da página de checkout
 */
const CheckoutPage: React.FC = () => {
  const { flightId } = useParams<{ flightId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados do componente
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [showQrCodeDialog, setShowQrCodeDialog] = useState(false);

  // Hooks customizados
  const { createBooking, loading: bookingLoading } = useBooking();
  const { createPixPreference, pixData, paymentStatus, loading: pixLoading } = usePixPayment();
  const {
    activeStep,
    steps,
    handleNext,
    handleBack,
    handleStepClick,
    isStepClickable,
    goToStep
  } = useCheckoutSteps();

  // Buscar dados do voo pelo ID interno
  const { flight, loading: flightLoading, error: flightError } = useFlight(flightId);

  // Verificar se temos os dados necessários
  useEffect(() => {
    console.log('FlightId from URL params:', flightId);
    console.log('FlightId type:', typeof flightId);
    console.log('FlightId is falsy:', !flightId);
    
    if (!flightId) {
      console.error('No flightId provided, redirecting to flights page');
      navigate('/voos');
      return;
    }
  }, [flightId, navigate]);

  // Converter dados internos para formato compatível com componentes existentes
  const flightOffer = React.useMemo((): AmadeusFlightOffer | null => {
    if (!flight || !flight.amadeusOfferPayload) {
      return null;
    }
    return flight.amadeusOfferPayload as AmadeusFlightOffer;
  }, [flight]);

  // Extrair dictionaries se disponível (pode ser null para backwards compatibility)
  const dictionaries = React.useMemo((): AmadeusDictionaries | undefined => {
    // Por enquanto, dictionaries será undefined já que não está sendo armazenado na entidade Flight
    // Isso é aceitável pois os componentes devem ser capazes de lidar com dictionaries undefined
    return undefined;
  }, []);

  // Navegação para confirmação apenas quando pagamento for aprovado
  useEffect(() => {
    if (paymentStatus === 'success' && bookingData) {
      // Aguardar um pouco para mostrar o feedback visual
      setTimeout(() => {
        navigate(`/confirmation/${bookingData.id}`);
      }, 2000);
    }
  }, [paymentStatus, bookingData, navigate]);

  // Função para lidar com envio do formulário de passageiro
  const handlePassengerSubmit = async (data: PassengerFormData) => {
    console.log('handlePassengerSubmit called with data:', data);
    console.log('Current flightId:', flightId);
    console.log('Current flightOffer:', flightOffer);
    
    if (!flightId || !flightOffer) {
      console.error('Dados do voo não disponíveis');
      console.error('flightId:', flightId);
      console.error('flightOffer:', flightOffer);
      return;
    }

    try {
      const booking = await createBooking(flightId, flightOffer, data);
      console.log('Booking created successfully:', booking);
      setBookingData(booking);
      handleNext();
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
    }
  };

  // Função para processar pagamento
  const processPayment = async () => {
    if (!bookingData) return;
    console.log({ bookingData });
    try {
      await createPixPreference(bookingData);
      // setShowQrCodeDialog(true);
      // Removido handleNext() - só avança quando pagamento for aprovado
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
    }
  };

  // Funções personalizadas para passar bookingData para os hooks
  const handleCustomStepClick = (stepIndex: number) => {
    handleStepClick(stepIndex, bookingData);
  };

  const isCustomStepClickable = (stepIndex: number) => {
    return isStepClickable(stepIndex, bookingData);
  };

  // Loading state
  if (flightLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Carregando dados do voo...
        </Typography>
      </Container>
    );
  }

  // Error state
  if (flightError || !flightOffer) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Erro ao carregar dados do voo
          </Typography>
          <Typography variant="body1">
            {flightError || 'Dados do voo não encontrados'}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/voos')} 
            sx={{ mt: 2 }}
          >
            Voltar às Buscas
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Finalizar Reserva
        </Typography>
      </Box>

      {/* Stepper */}
      <CheckoutStepper
        activeStep={activeStep}
        steps={steps}
        onStepClick={handleCustomStepClick}
        isStepClickable={isCustomStepClickable}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {/* Coluna principal */}
        <Box sx={{ flex: '1 1 65%', minWidth: '300px' }}>
          {activeStep === 0 && (
            <PassengerForm
              onSubmit={handlePassengerSubmit}
              loading={bookingLoading}
              defaultValues={{
                firstName: user?.name?.split(' ')[0] || '',
                lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                email: user?.email || '',
                phone: '',
                document: '',
                birthDate: ''
              }}
            />
          )}

          {activeStep === 1 && bookingData && (
            <BookingConfirmation
              bookingData={bookingData}
              onBack={handleBack}
              onConfirm={handleNext}
            />
          )}

          {activeStep === 2 && bookingData && (
            <PaymentSection
              onBack={handleBack}
              bookingId={bookingData.id}
              amount={parseFloat(flightOffer.price.total)}
              description={`Voo ${flightOffer.itineraries[0].segments[0].departure.iataCode} → ${flightOffer.itineraries[0].segments[flightOffer.itineraries[0].segments.length - 1].arrival.iataCode}`}
              paymentStatus={paymentStatus}
              onPaymentSuccess={(paymentIntent: any) => {
                console.log('Pagamento aprovado:', paymentIntent);
                // setPaymentStatus('success'); // Será atualizado via webhook
                handleNext();
              }}
              onPaymentError={(error: any) => {
                console.error('Erro no pagamento:', error);
                // setPaymentStatus('failed'); // Status de erro será gerenciado pelo componente
              }}
            />
          )}

          {activeStep === 3 && (
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Reserva Confirmada!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Sua reserva foi confirmada e um email de confirmação foi enviado.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleNext}
                >
                  Ver Detalhes da Reserva
                </Button>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Sidebar com resumo */}
        <Box sx={{ flex: '1 1 30%', minWidth: '300px' }}>
          <Stack spacing={3}>
            <FlightSummaryComponent flightOffer={flightOffer} dictionaries={dictionaries} />
            <PriceSummaryComponent flightOffer={flightOffer} loading={bookingLoading} />
          </Stack>
        </Box>
      </Box>

      {/* Dialog do QR Code */}
      <Dialog
        open={showQrCodeDialog}
        onClose={() => setShowQrCodeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CreditCardIcon sx={{ mr: 1 }} />
            Pagamento via Stripe
          </Box>
        </DialogTitle>
        <DialogContent>
          {pixData && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" gutterBottom>
                Escaneie o QR Code abaixo com o app do seu banco:
              </Typography>
              
              <Box sx={{ p: 2, bgcolor: 'white', border: 1, borderColor: 'grey.300', mb: 2 }}>
                <img
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                  alt="QR Code Pix"
                  style={{ width: '100%', maxWidth: 256 }}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Ou copie e cole o código Pix:
              </Typography>
              
              <TextField
                fullWidth
                value={pixData.qrCode}
                InputProps={{
                  readOnly: true,
                }}
                sx={{ mb: 2 }}
              />

              <Alert severity="warning" sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTimeIcon sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">
                    Este Pix expira em: {new Date(pixData.expirationDate).toLocaleString('pt-BR')}
                  </Typography>
                </Box>
              </Alert>

              {paymentStatus === 'pending' && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Aguardando confirmação do pagamento...
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQrCodeDialog(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CheckoutPage;