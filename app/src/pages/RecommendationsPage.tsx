import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  IconButton,
  Divider
} from '@mui/material';
import { 
  ArrowBack, 
  Flight,  
  FlightTakeoff, 
  FlightLand,
  AirlineSeatReclineNormal,
  Refresh
} from '@mui/icons-material';
import { LATIN_AMERICA_AIRPORTS } from '../types/chat';
import { 
  useFlightSearch, 
  SearchDestinationParams
} from '../hooks/useFlightSearch';
import { useFlightSelection } from '../hooks/useFlightSelection';
import { PassengerComposition } from '../types/json-chat';
import { useHttpInterceptor } from '../utils/httpInterceptor';

/**
 * Página de Recomendações de Voos - Versão com React Query
 * Usa react-query para gerenciar estado e cache das chamadas da API
 */
function RecommendationsPage() {
  const navigate = useNavigate();
  const { origin, destination } = useParams<{ origin: string; destination: string }>();
  const [searchParams] = useSearchParams();
  const httpInterceptor = useHttpInterceptor();

  // State for passenger composition
  const [passengerComposition, setPassengerComposition] = useState<PassengerComposition | null>(null);
  const [loadingComposition, setLoadingComposition] = useState<boolean>(false);
  const [compositionError, setCompositionError] = useState<string | null>(null);

  // Extrair query params
  const departureDate = searchParams.get('departureDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const returnDate = searchParams.get('returnDate');
  const adults = parseInt(searchParams.get('adults') || '1');
  const nonStop = searchParams.get('nonStop') === 'true';
  const sessionId = searchParams.get('sessionId'); // Get sessionId from URL

  // Fetch passenger composition from session
  useEffect(() => {
    const fetchPassengerComposition = async () => {
      if (!sessionId) {
        console.log('No sessionId provided, skipping passenger composition fetch');
        return;
      }

      setLoadingComposition(true);
      setCompositionError(null);

      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await httpInterceptor.get(`${baseUrl}/sessions/collected-data/${sessionId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch session data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Fetched session data:', data);
        
        if (data.collectedData?.passenger_composition) {
          setPassengerComposition(data.collectedData.passenger_composition);
          console.log('Passenger composition loaded:', data.collectedData.passenger_composition);
        } else {
          console.log('No passenger composition found in session data');
        }
      } catch (error) {
        console.error('Error fetching passenger composition:', error);
        setCompositionError('Não foi possível carregar informações dos passageiros');
      } finally {
        setLoadingComposition(false);
      }
    };

    fetchPassengerComposition();
  }, [sessionId, httpInterceptor]);

  // Calculate total paying passengers (adults + children > 2 years)
  const payingPassengers = useMemo(() => {
    if (!passengerComposition) {
      return 1; // Default to 1 if no composition available
    }

    let count = passengerComposition.adults;
    
    if (passengerComposition.children) {
      // Count children over 2 years old as paying passengers
      count += passengerComposition.children.filter(child => child.age > 2).length;
    }

    return count;
  }, [passengerComposition]);

  // Preparar parâmetros de busca usando useMemo para evitar recriações
  const flightSearchParams = useMemo((): SearchDestinationParams | null => {
    if (!origin || !destination) {
        return null;
    }

    return {
      origin,
      destination,
      departureDate,
      returnDate: returnDate || undefined,
      adults,
      nonStop
    };
  }, [origin, destination, departureDate, returnDate, adults, nonStop]);

  // Usar react-query para buscar voos
  const { 
    data: flightData, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useFlightSearch(flightSearchParams);

  // Hook para seleção de voos
  const { selectFlight, loading: selectingFlight } = useFlightSelection();

  const flightOffers = useMemo(() => {
    const offers = flightData?.data || [];
    console.log('FlightData received:', flightData);
    console.log('Flight offers array:', offers);
    console.log('First offer:', offers[0]);
    console.log('First offer id:', offers[0]?.id);
    return offers;
  }, [flightData]);
  const dictionaries = useMemo(() => flightData?.dictionaries, [flightData]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  const getCityName = (code: string): string => {
    return LATIN_AMERICA_AIRPORTS[code as keyof typeof LATIN_AMERICA_AIRPORTS] || code;
  };

  // Handler para seleção de voo
  const handleFlightSelection = async (offer: any) => {
    try {
      console.log('Selecting flight with offer:', offer);
      console.log('Offer id:', offer?.id);
      console.log('Offer type:', typeof offer);
      console.log('Offer keys:', Object.keys(offer || {}));
      
      // Validate offer before proceeding
      if (!offer) {
        console.error('Offer is null or undefined');
        return;
      }
      
      if (!offer.id) {
        console.error('Offer does not have an id property');
        console.error('Offer structure:', offer);
        return;
      }
      
      const flightSelectionResult = await selectFlight(offer);
      console.log('Flight selection result:', flightSelectionResult);
      const { flightId } = flightSelectionResult;
      console.log('Extracted flightId:', flightId);
      console.log('FlightId type:', typeof flightId);
      console.log('FlightId is falsy:', !flightId);
      
      if (!flightId) {
        console.error('No flightId received from selectFlight');
        return;
      }
      
      // Navegar para checkout com o flightId interno e sessionId
      const checkoutUrl = sessionId 
        ? `/checkout/${flightId}?sessionId=${sessionId}`
        : `/checkout/${flightId}`;
      
      console.log('Navigating to checkout:', checkoutUrl);
      navigate(checkoutUrl);
    } catch (error) {
      console.error('Erro ao selecionar voo:', error);
      // TODO: Mostrar toast de erro para o usuário
    }
  };

  // Validar parâmetros obrigatórios
  if (!origin || !destination) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Parâmetros inválidos
          </Typography>
          <Typography variant="body1">
            É necessário fornecer origem e destino para buscar voos.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/destinos')}
            sx={{ mt: 2 }}
          >
            Voltar para Seleção de Destinos
          </Button>
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            🔍 Buscando os melhores voos para você...
          </Typography>
          {flightSearchParams && (
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
              {flightSearchParams.origin} → {flightSearchParams.destination}
            </Typography>
          )}
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {(error as any)?.message || 'Erro ao carregar recomendações'}
        </Alert>
        <Stack direction="row" spacing={2}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/chat')}
            variant="contained"
          >
            Voltar ao Chat
          </Button>
          <Button
            startIcon={<Refresh />}
            onClick={() => refetch()}
            variant="outlined"
            disabled={isRefetching}
          >
            {isRefetching ? 'Tentando...' : 'Tentar Novamente'}
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate('/chat')} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Recomendações de Voos
            </Typography>
          </Box>
          
          <Button
            startIcon={<Refresh />}
            onClick={() => refetch()}
            variant="outlined"
            disabled={isRefetching}
            size="small"
          >
            {isRefetching ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </Box>
        
        {destination && (
          <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
            <Typography variant="h6">
              🎯 Destino Recomendado: {destination}
            </Typography>
            {flightSearchParams && (
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Saindo de {getCityName(flightSearchParams.origin)} • {new Date(flightSearchParams.departureDate).toLocaleDateString('pt-BR')}
              </Typography>
            )}
          </Paper>
        )}
      </Box>

      {/* Lista de Voos */}
      {flightOffers.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            ✈️ {flightOffers.length} voo(s) encontrado(s)
          </Typography>
          
          {flightOffers.map((offer) => (
            <Card elevation={3} key={offer.id} sx={{ 
              '&:hover': { 
                boxShadow: 6,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {getCityName(offer.itineraries[0].segments[0].departure.iataCode)} → {getCityName(offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1].arrival.iataCode)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dictionaries?.carriers[offer.validatingAirlineCodes[0]] || offer.validatingAirlineCodes[0]}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {formatCurrency(parseFloat(offer.price.total) * 100)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total por pessoa
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Detalhes do voo */}
                {offer.itineraries.map((itinerary, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FlightTakeoff color="primary" />
                        <Typography variant="body2" fontWeight="medium">
                          {new Date(itinerary.segments[0].departure.at).toLocaleString('pt-BR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                      
                      <Flight color="action" />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FlightLand color="primary" />
                        <Typography variant="body2" fontWeight="medium">
                          {new Date(itinerary.segments[itinerary.segments.length - 1].arrival.at).toLocaleString('pt-BR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        ⏱️ {itinerary.duration.replace('PT', '').replace('H', 'h ').replace('M', 'm')}
                      </Typography>
                    </Stack>
                    
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                      <Chip 
                        label={`${itinerary.segments.length === 1 ? '✈️ Voo Direto' : `🔄 ${itinerary.segments.length - 1} escala(s)`}`}
                        size="small"
                        color={itinerary.segments.length === 1 ? 'success' : 'default'}
                        variant={itinerary.segments.length === 1 ? 'filled' : 'outlined'}
                      />
                      <Chip 
                        label={`🪑 ${offer.numberOfBookableSeats} assentos`}
                        size="small"
                        variant="outlined"
                        color={offer.numberOfBookableSeats <= 3 ? 'warning' : 'default'}
                      />
                      <Chip 
                        label={`💼 ${offer.price.currency}`}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                  </Box>
                ))}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleFlightSelection(offer)}
                    startIcon={<AirlineSeatReclineNormal />}
                    size="large"
                    sx={{ minWidth: 160 }}
                    disabled={selectingFlight}
                  >
                    {selectingFlight ? 'Selecionando...' : 'Selecionar Voo'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            😔 Nenhum voo encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Não encontramos voos para os critérios especificados no momento.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              onClick={() => navigate('/chat')}
            >
              Voltar ao Chat
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              {isRefetching ? 'Tentando...' : 'Tentar Novamente'}
            </Button>
          </Stack>
        </Paper>
      )}
    </Container>
  );
}

export default RecommendationsPage;