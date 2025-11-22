import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import { useBookingHistory } from '../hooks/useBookingHistory';
import BookingCard from '../components/booking/BookingCard';

const BookingHistoryPage = () => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { bookings, isLoading, isError, error, meta, refetch } = useBookingHistory({
    page,
    limit,
  });

  // Sort bookings by createdAt in descending order (most recent first)
  const sortedBookings = [...bookings].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(meta.totalPages, prev + 1));
  };

  // Use meta.page instead of local page state for display
  const currentPage = meta.page;

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error state
  if (isError) {
    return (
      <Container maxWidth="lg">
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
          gap={2}
        >
          <Typography variant="h6" color="error" textAlign="center">
            Não foi possível carregar suas reservas. Verifique sua conexão.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => refetch()}>
            Tentar Novamente
          </Button>
        </Box>
      </Container>
    );
  }

  // Empty state
  if (bookings.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
          gap={2}
        >
          <Typography variant="h6" textAlign="center">
            Você ainda não possui reservas.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/search"
          >
            Buscar Voos
          </Button>
        </Box>
      </Container>
    );
  }

  // Success state with bookings
  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Minhas Reservas
        </Typography>

        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {sortedBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </Box>

        {/* Pagination controls - only show if more than one page */}
        {meta.totalPages > 1 && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={2}
            mt={4}
          >
            <Button
              variant="outlined"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Typography>
              Página {currentPage} de {meta.totalPages}
            </Typography>
            <Button
              variant="outlined"
              onClick={handleNextPage}
              disabled={currentPage === meta.totalPages}
            >
              Próxima
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default BookingHistoryPage;
