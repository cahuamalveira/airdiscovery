import { IsString, IsNumber, IsOptional, IsPositive, Min, MaxLength } from 'class-validator';

/**
 * DTO para criação de Payment Intent no Stripe
 */
export class CreatePaymentIntentDto {
  @IsString({ message: 'bookingId deve ser uma string válida' })
  @MaxLength(50, { message: 'bookingId deve ter no máximo 50 caracteres' })
  bookingId: string;

  @IsNumber(
    { maxDecimalPlaces: 0 },
    { message: 'amount deve ser um número inteiro' }
  )
  @IsPositive({ message: 'amount deve ser um valor positivo' })
  @Min(50, { message: 'amount deve ser no mínimo 50 centavos (R$ 0,50)' })
  amount: number;

  @IsOptional()
  @IsString({ message: 'currency deve ser uma string válida' })
  @MaxLength(3, { message: 'currency deve ter exatamente 3 caracteres' })
  currency?: string = 'brl';

  @IsOptional()
  @IsString({ message: 'description deve ser uma string válida' })
  @MaxLength(200, { message: 'description deve ter no máximo 200 caracteres' })
  description?: string;
}

/**
 * DTO de resposta para Payment Intent criado
 */
export class PaymentIntentResponseDto {
  id: string;
  clientSecret: string;
  status: string;
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