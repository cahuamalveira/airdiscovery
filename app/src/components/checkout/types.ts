import { PassengerFormData } from './PassengerForm';

/**
 * Interface para dados de reserva - atualizada para corresponder ao backend
 */
export interface BookingData {
  id: string;
  flightId: string;
  userId: string;
  status: 'PENDING' | 'AWAITING_PAYMENT' | 'PAID' | 'CANCELLED';
  passengers: PassengerFormData[]; // Mudou de passengerData para passengers (array)
  totalAmount: number;
  currency: string;
  payments: Array<{
    amount: number;
    method: string;
    status: string;
    paymentDate?: string;
  }>;
  preferenceId?: string;
  createdAt?: string;
  updatedAt?: string;
}