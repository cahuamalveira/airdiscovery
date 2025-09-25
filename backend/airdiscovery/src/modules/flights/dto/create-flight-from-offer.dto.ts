import { IsNotEmpty, IsString, IsObject, ValidateNested } from "class-validator";
import { Transform, Type } from "class-transformer";

export class CreateFlightFromOfferDto {
  @IsString({ message: 'amadeusOfferId deve ser uma string' })
  @IsNotEmpty({ message: 'amadeusOfferId não pode estar vazio' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  amadeusOfferId: string;

  @IsObject({ message: 'offerPayload deve ser um objeto' })
  @IsNotEmpty({ message: 'offerPayload não pode estar vazio' })
  @Type(() => Object)
  offerPayload: any; // Complete Amadeus offer data
}