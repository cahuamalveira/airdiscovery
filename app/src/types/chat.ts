/**
 * Core domain types aligned with backend API schema
 */

export interface UserProfile {
  readonly origin: string;
  readonly activities: readonly string[];
  readonly budget: number; // Budget in cents (e.g., 50000 = R$ 500.00)
  readonly purpose: string;
  readonly hobbies: readonly string[];
}

export interface ChatSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly messages: readonly ChatMessage[];
  readonly profileData: UserProfile;
  readonly currentQuestionIndex: number;
  readonly interviewComplete: boolean;
  readonly readyForRecommendation: boolean;
  readonly recommendedDestination?: string;
  readonly questionsAsked: number;
  readonly totalQuestionsAvailable: number;
  readonly interviewEfficiency: number;
  readonly completedAt?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ChatMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
  readonly timestamp: Date;
}

export interface StreamChunk {
  readonly content: string;
  readonly isComplete: boolean;
  readonly sessionId: string;
  readonly metadata?: StreamMetadata;
}

export interface StreamMetadata {
  readonly questionNumber?: number;
  readonly totalQuestions?: number;
  readonly interviewComplete?: boolean;
  readonly profileData?: UserProfile;
  readonly stopReason?: string;
  readonly error?: string;
}

/**
 * Business logic types
 */

export interface InterviewProgress {
  readonly currentQuestion: number;
  readonly totalQuestions: number;
  readonly efficiency: number;
  readonly isComplete: boolean;
  readonly canFinishEarly: boolean;
}

export interface TravelRecommendation {
  readonly destination: string;
  readonly city: string;
  readonly confidence: number;
  readonly reasoning: readonly string[];
}

/**
 * API service types
 */

export interface FlightSearchParams {
  readonly originLocationCode: string;
  readonly destinationLocationCode?: string;
  readonly departureDate: string;
  readonly returnDate?: string;
  readonly adults: number;
  readonly max: number;
  readonly nonStop?: boolean;
}

export interface ChatApiRequest {
  readonly sessionId: string;
  readonly content: string;
  readonly role: 'user' | 'assistant';
}

export interface ChatApiResponse {
  readonly success: boolean;
  readonly sessionId: string;
  readonly stream?: ReadableStream<StreamChunk>;
  readonly error?: string;
}

/**
 * Mapeia códigos IATA de aeroportos para cidades na América Latina
 */
export const LATIN_AMERICA_AIRPORTS = {
  // Brasil
  GRU: 'São Paulo',
  CGH: 'São Paulo (Congonhas)',
  GIG: 'Rio de Janeiro',
  SDU: 'Rio de Janeiro (Santos Dumont)',
  BSB: 'Brasília',
  SSA: 'Salvador',
  REC: 'Recife',
  FOR: 'Fortaleza',
  BEL: 'Belém',
  MAO: 'Manaus',
  CWB: 'Curitiba',
  POA: 'Porto Alegre',
  FLN: 'Florianópolis',
  VCP: 'Campinas',
  CNF: 'Belo Horizonte',
  PLU: 'Belo Horizonte (Pampulha)',
  THE: 'Teresina',
  AJU: 'Aracaju',
  MCZ: 'Maceió',
  JPA: 'João Pessoa',
  NAT: 'Natal',
  SLZ: 'São Luís',
  CGB: 'Cuiabá',
  VDC: 'Vitória da Conquista',
  IOS: 'Ilhéus',
  RAO: 'Ribeirão Preto',
  UDI: 'Uberlândia',
  IPN: 'Ipatinga',
  
  // Argentina
  EZE: 'Buenos Aires',
  AEP: 'Buenos Aires (Jorge Newbery)',
  COR: 'Córdoba',
  MDZ: 'Mendoza',
  BRC: 'Bariloche',
  IGR: 'Iguazu',
  USH: 'Ushuaia',
  
  // Chile
  SCL: 'Santiago',
  IPC: 'Ilha de Páscoa',
  CJC: 'Calama',
  ARI: 'Arica',
  
  // Peru
  LIM: 'Lima',
  CUZ: 'Cusco',
  AQP: 'Arequipa',
  
  // Colômbia
  BOG: 'Bogotá',
  MDE: 'Medellín',
  CTG: 'Cartagena',
  CLO: 'Cali',
  
  // México
  MEX: 'Cidade do México',
  CUN: 'Cancún',
  PVR: 'Puerto Vallarta',
  GDL: 'Guadalajara',
  
  // Costa Rica
  SJO: 'San José',
  
  // Panamá
  PTY: 'Cidade do Panamá',
  
  // Equador
  UIO: 'Quito',
  GYE: 'Guayaquil',
  
  // Uruguai
  MVD: 'Montevidéu',
  
  // Paraguai
  ASU: 'Assunção'
} as const;

// Manter compatibilidade com o nome antigo
export const BRAZILIAN_AIRPORTS = LATIN_AMERICA_AIRPORTS;

/**
 * Mapeia atividades para destinos recomendados na América Latina
 */
export const ACTIVITY_TO_DESTINATION = {
  'Praia': ['REC', 'SSA', 'FOR', 'NAT', 'MCZ', 'CUN', 'PVR', 'CTG'],
  'Montanha': ['CGB', 'CWB', 'FLN', 'SCL', 'BRC', 'MDZ', 'CUZ'],
  'Cidade': ['GRU', 'GIG', 'BSB', 'CNF', 'BOG', 'MEX', 'LIM', 'SCL'],
  'Cultural': ['SSA', 'REC', 'BSB', 'GIG', 'CUZ', 'LIM', 'MEX', 'BOG'],
  'Aventura': ['CGB', 'MAO', 'BEL', 'CWB', 'CUZ', 'SJO', 'BRC', 'SCL'],
  'Relaxamento': ['REC', 'FOR', 'FLN', 'IOS', 'CUN', 'PVR', 'MVD'],
  'Gastronomia': ['SSA', 'REC', 'GRU', 'BEL', 'LIM', 'BOG', 'MEX'],
  'Vida Noturna': ['GRU', 'GIG', 'FOR', 'REC', 'CUN', 'MEX', 'BOG'],
  'Neve': ['SCL', 'BRC', 'MDZ'], // Novo: destinos para neve/esqui
  'História': ['CUZ', 'LIM', 'MEX', 'CTG', 'SSA', 'BSB']
} as const;

/**
 * Mapeia propósitos para destinos recomendados na América Latina
 */
export const PURPOSE_TO_DESTINATION = {
  'Trabalho': ['BSB', 'GRU', 'GIG', 'CNF', 'BOG', 'MEX', 'LIM', 'SCL'],
  'Lazer': ['REC', 'FOR', 'SSA', 'FLN', 'CUN', 'PVR', 'BRC', 'CUZ'],
  'Família': ['GRU', 'GIG', 'CNF', 'CWB', 'SJO', 'MVD', 'SCL'],
  'Romântica': ['REC', 'FOR', 'IOS', 'FLN', 'CUN', 'BRC', 'MDZ'],
  'Aventura': ['CGB', 'MAO', 'BEL', 'CUZ', 'SJO', 'BRC', 'SCL'],
  'Cultural': ['SSA', 'REC', 'BSB', 'GIG', 'CUZ', 'LIM', 'MEX', 'BOG'],
  'Negócios': ['BSB', 'GRU', 'CNF', 'BOG', 'MEX', 'LIM', 'SCL', 'PTY']
} as const;