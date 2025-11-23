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
  const passengers = bookingData.passengers || [];

  if (passengers.length === 0) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Erro nos Dados da Reserva
          </Typography>
          <Typography variant="body1" color="error">
            Dados dos passageiros não encontrados.
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
        
        <Stack spacing={3}>
          {passengers.map((passenger, index) => (
            <Box key={index}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Passageiro {index + 1}
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Nome Completo</Typography>
                  <Typography variant="body1">
                    {passenger.firstName} {passenger.lastName}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{passenger.email}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Telefone</Typography>
                  <Typography variant="body1">{passenger.phone}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">CPF</Typography>
                  <Typography variant="body1">{passenger.document}</Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">Data de Nascimento</Typography>
                  <Typography variant="body1">
                    {new Date(passenger.birthDate).toLocaleDateString('pt-BR')}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ))}
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