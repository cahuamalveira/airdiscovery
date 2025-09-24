import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(MessageRole)
  role: MessageRole;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class ChatResponseDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(MessageRole)
  role: MessageRole;

  @IsString()
  sessionId: string;

  @IsOptional()
  isComplete?: boolean;

  @IsOptional()
  metadata?: {
    questionNumber?: number;
    totalQuestions?: number;
    interviewComplete?: boolean;
    profileData?: any;
  };
}

export class StartChatDto {
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class ChatSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  messages: ChatMessageDto[];
  
  @IsOptional()
  profileData?: {
    origin?: string;
    activities?: string[];
    budget?: number; // Changed from string to number (cents)
    purpose?: string;
    hobbies?: string[];
  };

  @IsOptional()
  interviewComplete?: boolean;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}
