import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
} from '@mui/material';
import { BookingData } from './types';

interface BookingConfirmationProps {
  bookingData: BookingData;
  onBack: () => void;
  onConfirm: () => void;
}

/**
 * Componente para confirmar dados da reserva
 */
export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  bookingData,
  onBack,
  onConfirm
}) => {
  // Use the first passenger (primary passenger)
  const primaryPassenger = bookingData.passengers?.[0];

  if (!primaryPassenger) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Erro nos Dados da Reserva
          </Typography>
          <Typography variant="body1" color="error">
            Dados do passageiro não encontrados.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Confirme seus Dados
        </Typography>
        
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">Nome Completo</Typography>
            <Typography variant="body1">
              {primaryPassenger.firstName} {primaryPassenger.lastName}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">Email</Typography>
            <Typography variant="body1">{primaryPassenger.email}</Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">Telefone</Typography>
            <Typography variant="body1">{primaryPassenger.phone}</Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">CPF</Typography>
            <Typography variant="body1">{primaryPassenger.document}</Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">Data de Nascimento</Typography>
            <Typography variant="body1">
              {new Date(primaryPassenger.birthDate).toLocaleDateString('pt-BR')}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button onClick={onBack}>
            Voltar
          </Button>
          <Button
            variant="contained"
            onClick={onConfirm}
          >
            Confirmar
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};