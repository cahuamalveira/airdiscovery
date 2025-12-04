import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
  Skeleton,
} from '@mui/material';
import { AmadeusFlightOffer } from '@/hooks/useFlightSearch';

interface PriceSummaryProps {
  flightOffer: AmadeusFlightOffer;
  loading?: boolean;
  passengerCount?: number;
}

/**
 * Componente para resumo de preços
 */
export const PriceSummary: React.FC<PriceSummaryProps> = ({ 
  flightOffer, 
  loading = false,
  passengerCount = 1
}) => {
  const basePricePerPassenger = parseFloat(flightOffer.price.base);
  const totalPricePerPassenger = parseFloat(flightOffer.price.grandTotal);
  const taxesPerPassenger = totalPricePerPassenger - basePricePerPassenger;
  
  // Multiply by passenger count
  const basePrice = basePricePerPassenger * passengerCount;
  const totalPrice = totalPricePerPassenger * passengerCount;
  const taxes = taxesPerPassenger * passengerCount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  if (loading) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Skeleton height={200} />
        </CardContent>
      </Card>
    );
  }

  // Check if this is a round-trip flight
  const isRoundTrip = flightOffer.itineraries.length > 1;

  return (
    <Card elevation={2} sx={{ bgcolor: 'grey.50' }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Resumo do Pagamento
        </Typography>
        
        {isRoundTrip && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Voo ida e volta
          </Typography>
        )}
        
        {passengerCount > 1 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {passengerCount} passageiro{passengerCount > 1 ? 's' : ''}
          </Typography>
        )}
        
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Tarifa Básica {passengerCount > 1 ? `(${passengerCount}x ${formatCurrency(basePricePerPassenger)})` : ''}
            </Typography>
            <Typography variant="body2">
              {formatCurrency(basePrice)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Taxas e Impostos
            </Typography>
            <Typography variant="body2">
              {formatCurrency(taxes)}
            </Typography>
          </Box>
          
          <Divider />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              Total
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {formatCurrency(totalPrice)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};