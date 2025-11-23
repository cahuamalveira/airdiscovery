import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Stack,
  Alert,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
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
 * Componente principal da página de checkout
 */
const CheckoutPage: React.FC = () => {
  const { flightId } = useParams<{ flightId: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const navigate = useNavigate();
  const { user } = useAuth();
  const httpInterceptor = useHttpInterceptor();
  
  // Ref to track if component is mounted (for cleanup)
  const isMountedRef = useRef(true);

  // Estados do componente
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [passengerComposition, setPassengerComposition] = useState<PassengerComposition | null>(null);
  const [loadingComposition, setLoadingComposition] = useState<boolean>(false);
  const [compositionError, setCompositionError] = useState<string | null>(null);

  // Hooks customizados
  const { createBooking, loading: bookingLoading } = useBooking();
  const { paymentStatus } = usePixPayment();
  const {
    activeStep,
    steps,
    handleNext,
    handleBack,
    handleStepClick,
    isStepClickable
  } = useCheckoutSteps();

  // Buscar dados do voo pelo ID interno
  const { flight, loading: flightLoading, error: flightError } = useFlight(flightId);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Verificar se temos os dados necessários
  useEffect(() => {
    if (!flightId) {
      navigate('/voos');
    }
  }, [flightId, navigate]);

  // Fetch passenger composition from chat session
  useEffect(() => {
    const defaultComposition = { adults: 1, children: null };
    
    // No sessionId? Use default immediately
    if (!sessionId) {
      setPassengerComposition(defaultComposition);
      return;
    }

    let cancelled = false;
    setLoadingComposition(true);
    setCompositionError(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    httpInterceptor
      .get(`${apiUrl}/sessions/collected-data/${sessionId}`)
      .then(response => response.json())
      .then(data => {
        if (cancelled) return;
        
        const composition = data.collectedData?.passenger_composition;
        const isValid = composition?.adults > 0;
        
        setPassengerComposition(isValid ? composition : defaultComposition);
      })
      .catch(error => {
        if (cancelled) return;
        
        console.error('Error fetching passenger composition:', error);
        setCompositionError('Não foi possível carregar os dados dos passageiros');
        setPassengerComposition(defaultComposition);
      })
      .finally(() => {
        if (!cancelled) setLoadingComposition(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Converter dados internos para formato compatível com componentes existentes
  const flightOffer = useMemo((): AmadeusFlightOffer | null => {
    if (!flight?.amadeusOfferPayload) {
      return null;
    }
    return flight.amadeusOfferPayload as AmadeusFlightOffer;
  }, [flight]);

  // Extrair dictionaries se disponível (pode ser null para backwards compatibility)
  const dictionaries = useMemo((): AmadeusDictionaries | undefined => {
    // Por enquanto, dictionaries será undefined já que não está sendo armazenado na entidade Flight
    // Isso é aceitável pois os componentes devem ser capazes de lidar com dictionaries undefined
    return undefined;
  }, []);

  // Generate passenger types array from composition
  const passengerTypes = useMemo((): PassengerType[] => {
    if (!passengerComposition) {
      return [];
    }

    const types: PassengerType[] = [];

    // Add adults
    for (let i = 0; i < passengerComposition.adults; i++) {
      types.push({ index: types.length, type: 'adult' });
    }

    // Add children
    const childrenCount = passengerComposition.children || 0;
    for (let i = 0; i < childrenCount; i++) {
      types.push({
        index: types.length,
        type: 'child'
      });
    }

    return types;
  }, [passengerComposition]);

  // Calculate total passenger count
  const passengerCount = useMemo(() => {
    return passengerTypes.length;
  }, [passengerTypes]);

  // Navegação para confirmação apenas quando pagamento for aprovado
  useEffect(() => {
    if (paymentStatus === 'success' && bookingData) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          navigate(`/confirmation/${bookingData.id}`);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, bookingData, navigate]);

  // Função para lidar com envio do formulário de passageiro
  const handlePassengerSubmit = useCallback(async (data: PassengerFormData | PassengerFormData[]) => {
    if (!flightId || !flightOffer) {
      console.error('Dados do voo não disponíveis');
      return;
    }

    try {
      console.log('Creating booking with data:', data);
      const booking = await createBooking(flightId, flightOffer, data);
      console.log('Booking created successfully:', booking);
      
      setBookingData(booking);
      console.log('Moving to next step...');
      handleNext();
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      alert('Erro ao criar reserva. Por favor, tente novamente.');
    }
  }, [flightId, flightOffer, createBooking, handleNext]);

  // Funções personalizadas para passar bookingData para os hooks
  const handleCustomStepClick = useCallback((stepIndex: number) => {
    handleStepClick(stepIndex, bookingData);
  }, [handleStepClick, bookingData]);

  const isCustomStepClickable = useCallback((stepIndex: number) => {
    return isStepClickable(stepIndex, bookingData);
  }, [isStepClickable, bookingData]);

  // Loading state - only show if flight is loading
  // Passenger composition loading happens in background
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
                          {passengerComposition.children && passengerComposition.children > 0 && (
                            <>, {passengerComposition.children} criança{passengerComposition.children > 1 ? 's' : ''}</>
                          )}
                        </Typography>
                      )}
                    </Alert>
                  )}
                  
                  <PassengerForm
                    onSubmit={handlePassengerSubmit}
                    loading={bookingLoading}
                    passengerCount={passengerCount}
                    passengerTypes={passengerTypes}
                    defaultValues={{
                      firstName: '',
                      lastName: '',
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

          {activeStep === 2 && bookingData && flightOffer && (
            <PaymentSection
              onBack={handleBack}
              bookingId={bookingData.id}
              amount={bookingData.totalAmount}
              description={`Voo ${flightOffer.itineraries[0].segments[0].departure.iataCode} → ${flightOffer.itineraries[0].segments[flightOffer.itineraries[0].segments.length - 1].arrival.iataCode}`}
              paymentStatus={paymentStatus}
              onPaymentSuccess={handleNext}
              onPaymentError={(error: any) => {
                console.error('Erro no pagamento:', error);
              }}
            />
          )}

          {activeStep === 3 && bookingData && (
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
                  onClick={() => navigate(`/minhas-reservas/${bookingData.id}`)}
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
            <PriceSummaryComponent 
              flightOffer={flightOffer} 
              loading={bookingLoading}
              passengerCount={passengerCount}
            />
          </Stack>
        </Box>
      </Box>
    </Container>
  );
};

export default CheckoutPage;