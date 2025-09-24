import { useQuery } from '@tanstack/react-query';
import { useHttpInterceptor } from '../utils/httpInterceptor';

// Interface para os parâmetros de busca de destinos
export interface SearchDestinationParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  nonStop?: boolean;
}

// Interface para a resposta da API Amadeus
export interface AmadeusFlightOffer {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft: {
        code: string;
      };
      duration: string;
      id: string;
      numberOfStops: number;
    }>;
  }>;
  price: {
    currency: string;
    total: string;
    base: string;
    fees: Array<{
      amount: string;
      type: string;
    }>;
    grandTotal: string;
  };
  pricingOptions: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
  validatingAirlineCodes: string[];
  travelerPricings: Array<{
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: {
      currency: string;
      total: string;
      base: string;
    };
    fareDetailsBySegment: Array<{
      segmentId: string;
      cabin: string;
      fareBasis: string;
      brandedFare?: string;
      class: string;
      includedCheckedBags: {
        quantity: number;
      };
    }>;
  }>;
}

export interface AmadeusDictionaries {
  locations: Record<string, {
    cityCode: string;
    countryCode: string;
  }>;
  aircraft: Record<string, string>;
  currencies: Record<string, string>;
  carriers: Record<string, string>;
}

export interface FlightSearchResponse {
  data: AmadeusFlightOffer[];
  dictionaries: AmadeusDictionaries;
  meta: {
    count: number;
    links: {
      self: string;
    };
  };
}

// Hook customizado para buscar destinos com react-query
export const useFlightSearch = (params: SearchDestinationParams | null) => {
  const httpInterceptor = useHttpInterceptor();

  return useQuery({
    queryKey: ['flights', params],
    queryFn: async (): Promise<FlightSearchResponse> => {
      if (!params) {
        throw new Error('Parâmetros de busca são obrigatórios');
      }

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const queryParams = new URLSearchParams({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        adults: params.adults.toString(),
      });

      if (params.returnDate) {
        queryParams.append('returnDate', params.returnDate);
      }

      console.log('🔍 Buscando voos:', params);
      
      const request = await httpInterceptor.get(`${baseUrl}/destinations?${queryParams}`);
        const response = await request.json();
        
      if (!response) {
        throw new Error('Resposta inválida da API');
      }

      console.log('✅ Voos encontrados:', response.data);
      return response;
    },
    enabled: !!params, // Só executa se params estiver definido
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, error: any) => {
      // Não tentar novamente para erros 4xx
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Hook para invalidar cache de voos (útil para refresh manual)
export const useInvalidateFlights = () => {
  const httpInterceptor = useHttpInterceptor();
  
  return () => {
    // Implementar invalidação se necessário
    console.log('🔄 Cache de voos invalidado');
  };
};