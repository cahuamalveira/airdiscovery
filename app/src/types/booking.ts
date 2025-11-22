/**
 * Tipos específicos para reservas (bookings)
 */

// Status possíveis de uma reserva
export enum BookingStatus {
  PENDING = 'PENDING',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

// Interface para dados de passageiro
export interface PassengerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  document: string;
  birthDate: string;
}

// Interface para resposta de uma reserva individual
export interface BookingResponseDto {
  id: string;
  flightId: string;
  userId: string;
  status: BookingStatus;
  passengers: PassengerData[];
  totalAmount: number;
  currency: string;
  payments?: any[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Interface para resposta do histórico de reservas (com paginação)
export interface BookingHistoryResponse {
  statusCode: number;
  message: string;
  data: BookingResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
