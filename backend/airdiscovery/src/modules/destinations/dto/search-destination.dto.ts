import { Type } from "class-transformer";
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class SearchDestinationDto {
    @IsString()
    @Length(3, 3)
    origin: string;

    @IsString()
    @Length(3, 3)
    destination: string;

    @IsDateString({}, { message: 'A data de partida deve estar no formato YYYY-MM-DD'})
    departureDate: string;

    @IsOptional()
    @IsDateString({}, { message: 'A data de retorno deve estar no formato YYYY-MM-DD'})
    returnDate?: string;

    @Type(() => Number)
    @IsInt({ message: 'O numero de adultos deve ser um inteiro.'})
    @Min(1)
    @Max(5)
    adults: number;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean({ message: 'O valor de nonstop deve ser um booleano.'})
    nonStop?: boolean = false;
}