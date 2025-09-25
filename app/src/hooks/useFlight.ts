import { useState, useEffect } from 'react';
import { useHttpInterceptor } from '@/utils/httpInterceptor';

export interface Flight {
  id: string;
  amadeusOfferId: string;
  flightNumber: string;
  departureCode: string;
  arrivalCode: string;
  departureDateTime: string;
  arrivalDateTime: string;
  priceTotal: number;
  currency: string;
  amadeusOfferPayload: any; // Complete Amadeus offer data
}

/**
 * Hook para buscar dados de voo pelo ID interno
 */
export const useFlight = (flightId: string | undefined) => {
  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const httpInterceptor = useHttpInterceptor();

  useEffect(() => {
    if (!flightId) {
      setFlight(null);
      setError(null);
      return;
    }

    const fetchFlight = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await httpInterceptor.get(
          `${import.meta.env.VITE_API_URL}/flights/${flightId}`
        );
        
        const flightData: Flight = await response.json();
        setFlight(flightData);
      } catch (error) {
        console.error('Erro ao buscar dados do voo:', error);
        setError('Erro ao carregar dados do voo');
        setFlight(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFlight();
  }, [flightId, httpInterceptor]);

  const refetch = () => {
    if (flightId) {
      // Trigger the useEffect again by creating a new request
      setLoading(true);
      setError(null);
    }
  };

  return {
    flight,
    loading,
    error,
    refetch
  };
};