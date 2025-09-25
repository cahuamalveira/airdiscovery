import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
} from '@mui/material';
import {
  Flight as FlightIcon,
  FlightTakeoff as FlightTakeoffIcon,
} from '@mui/icons-material';
import { AmadeusFlightOffer, AmadeusDictionaries } from '@/hooks/useFlightSearch';

interface FlightSummaryProps {
  flightOffer: AmadeusFlightOffer;
  dictionaries?: AmadeusDictionaries;
}

/**
 * Componente para exibir informações do voo
 */
export const FlightSummary: React.FC<FlightSummaryProps> = ({ 
  flightOffer, 
  dictionaries 
}) => {
  // Extrair informações dos itinerários
  const itinerary = flightOffer.itineraries[0];
  const segment = itinerary.segments[0];
  
  const departureAirport = dictionaries?.locations?.[segment.departure.iataCode];
  const arrivalAirport = dictionaries?.locations?.[segment.arrival.iataCode];
  const airline = dictionaries?.carriers?.[segment.carrierCode];

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (duration: string) => {
    // Converter PT2H30M para "2h 30m"
    const match = duration.match(/PT(\d+)H(\d+)M/);
    if (match) {
      return `${match[1]}h ${match[2]}m`;
    }
    return duration;
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FlightIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight="bold">
            Detalhes do Voo
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" fontWeight="bold">
              {formatDate(segment.departure.at).split(' ')[1]}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {segment.departure.iataCode}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {departureAirport?.cityCode || segment.departure.iataCode}
            </Typography>
          </Box>
          
          <Box sx={{ flex: 1, textAlign: 'center', mx: 2 }}>
            <FlightTakeoffIcon color="primary" />
            <Typography variant="body2" color="text.secondary">
              {formatDuration(itinerary.duration)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {airline || segment.carrierCode} • {segment.aircraft?.code || 'N/A'}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" fontWeight="bold">
              {formatDate(segment.arrival.at).split(' ')[1]}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {segment.arrival.iataCode}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {arrivalAirport?.cityCode || segment.arrival.iataCode}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />
        
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Data do Voo
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {formatDate(segment.departure.at).split(' ')[0]}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};