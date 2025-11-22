import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import { PassengerComposition } from '@/types/json-chat';
import { useHttpInterceptor } from '@/utils/httpInterceptor';

// Componentes do checkout
import {
  FlightSummary as FlightSummaryComponent,
  PriceSummary as PriceSummaryComponent,
  CheckoutStepper,
  PassengerForm,
  BookingConfirmation,
  type BookingData,
  type PassengerFormData,
  type PassengerType
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
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const navigate = useNavigate();
  const { user } = useAuth();
  const httpInterceptor = useHttpInterceptor();

  // Estados do componente
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [showQrCodeDialog, setShowQrCodeDialog] = useState(false);
  const [passengerComposition, setPassengerComposition] = useState<PassengerComposition | null>(null);
  const [loadingComposition, setLoadingComposition] = useState<boolean>(false);
  const [compositionError, setCompositionError] = useState<string | null>(null);

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

  // Fetch passenger composition from chat session
  useEffect(() => {
    const fetchPassengerComposition = async () => {
      if (!sessionId) {
        console.log('No sessionId provided, using default single passenger');
        setPassengerComposition({ adults: 1, children: null });
        return;
      }

      setLoadingComposition(true);
      setCompositionError(null);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await httpInterceptor.get(
          `${apiUrl}/sessions/collected-data/${sessionId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch session data: ${response.statusText}`);
        }

        const data = await response.json();
        const composition = data.collectedData?.passenger_composition;

        if (composition && composition.adults > 0) {
          setPassengerComposition(composition);
          console.log('Passenger composition loaded:', composition);
        } else {
          // Default to single passenger if no composition found
          setPassengerComposition({ adults: 1, children: null });
          console.log('No passenger composition found, using default single passenger');
        }
      } catch (error) {
        console.error('Error fetching passenger composition:', error);
        setCompositionError('Não foi possível carregar os dados dos passageiros');
        // Default to single passenger on error
        setPassengerComposition({ adults: 1, children: null });
      } finally {
        setLoadingComposition(false);
      }
    };

    fetchPassengerComposition();
  }, [sessionId, httpInterceptor]);

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

  // Generate passenger types array from composition
  const passengerTypes = useMemo((): PassengerType[] => {
    console.log('[CheckoutPage] Generating passengerTypes from composition:', passengerComposition);
    
    if (!passengerComposition) {
      console.log('[CheckoutPage] No passenger composition, returning empty array');
      return [];
    }

    const types: PassengerType[] = [];

    // Add adults
    for (let i = 0; i < passengerComposition.adults; i++) {
      types.push({ index: types.length, type: 'adult' });
    }
    console.log('[CheckoutPage] Added adults, types array:', types);

    // Add children
    if (passengerComposition.children) {
      for (const child of passengerComposition.children) {
        types.push({
          index: types.length,
          type: child.age <= 2 ? 'infant' : 'child',
          age: child.age
        });
      }
      console.log('[CheckoutPage] Added children, final types array:', types);
    }

    console.log('[CheckoutPage] Final passengerTypes array length:', types.length);
    return types;
  }, [passengerComposition]);

  // Calculate total passenger count
  const passengerCount = useMemo(() => {
    return passengerTypes.length;
  }, [passengerTypes]);

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
  const handlePassengerSubmit = async (data: PassengerFormData | PassengerFormData[]) => {
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
      // For now, use the first passenger data for single booking
      // TODO: Update createBooking to handle multiple passengers
      const primaryPassenger = Array.isArray(data) ? data[0] : data;
      const booking = await createBooking(flightId, flightOffer, primaryPassenger);
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
  if (flightLoading || loadingComposition) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {flightLoading ? 'Carregando dados do voo...' : 'Carregando dados dos passageiros...'}
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
            <>
              {compositionError && !loadingComposition && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body1" fontWeight="bold" gutterBottom>
                    {compositionError}
                  </Typography>
                  <Typography variant="body2">
                    Usando configuração padrão de 1 passageiro. Se você precisa adicionar mais passageiros, 
                    por favor volte ao chat e especifique o número de viajantes.
                  </Typography>
                </Alert>
              )}
              
              {loadingComposition ? (
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CircularProgress size={20} sx={{ mr: 2 }} />
                      <Typography variant="body1">
                        Carregando informações dos passageiros...
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {passengerCount > 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body1" fontWeight="bold">
                        Preencha os dados de {passengerCount} passageiro{passengerCount > 1 ? 's' : ''}
                      </Typography>
                      {passengerComposition && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {passengerComposition.adults} adulto{passengerComposition.adults > 1 ? 's' : ''}
                          {passengerComposition.children && passengerComposition.children.length > 0 && (
                            <>, {passengerComposition.children.length} criança{passengerComposition.children.length > 1 ? 's' : ''}</>
                          )}
                        </Typography>
                      )}
                    </Alert>
                  )}
                  
                  {(() => {
                    console.log('[CheckoutPage] Rendering PassengerForm with props:', {
                      passengerCount,
                      passengerTypes,
                      passengerTypesLength: passengerTypes?.length
                    });
                    return null;
                  })()}
                  
                  <PassengerForm
                    onSubmit={handlePassengerSubmit}
                    loading={bookingLoading}
                    passengerCount={passengerCount}
                    passengerTypes={passengerTypes}
                    defaultValues={{
                      firstName: user?.name?.split(' ')[0] || '',
                      lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                      email: user?.email || '',
                      phone: '',
                      document: '',
                      birthDate: ''
                    }}
                  />
                </>
              )}
            </>
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