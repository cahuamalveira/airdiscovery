import { IsDateString, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateFlightDto {
  @IsString()
  @IsNotEmpty()
  flightNumber: string;

  @IsString()
  @IsNotEmpty()
  amadeusOfferId: string;

  @IsString()
  @IsNotEmpty()
  departureCode: string;

  @IsString()
  @IsNotEmpty()
  arrivalCode: string;

  @IsDateString()
  departureDateTime: string;

  @IsDateString()
  arrivalDateTime: string;

  @IsNumber()
  priceTotal: number;

  @IsString()
  currency: string;
}
