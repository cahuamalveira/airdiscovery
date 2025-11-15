import { IsString, IsNotEmpty, IsOptional, IsDate, IsNumber } from 'class-validator';

/**
 * DTO para retornar resumo de sessão no histórico
 */
export class SessionSummaryDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsDate()
  startTime: Date;

  @IsDate()
  lastUpdated: Date;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsNumber()
  messageCount: number;

  @IsString()
  @IsOptional()
  recommendedDestination?: string;
}

/**
 * DTO para retornar detalhes completos de uma sessão
 */
export class SessionDetailDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;

  profileData?: {
    origin?: string;
    activities?: string[];
    budget?: number;
    purpose?: string;
    hobbies?: string[];
  };

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  @IsOptional()
  interviewComplete?: boolean;

  @IsOptional()
  recommendedDestination?: string;
}

/**
 * Response para lista de sessões
 */
export class SessionListResponseDto {
  sessions: SessionSummaryDto[];
  total: number;
}

/**
 * Response para detalhes de sessão
 */
export class SessionDetailResponseDto {
  session: SessionDetailDto;
}
