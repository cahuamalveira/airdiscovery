import { useState } from 'react';
import { useHttpInterceptor } from '@/utils/httpInterceptor';
import { AmadeusFlightOffer } from '@/hooks/useFlightSearch';

export interface FlightSelectionResponse {
  flightId: string;
}

/**
 * Hook para selecionar voos e criar entidades Flight internas
 */
export const useFlightSelection = () => {
  const [loading, setLoading] = useState(false);
  const httpInterceptor = useHttpInterceptor();

  /**
   * Seleciona um voo criando uma entidade Flight interna
   * @param flightOffer - Oferta da Amadeus selecionada
   * @returns Promise com o flightId interno
   */
  const selectFlight = async (flightOffer: AmadeusFlightOffer): Promise<FlightSelectionResponse> => {
    try {
      setLoading(true);
      
      console.log('selectFlight called with flightOffer:', flightOffer);
      console.log('flightOffer.id:', flightOffer?.id);
      console.log('flightOffer type:', typeof flightOffer);
      
      const payload = {
        amadeusOfferId: flightOffer.id,
        offerPayload: flightOffer
      };

      console.log('Payload being sent:', payload);
      console.log('amadeusOfferId:', payload.amadeusOfferId);
      console.log('offerPayload type:', typeof payload.offerPayload);

      const response = await httpInterceptor.post(
        `${import.meta.env.VITE_API_URL}/flights/from-offer`, 
        payload
      );
      
      const result = await response.json();
      console.log('Flight selection response:', result);
      
      // The backend returns { flightId: string }
      const flightSelectionResponse: FlightSelectionResponse = {
        flightId: result.flightId
      };
      
      console.log('Processed flight selection response:', flightSelectionResponse);
      
      if (!flightSelectionResponse.flightId) {
        throw new Error('FlightId not received from server');
      }
      
      return flightSelectionResponse;
    } catch (error) {
      console.error('Erro ao selecionar voo:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    selectFlight,
    loading
  };
};