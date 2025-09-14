import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  DynamoDBClient, 
  QueryCommand, 
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
  UpdateItemCommand,
  ScanCommand 
} from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  QueryCommandInput,
  GetCommandInput,
  PutCommandInput,
  DeleteCommandInput,
  UpdateCommandInput,
  ScanCommandInput
} from '@aws-sdk/lib-dynamodb';
import { fromEnv } from '@aws-sdk/credential-providers';
import { ChatSession, UserProfile } from '../interfaces/chat.interface';

@Injectable()
export class ChatSessionRepository {
  private readonly logger = new Logger(ChatSessionRepository.name);
  private readonly dynamoClient: DynamoDBDocumentClient;
  private readonly tableName: string;
  private readonly indexName: string;

  constructor(private readonly configService: ConfigService) {
    const client = new DynamoDBClient({
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      credentials: fromEnv(),
    });
    
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    this.tableName = this.configService.get<string>('DYNAMODB_CHAT_SESSIONS_TABLE', 'airdiscovery-chat-sessions');
    this.indexName = 'UserIdIndex';
  }

  /**
   * Cria ou atualiza uma sessão de chat
   */
  async saveSession(session: ChatSession): Promise<void> {
    try {
      const item = {
        SessionId: session.sessionId,
        UserId: session.userId,
        Messages: session.messages,
        ProfileData: session.profileData,
        CurrentQuestionIndex: session.currentQuestionIndex,
        InterviewComplete: session.interviewComplete,
        CreatedAt: session.createdAt.toISOString(),
        UpdatedAt: session.updatedAt.toISOString(),
        TTL: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas TTL
      };

      const params: PutCommandInput = {
        TableName: this.tableName,
        Item: item
      };

      await this.dynamoClient.send(new PutItemCommand(params));
      this.logger.log(`Session saved: ${session.sessionId}`);
    } catch (error) {
      this.logger.error(`Error saving session ${session.sessionId}:`, error);
      throw error;
    }
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

      const result = await this.dynamoClient.send(new GetItemCommand(params));
      
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

      const result = await this.dynamoClient.send(new QueryCommand(params));
      
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

      await this.dynamoClient.send(new DeleteItemCommand(params));
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

      await this.dynamoClient.send(new UpdateItemCommand(params));
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

      await this.dynamoClient.send(new UpdateItemCommand(params));
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

      const result = await this.dynamoClient.send(new ScanCommand(params));
      return result.Count || 0;
    } catch (error) {
      this.logger.error('Error getting active sessions count:', error);
      return 0;
    }
  }

  /**
   * Limpa sessões expiradas (backup, pois o TTL já faz isso automaticamente)
   */
  async cleanupExpiredSessions(maxAgeHours: number = 24): Promise<number> {
    try {
      const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
      
      const params: ScanCommandInput = {
        TableName: this.tableName,
        FilterExpression: 'UpdatedAt < :cutoff',
        ExpressionAttributeValues: {
          ':cutoff': cutoffTime.toISOString()
        }
      };

      const result = await this.dynamoClient.send(new ScanCommand(params));
      
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
    return {
      sessionId: item.SessionId,
      userId: item.UserId,
      messages: item.Messages || [],
      profileData: item.ProfileData || {
        activities: [],
        budget: '',
        purpose: '',
        hobbies: [],
        additionalInfo: {}
      },
      currentQuestionIndex: item.CurrentQuestionIndex || 0,
      interviewComplete: item.InterviewComplete || false,
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

      await this.dynamoClient.send(new ScanCommand(params));
      return true;
    } catch (error) {
      this.logger.error('DynamoDB health check failed:', error);
      return false;
    }
  }
}
