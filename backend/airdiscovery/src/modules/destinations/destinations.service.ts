import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SearchDestinationDto } from './dto/search-destination.dto';
import { AmadeusClientService } from '../../common/amadeus/amadeus-client.service';

export interface FlightOffer {
    id: string;
    source: string;
    instantTicketingRequired: boolean;
    nonHomogeneous: boolean;
    oneWay: boolean;
    lastTicketingDate: string;
    numberOfBookableSeats: number;
    itineraries: FlightItinerary[];
    price: FlightPrice;
    validatingAirlineCodes: string[];
}

export interface FlightItinerary {
    duration: string;
    segments: FlightSegment[];
}

export interface FlightSegment {
    departure: FlightLocation;
    arrival: FlightLocation;
    carrierCode: string;
    number: string;
    aircraft: FlightAircraft;
    duration: string;
    id: string;
    numberOfStops: number;
}

export interface FlightLocation {
    iataCode: string;
    terminal?: string;
    at: string;
}

export interface FlightAircraft {
    code: string;
}

export interface FlightPrice {
    currency: string;
    total: string;
    base: string;
    grandTotal: string;
}

export interface DestinationSearchResult {
    meta: {
        count: number;
        searchCriteria: SearchDestinationDto;
    };
    data: FlightOffer[];
    dictionaries?: {
        locations: Record<string, any>;
        aircraft: Record<string, any>;
        currencies: Record<string, any>;
        carriers: Record<string, any>;
    };
}

@Injectable()
export class DestinationsService {
    private readonly logger = new Logger(DestinationsService.name);

    constructor(
        private readonly amadeusClient: AmadeusClientService
    ) {}

    /**
     * Busca destinos disponíveis baseado no DTO especificado
     * Implementa os requisitos RF016 e RF017 do documento de requisitos
     */
    async searchDestinations(queryDTO: SearchDestinationDto): Promise<DestinationSearchResult> {
        try {
            this.logger.log(`Buscando destinos: ${JSON.stringify(queryDTO)}`);

            // Valida se as datas são válidas
            this.validateDates(queryDTO);

            // Chama a API do Amadeus para buscar ofertas de voos
            const amadeusResponse = await this.amadeusClient.searchFlightOffers({
                originLocationCode: queryDTO.origin,
                destinationLocationCode: queryDTO.destination,
                departureDate: queryDTO.departureDate,
                returnDate: queryDTO.returnDate,
                adults: queryDTO.adults,
                nonStop: queryDTO.nonStop,
                max: 50 // Limita a busca para performance
            });
            

            console.log('🔍 Resultado da busca de destinos:', amadeusResponse);

            // Transforma a resposta do Amadeus no formato esperado
            const result: DestinationSearchResult = {
                meta: {
                    count: amadeusResponse.meta.count,
                    searchCriteria: queryDTO
                },
                data: this.transformAmadeusFlights(amadeusResponse.data),
                dictionaries: amadeusResponse.dictionaries
            };


            this.logger.log(`Encontrados ${result.meta.count} voos para ${queryDTO.origin} -> ${queryDTO.destination}`);

            return result;

        } catch (error) {
            this.logger.error('Erro ao buscar destinos', error);
            
            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new HttpException(
                'Erro interno ao buscar destinos',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Valida as datas da consulta
     */
    private validateDates(queryDTO: SearchDestinationDto): void {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const departureDate = new Date(queryDTO.departureDate);
        
        if (departureDate < today) {
            throw new HttpException(
                'A data de partida não pode ser anterior à data atual',
                HttpStatus.BAD_REQUEST
            );
        }

        if (queryDTO.returnDate) {
            const returnDate = new Date(queryDTO.returnDate);
            
            if (returnDate < departureDate) {
                throw new HttpException(
                    'A data de retorno não pode ser anterior à data de partida',
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    /**
     * Transforma os dados do Amadeus no formato padronizado da aplicação
     */
    private transformAmadeusFlights(amadeusFlights: any[]): FlightOffer[] {
        return amadeusFlights.map(flight => ({
            id: flight.id,
            source: flight.source,
            instantTicketingRequired: flight.instantTicketingRequired,
            nonHomogeneous: flight.nonHomogeneous,
            oneWay: flight.oneWay,
            lastTicketingDate: flight.lastTicketingDate,
            numberOfBookableSeats: flight.numberOfBookableSeats,
            itineraries: flight.itineraries.map((itinerary: any) => ({
                duration: itinerary.duration,
                segments: itinerary.segments.map((segment: any) => ({
                    departure: {
                        iataCode: segment.departure.iataCode,
                        terminal: segment.departure.terminal,
                        at: segment.departure.at
                    },
                    arrival: {
                        iataCode: segment.arrival.iataCode,
                        terminal: segment.arrival.terminal,
                        at: segment.arrival.at
                    },
                    carrierCode: segment.carrierCode,
                    number: segment.number,
                    aircraft: {
                        code: segment.aircraft.code
                    },
                    duration: segment.duration,
                    id: segment.id,
                    numberOfStops: segment.numberOfStops
                }))
            })),
            price: {
                currency: flight.price.currency,
                total: flight.price.total,
                base: flight.price.base,
                grandTotal: flight.price.grandTotal
            },
            validatingAirlineCodes: flight.validatingAirlineCodes
        }));
    }

    /**
     * Busca aeroportos por palavra-chave (cidade ou código IATA)
     * Útil para implementar autocomplete no frontend
     */
    async searchAirports(keyword: string): Promise<any> {
        try {
            this.logger.log(`Buscando aeroportos para: ${keyword}`);
            
            if (!keyword || keyword.length < 2) {
                throw new HttpException(
                    'A palavra-chave deve ter pelo menos 2 caracteres',
                    HttpStatus.BAD_REQUEST
                );
            }

            return await this.amadeusClient.searchAirports(keyword);

        } catch (error) {
            this.logger.error('Erro ao buscar aeroportos', error);
            
            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new HttpException(
                'Erro interno ao buscar aeroportos',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
