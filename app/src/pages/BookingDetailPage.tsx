import React from 'react';
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
import BoardingPassCard from '../components/booking/BoardingPassCard';
import PassengerDetailsSection from '../components/booking/PassengerDetailsSection';
import PaymentDetailsSection from '../components/booking/PaymentDetailsSection';

const BookingDetailPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { booking, isLoading, isError, error, refetch } = useBookingDetail(bookingId || '');

  const handleBack = () => {
    navigate('/minhas-reservas');
  };

  const handleRetry = () => {
    refetch();
  };

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
      {!isLoading && !isError && booking && (
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
            Detalhes da Reserva
          </Typography>

          <Stack spacing={4}>
            {/* Boarding Pass Card */}
            <BoardingPassCard 
              booking={booking}
              flight={{
                flightNumber: 'G3-738',
                departureCode: 'GYN',
                arrivalCode: 'GIG',
                departureDateTime: '2025-12-13T10:05:00Z',
                arrivalDateTime: '2025-12-13T11:50:00Z',
                airline: 'GOL',
              }}
            />

            {/* Passenger Details Section */}
            <PassengerDetailsSection passengers={booking.passengers} />

            {/* Payment Details Section */}
            <PaymentDetailsSection
              status={booking.status}
              totalAmount={booking.totalAmount}
              currency={booking.currency || 'BRL'}
              paymentDate={booking.createdAt}
              paymentMethod={booking.payments?.[0]?.paymentMethod}
            />
          </Stack>
        </Box>
      )}
    </Container>
  );
};

export default BookingDetailPage;
