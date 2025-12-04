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

  const renderItinerary = (itinerary: any, index: number) => {
    const firstSegment = itinerary.segments[0];
    const lastSegment = itinerary.segments[itinerary.segments.length - 1];
    
    const departureAirport = dictionaries?.locations?.[firstSegment.departure.iataCode];
    const arrivalAirport = dictionaries?.locations?.[lastSegment.arrival.iataCode];
    const airline = dictionaries?.carriers?.[firstSegment.carrierCode];

    // Label for round-trip flights
    const isRoundTrip = flightOffer.itineraries.length > 1;
    const label = isRoundTrip ? (index === 0 ? 'Ida' : 'Volta') : null;

    return (
      <Box key={index}>
        {label && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FlightTakeoffIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight="bold" color="primary">
              {label}
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" fontWeight="bold">
              {formatDate(firstSegment.departure.at).split(' ')[1]}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {firstSegment.departure.iataCode}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {departureAirport?.cityCode || firstSegment.departure.iataCode}
            </Typography>
          </Box>
          
          <Box sx={{ flex: 1, textAlign: 'center', mx: 2 }}>
            <FlightTakeoffIcon color="primary" />
            <Typography variant="body2" color="text.secondary">
              {formatDuration(itinerary.duration)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {airline || firstSegment.carrierCode} • {firstSegment.aircraft?.code || 'N/A'}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" fontWeight="bold">
              {formatDate(lastSegment.arrival.at).split(' ')[1]}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lastSegment.arrival.iataCode}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {arrivalAirport?.cityCode || lastSegment.arrival.iataCode}
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Data do Voo
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {formatDate(firstSegment.departure.at).split(' ')[0]}
          </Typography>
        </Box>
      </Box>
    );
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
        
        {flightOffer.itineraries.map((itinerary, index) => (
          <React.Fragment key={index}>
            {index > 0 && <Divider sx={{ my: 3 }} />}
            {renderItinerary(itinerary, index)}
          </React.Fragment>
        ))}
      </CardContent>
    </Card>
  );
};