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
}

/**
 * Componente para resumo de preços
 */
export const PriceSummary: React.FC<PriceSummaryProps> = ({ 
  flightOffer, 
  loading = false 
}) => {
  const basePrice = parseFloat(flightOffer.price.base);
  const totalPrice = parseFloat(flightOffer.price.grandTotal);
  const taxes = totalPrice - basePrice;

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

  return (
    <Card elevation={2} sx={{ bgcolor: 'grey.50' }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Resumo do Pagamento
        </Typography>
        
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Tarifa Básica
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