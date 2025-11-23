import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Skeleton,
  Stack,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useBookingDetail } from '../hooks/useBookingDetail';
import { useFlight } from '../hooks/useFlight';
import BoardingPassCard from '../components/booking/BoardingPassCard';
import PassengerDetailsSection from '../components/booking/PassengerDetailsSection';
import PaymentDetailsSection from '../components/booking/PaymentDetailsSection';
import { AmadeusFlightOffer } from '../hooks/useFlightSearch';

const BookingDetailPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { booking, isLoading: isLoadingBooking, isError, error, refetch } = useBookingDetail(bookingId || '');
  
  // Fetch flight data dynamically based on booking.flightId
  const { flight, loading: isLoadingFlight } = useFlight(booking?.flightId);
  
  const isLoading = isLoadingBooking || isLoadingFlight;

  const handleBack = () => {
    navigate('/minhas-reservas');
  };

  const handleRetry = () => {
    refetch();
  };

  // Extract flight details from Amadeus offer - supports multiple itineraries (round-trip)
  const flightItineraries = useMemo(() => {
    if (!flight?.amadeusOfferPayload) return [];
    
    const offer = flight.amadeusOfferPayload as AmadeusFlightOffer;
    
    // Map each itinerary to boarding pass data
    return offer.itineraries.map((itinerary, index) => {
      const firstSegment = itinerary.segments[0];
      const lastSegment = itinerary.segments[itinerary.segments.length - 1];
      
      return {
        flightNumber: `${firstSegment.carrierCode}-${firstSegment.number}`,
        departureCode: firstSegment.departure.iataCode,
        arrivalCode: lastSegment.arrival.iataCode,
        departureDateTime: firstSegment.departure.at,
        arrivalDateTime: lastSegment.arrival.at,
        airline: firstSegment.carrierCode,
        itineraryIndex: index,
      };
    });
  }, [flight]);

  // Determine error type
  const errorStatus = (error as any)?.status;
  const is404 = errorStatus === 404;
  const is401 = errorStatus === 401;
  const is500 = errorStatus === 500;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button - Always visible */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          variant="text"
          data-testid="back-button"
        >
          Voltar para Minhas Reservas
        </Button>
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Box data-testid="loading-skeleton">
          <Skeleton variant="text" width="60%" height={60} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={300} sx={{ mb: 3, borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
        </Box>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <Box>
          {is404 ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Reserva não encontrada
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                A reserva que você está procurando não existe ou foi removida.
              </Typography>
              <Button
                variant="contained"
                onClick={handleBack}
                sx={{ mt: 1 }}
              >
                Voltar para Minhas Reservas
              </Button>
            </Alert>
          ) : is401 ? (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Você não tem permissão para acessar esta reserva
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Esta reserva pertence a outro usuário ou você precisa fazer login novamente.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{ mt: 1 }}
              >
                Fazer Login
              </Button>
            </Alert>
          ) : is500 ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Erro no servidor
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Ocorreu um erro no servidor. Por favor, tente novamente mais tarde.
              </Typography>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={handleRetry}
                sx={{ mt: 1 }}
              >
                Tentar Novamente
              </Button>
            </Alert>
          ) : (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Não foi possível carregar os detalhes da reserva
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {error?.message || 'Ocorreu um erro ao buscar os dados da reserva.'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={handleRetry}
                sx={{ mt: 1 }}
              >
                Tentar Novamente
              </Button>
            </Alert>
          )}
        </Box>
      )}

      {/* Success State - Display Booking Details */}
      {!isLoading && !isError && booking && flightItineraries.length > 0 && (
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
            Detalhes da Reserva
          </Typography>

          <Stack spacing={4}>
            {/* Boarding Pass Cards - One for each itinerary (outbound + return for round-trip) */}
            {flightItineraries.map((itinerary, index) => (
              <Box key={index}>
                {flightItineraries.length > 1 && (
                  <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
                    {index === 0 ? '✈️ Voo de Ida' : '✈️ Voo de Volta'}
                  </Typography>
                )}
                <BoardingPassCard 
                  booking={booking}
                  flight={itinerary}
                />
              </Box>
            ))}

            {/* Passenger Details Section */}
            <PassengerDetailsSection passengers={booking.passengers} />

            {/* Payment Details Section */}
            {/* <PaymentDetailsSection
              status={booking.status}
              totalAmount={booking.totalAmount}
              currency={booking.currency || 'BRL'}
              paymentDate={booking.createdAt}
              paymentMethod={booking.payments?.[0]?.paymentMethod}
            /> */}
          </Stack>
        </Box>
      )}
      
      {/* Handle case where booking exists but flight data is missing */}
      {!isLoading && !isError && booking && flightItineraries.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dados do voo não disponíveis
          </Typography>
          <Typography variant="body2">
            Não foi possível carregar os detalhes do voo para esta reserva.
          </Typography>
        </Alert>
      )}
    </Container>
  );
};

export default BookingDetailPage;
