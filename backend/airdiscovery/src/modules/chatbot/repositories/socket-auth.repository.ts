import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Interface para dados do socket autenticado
 */
export interface SocketAuthData {
  userId: string;
  sessionId?: string;
  connectedAt: Date;
  lastActivity: Date;
}

/**
 * Repositório Redis para gerenciar sockets autenticados
 * 
 * Funcionalidades:
 * - Armazenar dados de autenticação por socket ID
 * - TTL automático para limpeza de conexões órfãs
 * - Extensível para cache do Amadeus no futuro
 */
@Injectable()
export class SocketAuthRepository {
  private readonly logger = new Logger(SocketAuthRepository.name);
  private readonly redis: Redis;
  private readonly keyPrefix = 'socket_auth:';
  private readonly defaultTTL = 3600; // 1 hora TTL para sockets

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    if (redisUrl) {
      // Usar URL completa (para ElastiCache ou Redis Cloud)
      this.redis = new Redis(redisUrl);
    } else {
      // Configuração host/port individual
      this.redis = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
    }

    // Event listeners para monitoramento
    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('reconnecting', () => {
      this.logger.warn('Reconnecting to Redis...');
    });
  }

  /**
   * Salva dados de autenticação do socket
   */
  async setSocketAuth(socketId: string, authData: Omit<SocketAuthData, 'connectedAt' | 'lastActivity'>): Promise<void> {
    try {
      const key = this.getSocketKey(socketId);
      const data: SocketAuthData = {
        ...authData,
        connectedAt: new Date(),
        lastActivity: new Date(),
      };

      await this.redis.setex(key, this.defaultTTL, JSON.stringify(data));
      this.logger.log(`Socket auth saved: ${socketId} for user ${authData.userId}`);
    } catch (error) {
      this.logger.error(`Error saving socket auth for ${socketId}:`, error);
      throw error;
    }
  }

  /**
   * Busca dados de autenticação do socket
   */
  async getSocketAuth(socketId: string): Promise<SocketAuthData | null> {
    try {
      const key = this.getSocketKey(socketId);
      const data = await this.redis.get(key);
      
      if (!data) {
        return null;
      }

      const authData = JSON.parse(data) as SocketAuthData;
      
      // Converte strings de data de volta para Date objects
      authData.connectedAt = new Date(authData.connectedAt);
      authData.lastActivity = new Date(authData.lastActivity);
      
      return authData;
    } catch (error) {
      this.logger.error(`Error getting socket auth for ${socketId}:`, error);
      return null;
    }
  }

  /**
   * Atualiza sessionId para um socket existente
   */
  async updateSocketSession(socketId: string, sessionId: string): Promise<void> {
    try {
      const authData = await this.getSocketAuth(socketId);
      if (!authData) {
        throw new Error(`Socket ${socketId} not found in Redis`);
      }

      authData.sessionId = sessionId;
      authData.lastActivity = new Date();

      const key = this.getSocketKey(socketId);
      await this.redis.setex(key, this.defaultTTL, JSON.stringify(authData));
      
      this.logger.log(`Socket session updated: ${socketId} -> ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error updating socket session for ${socketId}:`, error);
      throw error;
    }
  }

  /**
   * Remove sessionId de um socket (mantém autenticação)
   */
  async removeSocketSession(socketId: string): Promise<void> {
    try {
      const authData = await this.getSocketAuth(socketId);
      if (!authData) {
        return; // Socket já não existe
      }

      delete authData.sessionId;
      authData.lastActivity = new Date();

      const key = this.getSocketKey(socketId);
      await this.redis.setex(key, this.defaultTTL, JSON.stringify(authData));
      
      this.logger.log(`Socket session removed: ${socketId}`);
    } catch (error) {
      this.logger.error(`Error removing socket session for ${socketId}:`, error);
      throw error;
    }
  }

  /**
   * Remove completamente um socket autenticado
   */
  async removeSocketAuth(socketId: string): Promise<void> {
    try {
      const key = this.getSocketKey(socketId);
      await this.redis.del(key);
      this.logger.log(`Socket auth removed: ${socketId}`);
    } catch (error) {
      this.logger.error(`Error removing socket auth for ${socketId}:`, error);
      throw error;
    }
  }

  /**
   * Obtém todos os sockets autenticados (para estatísticas)
   */
  async getConnectedSocketsCount(): Promise<number> {
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);
      return keys.length;
    } catch (error) {
      this.logger.error('Error getting connected sockets count:', error);
      return 0;
    }
  }

  /**
   * Busca sockets por userId
   */
  async getSocketsByUser(userId: string): Promise<string[]> {
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);
      const sockets: string[] = [];

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const authData = JSON.parse(data) as SocketAuthData;
          if (authData.userId === userId) {
            const socketId = key.replace(this.keyPrefix, '');
            sockets.push(socketId);
          }
        }
      }

      return sockets;
    } catch (error) {
      this.logger.error(`Error getting sockets for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Limpa sockets expirados manualmente (backup do TTL automático)
   */
  async cleanupExpiredSockets(maxAgeMinutes: number = 60): Promise<number> {
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);
      const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
      let cleaned = 0;

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const authData = JSON.parse(data) as SocketAuthData;
          const lastActivity = new Date(authData.lastActivity);
          
          if (lastActivity < cutoffTime) {
            await this.redis.del(key);
            cleaned++;
          }
        }
      }

      if (cleaned > 0) {
        this.logger.log(`Cleaned up ${cleaned} expired socket entries`);
      }

      return cleaned;
    } catch (error) {
      this.logger.error('Error cleaning up expired sockets:', error);
      return 0;
    }
  }

  /**
   * Health check do Redis
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Gera chave Redis para o socket
   */
  private getSocketKey(socketId: string): string {
    return `${this.keyPrefix}${socketId}`;
  }

  /**
   * Fecha conexão Redis (para cleanup)
   */
  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
  }
}
