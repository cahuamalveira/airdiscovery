import { Type } from 'class-transformer';
import { IsString, IsNumber, IsArray, IsOptional, ValidateNested } from 'class-validator';

export class FlightLocationDto {
    @IsString()
    iataCode: string;

    @IsOptional()
    @IsString()
    terminal?: string;

    @IsString()
    at: string;
}

export class FlightAircraftDto {
    @IsString()
    code: string;
}

export class FlightSegmentDto {
    @ValidateNested()
    @Type(() => FlightLocationDto)
    departure: FlightLocationDto;

    @ValidateNested()
    @Type(() => FlightLocationDto)
    arrival: FlightLocationDto;

    @IsString()
    carrierCode: string;

    @IsString()
    number: string;

    @ValidateNested()
    @Type(() => FlightAircraftDto)
    aircraft: FlightAircraftDto;

    @IsString()
    duration: string;

    @IsString()
    id: string;

    @IsNumber()
    numberOfStops: number;
}

export class FlightItineraryDto {
    @IsString()
    duration: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FlightSegmentDto)
    segments: FlightSegmentDto[];
}

export class FlightPriceDto {
    @IsString()
    currency: string;

    @IsString()
    total: string;

    @IsString()
    base: string;

    @IsString()
    grandTotal: string;
}

export class FlightOfferDto {
    @IsString()
    id: string;

    @IsString()
    source: string;

    @IsString()
    instantTicketingRequired: boolean;

    @IsString()
    nonHomogeneous: boolean;

    @IsString()
    oneWay: boolean;

    @IsString()
    lastTicketingDate: string;

    @IsNumber()
    numberOfBookableSeats: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FlightItineraryDto)
    itineraries: FlightItineraryDto[];

    @ValidateNested()
    @Type(() => FlightPriceDto)
    price: FlightPriceDto;

    @IsArray()
    @IsString({ each: true })
    validatingAirlineCodes: string[];
}

export class DestinationSearchResponseDto {
    meta: {
        count: number;
        searchCriteria: any;
    };

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FlightOfferDto)
    data: FlightOfferDto[];

    @IsOptional()
    dictionaries?: {
        locations: Record<string, any>;
        aircraft: Record<string, any>;
        currencies: Record<string, any>;
        carriers: Record<string, any>;
    };
}
