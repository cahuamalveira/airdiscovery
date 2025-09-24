/**
 * Utility functions for navigation and URL management
 */

export interface TravelParams {
  origin: string;
  destination: string;
  departureDate?: string;
  returnDate?: string;
  adults?: number;
  nonStop?: boolean;
}

/**
 * Creates URL for recommendations page with params and query string
 */
export function createRecommendationsUrl(params: TravelParams): string {
  const { origin, destination, departureDate, returnDate, adults, nonStop } = params;
  
  const searchParams = new URLSearchParams();
  
  if (departureDate) searchParams.set('departureDate', departureDate);
  if (returnDate) searchParams.set('returnDate', returnDate);
  if (adults) searchParams.set('adults', adults.toString());
  if (nonStop !== undefined) searchParams.set('nonStop', nonStop.toString());
  
  const queryString = searchParams.toString();
  
  return `/recomendacoes/${origin}/${destination}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Parses travel parameters from URL params and search params
 */
export function parseTravelParams(
  urlParams: { origin?: string; destination?: string },
  searchParams: URLSearchParams
): TravelParams | null {
  const { origin, destination } = urlParams;
  
  if (!origin || !destination) {
    return null;
  }
  
  return {
    origin,
    destination,
    departureDate: searchParams.get('departureDate') || undefined,
    returnDate: searchParams.get('returnDate') || undefined,
    adults: parseInt(searchParams.get('adults') || '1'),
    nonStop: searchParams.get('nonStop') === 'true'
  };
}

/**
 * Creates default travel parameters with sensible defaults
 */
export function createDefaultTravelParams(origin: string, destination: string): TravelParams {
  return {
    origin,
    destination,
    departureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    adults: 1,
    nonStop: false
  };
}