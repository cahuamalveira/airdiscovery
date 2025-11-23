import { useState } from 'react';
import { useHttpInterceptor } from '@/utils/httpInterceptor';
import { PassengerFormData } from '@/components/checkout/PassengerForm';
import { BookingData } from '@/components/checkout/types';
import { AmadeusFlightOffer } from '@/hooks/useFlightSearch';

export const useBooking = () => {
  const [loading, setLoading] = useState(false);
  const httpInterceptor = useHttpInterceptor();

  const createBooking = async (
    flightId: string,
    flightOffer: AmadeusFlightOffer,
    passengerData: PassengerFormData | PassengerFormData[]
  ): Promise<BookingData> => {
    try {
      setLoading(true);
      
      const passengersArray = Array.isArray(passengerData) ? passengerData : [passengerData];
      const passengerCount = passengersArray.length;
      
      // Copy email and phone from primary passenger to all others
      const passengers = passengersArray.map((passenger, index) => {
        if (index === 0) return passenger; // Primary passenger keeps all data
        
        return {
          ...passenger,
          email: passengersArray[0].email, // Use primary passenger's email
          phone: passengersArray[0].phone, // Use primary passenger's phone
        };
      });
      
      const bookingPayload = {
        flightId,
        passengers,
        totalAmount: parseFloat(flightOffer?.price?.grandTotal || '0') * passengerCount,
        currency: flightOffer?.price?.currency || 'BRL'
      };

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
