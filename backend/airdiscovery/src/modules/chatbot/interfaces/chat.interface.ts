/**
 * Interfaces para streaming de resposta do AWS Bedrock
 */
export interface StreamChunk {
  content: string;
  isComplete: boolean;
  sessionId: string;
  metadata?: any;
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
  category: 'activities' | 'budget' | 'purpose' | 'hobbies' | 'followup';
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
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface UserProfile {
  activities: string[];
  budget: string;
  purpose: string;
  hobbies: string[];
  additionalInfo: Record<string, any>;
}
