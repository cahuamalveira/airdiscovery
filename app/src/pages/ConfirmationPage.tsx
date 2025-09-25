import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Stack,
  Alert,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Flight as FlightIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useHttpInterceptor } from '@/utils/httpInterceptor';
import { BookingData } from '@/components/checkout/types';
import { useFlight } from '@/hooks/useFlight';

/**
 * Página de confirmação de reserva
 */
const ConfirmationPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const httpInterceptor = useHttpInterceptor();
  
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch flight details if we have the booking
  const { flight, loading: flightLoading } = useFlight(booking?.flightId);

  // Fetch booking data
  useEffect(() => {
    if (!bookingId) return;

    const fetchBooking = async () => {
      try {
        setLoading(true);
        const response = await httpInterceptor.get(
          `${import.meta.env.VITE_API_URL}/bookings/${bookingId}`
        );
        const bookingData: BookingData = await response.json();
        setBooking(bookingData);
      } catch (error) {
        console.error('Erro ao buscar reserva:', error);
        setError('Erro ao carregar dados da reserva');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, httpInterceptor]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Carregando confirmação...
        </Typography>
      </Container>
    );
  }

  if (error || !booking) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Erro ao carregar confirmação
          </Typography>
          <Typography variant="body1">
            {error || 'Reserva não encontrada'}
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

  const primaryPassenger = booking.passengers[0];
  const flightOffer = flight?.amadeusOfferPayload;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header de Confirmação */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <CheckCircleIcon 
          color="success" 
          sx={{ fontSize: 80, mb: 2 }} 
        />
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Reserva Confirmada!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          ID da Reserva: {booking.id}
        </Typography>
      </Box>

      {/* Informações do Voo */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <FlightIcon sx={{ mr: 1 }} />
            Detalhes do Voo
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {flightLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography>Carregando detalhes do voo...</Typography>
            </Box>
          ) : flight ? (
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">
                  <strong>Voo:</strong> {flight.flightNumber}
                </Typography>
                <Chip 
                  label={booking.status} 
                  color={booking.status === 'PAID' ? 'success' : 'warning'}
                  variant="outlined"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">
                  <strong>Origem:</strong> {flight.departureCode}
                </Typography>
                <Typography variant="body1">
                  <strong>Destino:</strong> {flight.arrivalCode}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">
                  <strong>Partida:</strong> {new Date(flight.departureDateTime).toLocaleString('pt-BR')}
                </Typography>
                <Typography variant="body1">
                  <strong>Chegada:</strong> {new Date(flight.arrivalDateTime).toLocaleString('pt-BR')}
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Typography color="text.secondary">
              Detalhes do voo não disponíveis
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Informações do Passageiro */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 1 }} />
            Informações do Passageiro
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {primaryPassenger && (
            <Stack spacing={1}>
              <Typography variant="body1">
                <strong>Nome:</strong> {primaryPassenger.firstName} {primaryPassenger.lastName}
              </Typography>
              <Typography variant="body1">
                <strong>Email:</strong> {primaryPassenger.email}
              </Typography>
              <Typography variant="body1">
                <strong>Telefone:</strong> {primaryPassenger.phone}
              </Typography>
              <Typography variant="body1">
                <strong>Documento:</strong> {primaryPassenger.document}
              </Typography>
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Resumo de Pagamento */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resumo de Pagamento
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1">Total:</Typography>
            <Typography variant="h6" fontWeight="bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: booking.currency || 'BRL'
              }).format(booking.totalAmount / 100)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Próximos Passos */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body1" gutterBottom>
          <EmailIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
          Um email de confirmação foi enviado para {primaryPassenger?.email}
        </Typography>
        <Typography variant="body2">
          Certifique-se de chegar ao aeroporto com pelo menos 2 horas de antecedência para voos nacionais.
        </Typography>
      </Alert>

      {/* Ações */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/voos')}
          startIcon={<FlightIcon />}
        >
          Buscar Novos Voos
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate('/')}
          startIcon={<HomeIcon />}
        >
          Voltar ao Início
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => window.location.reload()}
          startIcon={<RefreshIcon />}
        >
          Atualizar
        </Button>
      </Stack>
    </Container>
  );
};

export default ConfirmationPage;