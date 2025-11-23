import { IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * DTO para criação de Payment Intent no Stripe
 * 
 * SECURITY MODEL:
 * - The payment amount is NEVER accepted from the client to prevent price manipulation
 * - Only the bookingId is required; the backend retrieves the authoritative amount
 *   from the booking entity stored in the database
 * - The booking entity contains the server-calculated totalAmount (flight price × passenger count)
 * - This ensures all payment amounts are validated and controlled server-side
 * 
 * @see Requirements 5.1, 5.2
 */
export class CreatePaymentIntentDto {
  /**
   * UUID of the booking for which to create a payment intent
   * The backend will retrieve the booking and use its totalAmount field
   */
  @IsUUID('4', { message: 'bookingId deve ser um UUID válido' })
  bookingId: string;
}

/**
 * DTO de resposta para Payment Intent criado
 * 
 * RESPONSE MODEL:
 * - The amount field is included in the response for display purposes only
 * - This amount is calculated server-side from the booking entity
 * - The clientSecret is used by the frontend to complete the Stripe payment flow
 * 
 * @see Requirement 5.3
 */
export class PaymentIntentResponseDto {
  id: string;
  
  /**
   * Stripe client secret for completing the payment on the frontend
   */
  clientSecret: string;
  
  status: string;
  
  /**
   * Payment amount in cents (calculated server-side from booking.totalAmount)
   * This is returned for display purposes only - NOT accepted as input
   */
  amount: number;
  
  currency: string;
}

/**
 * DTO de resposta para status do Payment Intent
 */
export class PaymentIntentStatusResponseDto {
  id: string;
  status: string;
  amount: number;
  currency: string;
  created: number;
}