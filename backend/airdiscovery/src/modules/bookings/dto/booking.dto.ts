import { IsString, IsEmail, IsUUID, IsOptional, IsNotEmpty, IsEnum, IsObject, ValidateNested, IsNumber, Min, Max, Matches } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { BookingStatus } from '../entities/booking.entity';
import type { PassengerData, FlightDetails } from '../entities/booking.entity';

/**
 * DTO para dados do passageiro
 */
export class PassengerDataDto implements PassengerData {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-ZÀ-ÿ\s]+$/, {
    message: 'Nome deve conter apenas letras e espaços',
  })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-ZÀ-ÿ\s]+$/, {
    message: 'Sobrenome deve conter apenas letras e espaços',
  })
  lastName: string;

  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, {
    message: 'Telefone deve estar no formato (11) 99999-9999',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: 'CPF deve estar no formato 999.999.999-99',
  })
  document: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Data de nascimento deve estar no formato AAAA-MM-DD',
  })
  birthDate: string;
}

/**
 * DTO para criação de reserva
 */
export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  flightId: string;

  @ValidateNested()
  @Type(() => PassengerDataDto)
  @IsObject()
  passengerData: PassengerDataDto;

  @IsObject()
  flightDetails: FlightDetails;

  @IsNumber()
  @Min(1, { message: 'Valor total deve ser maior que zero' })
  @Max(999999999, { message: 'Valor total é muito alto' })
  @Transform(({ value }) => {
    // Se o valor vier como string, converter para number
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return Math.round(parsed * 100); // Converter para centavos
    }
    return value;
  })
  totalAmount: number;

  @IsString()
  @IsOptional()
  currency?: string = 'BRL';

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * DTO para atualização de reserva
 */
export class UpdateBookingDto {
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @IsString()
  @IsOptional()
  preferenceId?: string;

  @IsObject()
  @IsOptional()
  paymentData?: {
    provider: 'mercadopago';
    paymentId?: string;
    transactionId?: string;
    pixCode?: string;
    qrCodeBase64?: string;
    expirationDate?: string;
  };

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * DTO para consulta de reservas com filtros
 */
export class BookingQueryDto {
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @IsString()
  @IsOptional()
  flightId?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}

/**
 * DTO para resposta de reserva (usado nas APIs)
 */
export class BookingResponseDto {
  id: string;
  flightId: string;
  userId: string;
  status: BookingStatus;
  passengerData: PassengerDataDto;
  flightDetails: FlightDetails;
  totalAmount: number;
  currency: string;
  preferenceId?: string;
  paymentData?: object;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}