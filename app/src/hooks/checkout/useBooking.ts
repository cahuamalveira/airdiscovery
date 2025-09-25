import { useState } from 'react';
import { useHttpInterceptor } from '@/utils/httpInterceptor';
import { PassengerFormData } from '@/components/checkout/PassengerForm';
import { BookingData } from '@/components/checkout/types';
import { AmadeusFlightOffer } from '@/hooks/useFlightSearch';

/**
 * Hook para gerenciar reservas
 */
export const useBooking = () => {
  const [loading, setLoading] = useState(false);
  const httpInterceptor = useHttpInterceptor();

  const createBooking = async (
    flightId: string,
    flightOffer: AmadeusFlightOffer,
    passengerData: PassengerFormData
  ): Promise<BookingData> => {
    try {
      setLoading(true);
      
      // Debug logs
      console.log('Creating booking with flightId:', flightId);
      console.log('FlightId type:', typeof flightId);
      console.log('FlightId is empty:', !flightId);
      
      const bookingPayload = {
        flightId: flightId, // Use only the internal flightId
        passengers: [passengerData],
        totalAmount: parseFloat(flightOffer?.price?.grandTotal || '0'),
        currency: flightOffer?.price?.currency || 'BRL'
        // Removed flightInfo - no longer needed as Flight entity is already created
      };

      console.log('Booking payload:', bookingPayload);

      const response = await httpInterceptor.post(`${import.meta.env.VITE_API_URL}/bookings`, bookingPayload);
      const result = await response.json();
      
      return result.data as BookingData;
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createBooking,
    loading
  };
};