import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassengerValidationUtil } from '../../modules/chatbot/utils/passenger-validation.util';
import { ERROR_MESSAGES } from '../../modules/chatbot/constants/error-messages.constant';
import { LoggerService } from '../../modules/logger/logger.service';

interface AmadeusTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface AmadeusFlightOffer {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: AmadeusItinerary[];
  price: AmadeusPrice;
  pricingOptions: AmadeusPricingOptions;
  validatingAirlineCodes: string[];
  travelerPricings: AmadeusTravelerPricing[];
}

interface AmadeusItinerary {
  duration: string;
  segments: AmadeusSegment[];
}

interface AmadeusSegment {
  departure: AmadeusLocation;
  arrival: AmadeusLocation;
  carrierCode: string;
  number: string;
  aircraft: AmadeusAircraft;
  operating?: AmadeusOperating;
  duration: string;
  id: string;
  numberOfStops: number;
  blacklistedInEU: boolean;
}

interface AmadeusLocation {
  iataCode: string;
  terminal?: string;
  at: string;
}

interface AmadeusAircraft {
  code: string;
}

interface AmadeusOperating {
  carrierCode: string;
}

interface AmadeusPrice {
  currency: string;
  total: string;
  base: string;
  fees: AmadeusFee[];
  grandTotal: string;
}

interface AmadeusFee {
  amount: string;
  type: string;
}

interface AmadeusPricingOptions {
  fareType: string[];
  includedCheckedBagsOnly: boolean;
}

interface AmadeusTravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: string;
  price: AmadeusPrice;
  fareDetailsBySegment: AmadeusFareDetails[];
}

interface AmadeusFareDetails {
  segmentId: string;
  cabin: string;
  fareBasis: string;
  class: string;
  includedCheckedBags: AmadeusCheckedBags;
}

interface AmadeusCheckedBags {
  weight?: number;
  weightUnit?: string;
}

interface AmadeusFlightSearchResponse {
  meta: {
    count: number;
    links?: {
      self: string;
    };
  };
  data: AmadeusFlightOffer[];
  dictionaries?: {
    locations: Record<string, any>;
    aircraft: Record<string, any>;
    currencies: Record<string, any>;
    carriers: Record<string, any>;
  };
}

@Injectable()
export class AmadeusClientService {
    private readonly logger: LoggerService;
    private readonly baseUrl: string;
    private accessToken: string | null = null;
    private tokenExpiry: Date | null = null;

    constructor(
        private readonly configService: ConfigService,
        private readonly loggerService: LoggerService,
    ) {
        this.logger = loggerService.child({ module: 'AmadeusClientService' });
        const environment = this.configService.get<string>('AMADEUS_ENVIRONMENT', 'test');
        this.baseUrl = this.configService.get<string>('AMADEUS_URL', 'test.api.amadeus.com');
        
        this.logger.info(`Amadeus API configured for ${environment} environment: ${this.baseUrl}`);
    }

    /**
     * Obtém um token de acesso da API do Amadeus
     */
    private async getAccessToken(): Promise<string> {
        // Verifica se o token ainda é válido
        if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.accessToken;
        }

        const clientId = this.configService.get<string>('AMADEUS_CLIENT_ID');
        const clientSecret = this.configService.get<string>('AMADEUS_CLIENT_SECRET');

        if (!clientId || !clientSecret) {
            throw new HttpException(
                'Credenciais do Amadeus não configuradas',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }

        try {
            const response = await fetch(`${this.baseUrl}/v1/security/oauth2/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: clientId,
                    client_secret: clientSecret,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`Erro ao obter token do Amadeus: ${response.status} - ${errorText}`);
                throw new HttpException(
                    'Erro ao autenticar com a API do Amadeus',
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            const tokenData: AmadeusTokenResponse = await response.json();
            this.accessToken = tokenData.access_token;
            
            // Define o tempo de expiração com uma margem de segurança de 5 minutos
            this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in - 300) * 1000);
            
            this.logger.log('Token do Amadeus obtido com sucesso');
            return this.accessToken;

        } catch (error) {
            this.logger.error('Erro ao obter token do Amadeus', error);
            throw new HttpException(
                'Erro ao autenticar com a API do Amadeus',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Busca ofertas de voos na API do Amadeus
     */
    async searchFlightOffers(params: {
        originLocationCode: string;
        destinationLocationCode: string;
        departureDate: string;
        returnDate?: string;
        adults: number;
        children?: number;
        infants?: number;
        nonStop?: boolean;
        max?: number;
    }): Promise<AmadeusFlightSearchResponse> {
        const startTime = Date.now();
        
        this.logger.info('Searching flight offers', {
            origin: params.originLocationCode,
            destination: params.destinationLocationCode,
            departureDate: params.departureDate,
            returnDate: params.returnDate,
            adults: params.adults,
            children: params.children,
            infants: params.infants,
            nonStop: params.nonStop,
            function: 'searchFlightOffers',
        });

        // Validate passenger counts using centralized validation
        const validation = PassengerValidationUtil.validateFlightSearchParams(
            params.adults,
            params.children,
            params.infants
        );

        if (!validation.isValid) {
            this.logger.error(`Flight search validation failed: ${validation.errors.join(', ')}`, undefined, {
                origin: params.originLocationCode,
                destination: params.destinationLocationCode,
                errors: validation.errors,
            });
            throw new HttpException(
                validation.errors.join('; '),
                HttpStatus.BAD_REQUEST
            );
        }

        try {
            const token = await this.getAccessToken();
            
            const searchParams = new URLSearchParams({
                originLocationCode: params.originLocationCode,
                destinationLocationCode: params.destinationLocationCode,
                departureDate: params.departureDate,
                adults: params.adults.toString(),
                currencyCode: 'BRL',
                max: (params.max || 10).toString(),
            });

            if (params.returnDate) {
                searchParams.append('returnDate', params.returnDate);
            }

            if (params.children && params.children > 0) {
                searchParams.append('children', params.children.toString());
            }

            if (params.infants && params.infants > 0) {
                searchParams.append('infants', params.infants.toString());
            }

            if (params.nonStop) {
                searchParams.append('nonStop', 'true');
            }

            const url = `${this.baseUrl}/v2/shopping/flight-offers?${searchParams.toString()}`;
            
            this.logger.debug('Calling Amadeus API', {
                url,
                method: 'GET',
            });

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const responseTime = Date.now() - startTime;
                const errorText = await response.text();
                this.logger.error(`Amadeus API request failed`, undefined, {
                    status: response.status,
                    responseTime,
                    origin: params.originLocationCode,
                    destination: params.destinationLocationCode,
                    errorText: errorText.substring(0, 500), // Limit error text length
                });
                
                if (response.status === 401) {
                    // Token expirado, limpa e tenta novamente
                    this.accessToken = null;
                    this.tokenExpiry = null;
                    throw new HttpException(
                        'Token expirado, tente novamente',
                        HttpStatus.UNAUTHORIZED
                    );
                }
                
                // Parse Amadeus error response for better error messages
                let userMessage: string = ERROR_MESSAGES.AMADEUS_SEARCH_ERROR;
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.errors && errorData.errors.length > 0) {
                        const firstError = errorData.errors[0];
                        // Map common Amadeus errors to user-friendly messages
                        if (firstError.code === 'INVALID_PASSENGER_COUNT') {
                            userMessage = ERROR_MESSAGES.INVALID_PASSENGER_COUNT as string;
                        } else if (firstError.code === 'TOO_MANY_INFANTS') {
                            userMessage = ERROR_MESSAGES.TOO_MANY_INFANTS as string;
                        } else if (firstError.detail) {
                            userMessage = `Erro na busca: ${firstError.detail}`;
                        }
                    }
                } catch (parseError) {
                    // If we can't parse the error, use default message
                    this.logger.warn('Não foi possível parsear erro do Amadeus');
                }
                
                throw new HttpException(
                    userMessage,
                    HttpStatus.BAD_REQUEST
                );
            }

            const flightData: AmadeusFlightSearchResponse = await response.json();
            const responseTime = Date.now() - startTime;
            
            this.logger.info('Flight search completed successfully', {
                resultCount: flightData.meta.count,
                responseTime,
                origin: params.originLocationCode,
                destination: params.destinationLocationCode,
            });
            
            return flightData;

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.logger.error('Flight search failed', error as Error, {
                responseTime,
                origin: params.originLocationCode,
                destination: params.destinationLocationCode,
                function: 'searchFlightOffers',
            });
            
            if (error instanceof HttpException) {
                throw error;
            }
            
            // Network or other unexpected errors
            throw new HttpException(
                ERROR_MESSAGES.AMADEUS_SEARCH_ERROR,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Busca informações de aeroportos por código IATA ou cidade
     */
    async searchAirports(keyword: string): Promise<any> {
        const startTime = Date.now();
        
        this.logger.info('Searching airports', {
            keyword,
            function: 'searchAirports',
        });

        try {
            const token = await this.getAccessToken();
            
            const searchParams = new URLSearchParams({
                keyword: keyword,
                'page[limit]': '10',
            });

            const url = `${this.baseUrl}/v1/reference-data/locations?${searchParams.toString()}`;
            
            this.logger.debug('Calling Amadeus API', {
                url,
                method: 'GET',
            });

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const responseTime = Date.now() - startTime;
                const errorText = await response.text();
                this.logger.error(`Airport search failed`, undefined, {
                    status: response.status,
                    responseTime,
                    keyword,
                    errorText: errorText.substring(0, 500),
                });
                throw new HttpException(
                    `Erro na busca de aeroportos: ${response.status}`,
                    HttpStatus.BAD_REQUEST
                );
            }

            const airportData = await response.json();
            const responseTime = Date.now() - startTime;

            this.logger.info('Airport search completed successfully', {
                resultCount: airportData.data?.length || 0,
                responseTime,
                keyword,
            });

            return airportData;

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.logger.error('Airport search failed', error as Error, {
                responseTime,
                keyword,
                function: 'searchAirports',
            });
            
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