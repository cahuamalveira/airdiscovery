import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  DynamoDBClient
} from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  QueryCommandInput,
  GetCommandInput,
  PutCommandInput,
  DeleteCommandInput,
  UpdateCommandInput,
  ScanCommandInput,
  PutCommand,
  GetCommand,
  QueryCommand as DocQueryCommand,
  DeleteCommand,
  UpdateCommand,
  ScanCommand as DocScanCommand
} from '@aws-sdk/lib-dynamodb';
import { fromEnv } from '@aws-sdk/credential-providers';
import { ChatSession, UserProfile, ChatMessage } from '../interfaces/chat.interface';

@Injectable()
export class ChatSessionRepository {
  private readonly logger = new Logger(ChatSessionRepository.name);
  private readonly dynamoClient: DynamoDBDocumentClient;
  private readonly tableName: string;
  private readonly indexName: string;
  private readonly sessionTtlDays: number;

  constructor(private readonly configService: ConfigService) {
    const client = new DynamoDBClient({
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      credentials: fromEnv(),
    });
    
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    this.tableName = this.configService.get<string>('DYNAMODB_CHAT_SESSIONS_TABLE', 'airdiscovery-chat-sessions');
    this.indexName = 'UserIdIndex';

    // Configura TTL das sessões (padrão: 30 dias)
    this.sessionTtlDays = this.configService.get<number>('CHAT_SESSION_TTL_DAYS', 30);
  }

  /**
   * Cria ou atualiza uma sessão de chat
   */
  async saveSession(session: ChatSession): Promise<void> {
    try {
      this.logger.debug('Saving session data:', JSON.stringify(session, null, 2));

      // Sanitize data for DynamoDB - remove undefined/null values and empty arrays
      const sanitizedMessages = session.messages?.length > 0 ? session.messages.map(msg => ({
        role: msg.role || 'user',
        content: String(msg.content || ''),
        timestamp: msg.timestamp?.toISOString() || new Date().toISOString()
      })).filter(msg => msg.role && msg.content) : [];

      const sanitizedProfileData = {
        origin: String(session.profileData?.origin || ''),
        activities: Array.isArray(session.profileData?.activities) ? 
          session.profileData.activities.filter(item => item !== undefined && item !== null && item !== '') : [],
        budget: Number(session.profileData?.budget || 0), // Keep as number for cents
        purpose: String(session.profileData?.purpose || ''),
        hobbies: Array.isArray(session.profileData?.hobbies) ? 
          session.profileData.hobbies.filter(item => item !== undefined && item !== null && item !== '') : []
      };

      const item = {
        SessionId: String(session.sessionId),
        UserId: String(session.userId),
        Messages: sanitizedMessages,
        ProfileData: sanitizedProfileData,
        CurrentQuestionIndex: Number(session.currentQuestionIndex || 0),
        InterviewComplete: Boolean(session.interviewComplete || false),
        ReadyForRecommendation: Boolean(session.readyForRecommendation || false),
        RecommendedDestination: session.recommendedDestination ? String(session.recommendedDestination) : undefined,
        QuestionsAsked: Number(session.questionsAsked || 0),
        TotalQuestionsAvailable: Number(session.totalQuestionsAvailable || 5),
        InterviewEfficiency: Number(session.interviewEfficiency || 0),
        CompletedAt: session.completedAt ? String(session.completedAt) : undefined,
        CreatedAt: session.createdAt?.toISOString() || new Date().toISOString(),
        UpdatedAt: session.updatedAt?.toISOString() || new Date().toISOString(),
        TTL: Math.floor(Date.now() / 1000) + (this.sessionTtlDays * 24 * 60 * 60) // TTL configurável em dias
      };

      // Remove any undefined values that might still exist
      const cleanedItem = this.removeUndefinedValues(item);
      
      this.logger.debug('Cleaned item for DynamoDB:', JSON.stringify(cleanedItem, null, 2));

      const params: PutCommandInput = {
        TableName: this.tableName,
        Item: cleanedItem
      };

      await this.dynamoClient.send(new PutCommand(params));
      this.logger.log(`Session saved: ${session.sessionId}`);
    } catch (error) {
      this.logger.error(`Error saving session ${session.sessionId}:`, error);
      this.logger.error('Session data that failed:', JSON.stringify(session, null, 2));
      throw error;
    }
  }

  /**
   * Remove undefined values recursively from an object
   */
  private removeUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return null; // Convert undefined to null for DynamoDB
    }
    
    if (Array.isArray(obj)) {
      // Filter out undefined, null, and empty values, then recursively clean
      const filtered = obj.filter(item => item !== undefined && item !== null && item !== '');
      return filtered.map(item => this.removeUndefinedValues(item));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          const cleanedValue = this.removeUndefinedValues(value);
          if (cleanedValue !== null && cleanedValue !== undefined) {
            cleaned[key] = cleanedValue;
          }
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  /**
   * Busca uma sessão de chat por ID
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const params: GetCommandInput = {
        TableName: this.tableName,
        Key: {
          SessionId: sessionId
        }
      };

      const result = await this.dynamoClient.send(new GetCommand(params));
      
      if (!result.Item) {
        return null;
      }

      return this.mapDynamoItemToSession(result.Item);
    } catch (error) {
      this.logger.error(`Error getting session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Busca todas as sessões ativas de um usuário
   */
  async getUserActiveSessions(userId: string): Promise<ChatSession[]> {
    try {
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: this.indexName,
        KeyConditionExpression: 'UserId = :userId',
        FilterExpression: 'InterviewComplete = :incomplete',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':incomplete': false
        }
      };

      const result = await this.dynamoClient.send(new DocQueryCommand(params));
      
      if (!result.Items) {
        return [];
      }

      return result.Items.map(item => this.mapDynamoItemToSession(item));
    } catch (error) {
      this.logger.error(`Error getting user sessions for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Remove uma sessão de chat
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const params: DeleteCommandInput = {
        TableName: this.tableName,
        Key: {
          SessionId: sessionId
        }
      };

      await this.dynamoClient.send(new DeleteCommand(params));
      this.logger.log(`Session deleted: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error deleting session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza apenas o ProfileData de uma sessão
   */
  async updateSessionProfile(sessionId: string, profileData: UserProfile): Promise<void> {
    try {
      const params: UpdateCommandInput = {
        TableName: this.tableName,
        Key: {
          SessionId: sessionId
        },
        UpdateExpression: 'SET ProfileData = :profileData, UpdatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':profileData': profileData,
          ':updatedAt': new Date().toISOString()
        }
      };

      await this.dynamoClient.send(new UpdateCommand(params));
      this.logger.log(`Session profile updated: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error updating session profile ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Marca entrevista como completa
   */
  async markInterviewComplete(sessionId: string): Promise<void> {
    try {
      const params: UpdateCommandInput = {
        TableName: this.tableName,
        Key: {
          SessionId: sessionId
        },
        UpdateExpression: 'SET InterviewComplete = :complete, UpdatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':complete': true,
          ':updatedAt': new Date().toISOString()
        }
      };

      await this.dynamoClient.send(new UpdateCommand(params));
      this.logger.log(`Interview marked complete: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error marking interview complete ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de sessões ativas
   */
  async getActiveSessionsCount(): Promise<number> {
    try {
      const params: ScanCommandInput = {
        TableName: this.tableName,
        FilterExpression: 'InterviewComplete = :incomplete',
        ExpressionAttributeValues: {
          ':incomplete': false
        },
        Select: 'COUNT'
      };

      const result = await this.dynamoClient.send(new DocScanCommand(params));
      return result.Count || 0;
    } catch (error) {
      this.logger.error('Error getting active sessions count:', error);
      return 0;
    }
  }

  /**
   * Limpa sessões expiradas (backup, pois o TTL já faz isso automaticamente)
   */
  async cleanupExpiredSessions(maxAgeHours?: number): Promise<number> {
    // Usa o TTL configurado por padrão (convertido para horas), ou o valor passado como parâmetro
    const defaultMaxAgeHours = this.sessionTtlDays * 24;
    const ageHours = maxAgeHours ?? defaultMaxAgeHours;
    try {
      const cutoffTime = new Date(Date.now() - ageHours * 60 * 60 * 1000);
      
      const params: ScanCommandInput = {
        TableName: this.tableName,
        FilterExpression: 'UpdatedAt < :cutoff',
        ExpressionAttributeValues: {
          ':cutoff': cutoffTime.toISOString()
        }
      };

      const result = await this.dynamoClient.send(new DocScanCommand(params));
      
      if (!result.Items || result.Items.length === 0) {
        return 0;
      }

      // Delete em lotes
//      const deletePromises = result.Items.map(item => 
//        this.deleteSession(item.SessionId as string)
//      );

//      await Promise.allSettled(deletePromises);
      
      this.logger.log(`Cleaned up ${result.Items.length} expired sessions`);
      return result.Items.length;
    } catch (error) {
      this.logger.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Converte item do DynamoDB para ChatSession
   */
  private mapDynamoItemToSession(item: any): ChatSession {
    // Safely map messages with proper timestamp conversion
    const messages: ChatMessage[] = (item.Messages || []).map((msg: any) => ({
      role: msg.role,
      content: msg.content || '',
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
    }));

    return {
      sessionId: item.SessionId,
      userId: item.UserId,
      messages: messages,
      profileData: item.ProfileData || {
        origin: '',
        activities: [],
        budget: 0, // Initialize as 0 cents instead of empty string
        purpose: '',
        hobbies: []
      },
      currentQuestionIndex: item.CurrentQuestionIndex || 0,
      interviewComplete: item.InterviewComplete || false,
      readyForRecommendation: item.ReadyForRecommendation || false,
      recommendedDestination: item.RecommendedDestination || undefined,
      questionsAsked: item.QuestionsAsked || 0,
      totalQuestionsAvailable: item.TotalQuestionsAvailable || 5,
      interviewEfficiency: item.InterviewEfficiency || 0,
      completedAt: item.CompletedAt || undefined,
      createdAt: new Date(item.CreatedAt),
      updatedAt: new Date(item.UpdatedAt)
    };
  }

  /**
   * Health check para verificar conectividade com DynamoDB
   */
  async healthCheck(): Promise<boolean> {
    try {
      const params: ScanCommandInput = {
        TableName: this.tableName,
        Limit: 1
      };

      await this.dynamoClient.send(new DocScanCommand(params));
      return true;
    } catch (error) {
      this.logger.error('DynamoDB health check failed:', error);
      return false;
    }
  }
}
