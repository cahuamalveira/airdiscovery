/**
 * Interfaces para streaming de resposta do AWS Bedrock
 */
export interface StreamChunk {
  content: string;
  isComplete: boolean;
  sessionId: string;
  metadata?: {
    questionNumber?: number;
    totalQuestions?: number;
    interviewComplete?: boolean;
    profileData?: UserProfile;
    stopReason?: string;
    error?: string;
  };
}

export interface BedrockStreamResponse {
  chunk: Uint8Array;
  type: string;
}

/**
 * Configuração para o prompt da entrevista
 */
export interface InterviewConfig {
  systemPrompt: string;
  questions: InterviewQuestion[];
  maxQuestions: number;
}

export interface InterviewQuestion {
  id: string;
  category: 'origin' | 'activities' | 'budget' | 'purpose' | 'hobbies' | 'followup';
  question: string;
  followUpTriggers?: string[];
}

/**
 * Estado da sessão de chat
 */
export interface ChatSession {
  sessionId: string;
  userId: string;
  messages: ChatMessage[];
  profileData: UserProfile;
  currentQuestionIndex: number;
  interviewComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Campos diretos para DynamoDB
  completedAt?: string;
  readyForRecommendation: boolean;
  recommendedDestination?: string;
  questionsAsked: number;
  totalQuestionsAvailable: number;
  interviewEfficiency: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface UserProfile {
  origin: string;
  activities: string[];
  budget: number; // em centavos
  availability_months?: string[]; // Meses de disponibilidade para viagem
  purpose: string;
  hobbies: string[];
}
