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
 * Repositório para gerenciar sockets autenticados
 * 
 * Funcionalidades:
 * - Armazenar dados de autenticação por socket ID
 * - TTL automático para limpeza de conexões órfãs
 * - Fallback para Map em memória quando Redis não está disponível
 * - Extensível para cache do Amadeus no futuro
 */
@Injectable()
export class SocketAuthRepository {
  private readonly logger = new Logger(SocketAuthRepository.name);
  private redis: Redis; // Redis instance when available
  private readonly keyPrefix = 'socket_auth:';
  private readonly defaultTTL = 3600; // 1 hora TTL para sockets
  
  // Fallback in-memory storage
  private readonly memoryStore = new Map<string, { data: SocketAuthData; expiresAt: number }>();
  private useRedis = false; // Flag to track if Redis is available

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.initializeRedis();
    // Start cleanup interval for memory store
    this.startMemoryCleanup();
  }

  /**
   * Inicia limpeza automática da memória store (TTL simulation)
   */
  private startMemoryCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      
      for (const [key, entry] of this.memoryStore.entries()) {
        if (entry.expiresAt < now) {
          this.memoryStore.delete(key);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        this.logger.debug(`Cleaned ${cleaned} expired entries from memory store`);
      }
    }, 60000); // Limpa a cada minuto
  }

  private async initializeRedis(): Promise<void> {
    try {
      const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
      const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
      const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
      const redisPassword = this.configService.get<string>('REDIS_PASSWORD');
      const redisUrl = this.configService.get<string>('REDIS_URL');

      // Para desenvolvimento, sempre usar localhost se não tiver Redis remoto configurado explicitamente
      if (redisUrl) {
        // Usar URL completa (para ElastiCache ou Redis Cloud)
        this.logger.log('Using Redis URL configuration');
        this.redis = new Redis(redisUrl, {
          connectTimeout: 30000,
          commandTimeout: 10000,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          enableOfflineQueue: false,
        });
      } else if (redisHost && redisHost !== 'localhost') {
        // Configuração host/port para ElastiCache
        this.logger.log(`Using Redis host configuration: ${redisHost}:${redisPort}`);
        this.redis = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          connectTimeout: 30000,
          commandTimeout: 10000,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          enableOfflineQueue: false,
          tls: redisPassword ? {
            rejectUnauthorized: false,
            checkServerIdentity: () => undefined,
          } : undefined,
        });
      } else {
        // Fallback final para localhost
        this.logger.warn('No Redis configuration found, will use memory store');
        this.useRedis = false;
        return;
      }

      // Test Redis connection to set useRedis flag
      try {
        await this.redis.ping();
        this.useRedis = true;
        this.logger.log('Redis connection successful - using Redis for socket auth');
      } catch (error) {
        this.logger.warn(`Redis connection failed: ${error.message} - falling back to memory store`);
        this.useRedis = false;
        if (this.redis) {
          this.redis.disconnect();
        }
        return;
      }

      // Event listeners para monitoramento apenas se Redis estiver disponível
      this.redis.on('connect', () => {
        this.logger.log('Connected to Redis successfully');
        this.useRedis = true;
      });

      this.redis.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
        this.useRedis = false;
        // Em desenvolvimento, não falhar se Redis não estiver disponível
        const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
        if (nodeEnv === 'development') {
          this.logger.warn('Redis connection lost in development mode - falling back to memory store');
        }
      });

      this.redis.on('reconnecting', () => {
        this.logger.warn('Reconnecting to Redis...');
      });

      this.redis.on('ready', () => {
        this.logger.log('Redis is ready');
        this.useRedis = true;
      });

    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
      this.useRedis = false;
    }
  }

  /**
   * Verifica se o Redis está disponível
   */
  private async isRedisAvailable(): Promise<boolean> {
    if (!this.useRedis || !this.redis) {
      return false;
    }
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      this.logger.warn('Redis ping failed:', error.message);
      this.useRedis = false;
      return false;
    }
  }

  /**
   * Salva dados de autenticação do socket
   */
  async setSocketAuth(socketId: string, authData: Omit<SocketAuthData, 'connectedAt' | 'lastActivity'>): Promise<void> {
    const data: SocketAuthData = {
      ...authData,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    try {
      if (await this.isRedisAvailable()) {
        // Use Redis if available
        const key = this.getSocketKey(socketId);
        await this.redis.setex(key, this.defaultTTL, JSON.stringify(data));
        this.logger.log(`Socket auth saved to Redis: ${socketId} for user ${authData.userId}`);
      } else {
        // Fallback to memory store
        const expiresAt = Date.now() + (this.defaultTTL * 1000);
        this.memoryStore.set(socketId, { data, expiresAt });
        this.logger.log(`Socket auth saved to memory: ${socketId} for user ${authData.userId}`);
      }
    } catch (error) {
      this.logger.error(`Error saving socket auth for ${socketId}:`, error);
      // Fallback to memory store on Redis error
      const expiresAt = Date.now() + (this.defaultTTL * 1000);
      this.memoryStore.set(socketId, { data, expiresAt });
      this.logger.warn(`Saved to memory store as fallback for ${socketId}`);
    }
  }

  /**
   * Busca dados de autenticação do socket
   */
  async getSocketAuth(socketId: string): Promise<SocketAuthData | null> {
    try {
      if (await this.isRedisAvailable()) {
        // Try Redis first
        const key = this.getSocketKey(socketId);
        const redisData = await this.redis.get(key);
        
        if (redisData) {
          const authData = JSON.parse(redisData) as SocketAuthData;
          // Converte strings de data de volta para Date objects
          authData.connectedAt = new Date(authData.connectedAt);
          authData.lastActivity = new Date(authData.lastActivity);
          return authData;
        }
      }
      
      // Check memory store
      const memoryEntry = this.memoryStore.get(socketId);
      if (memoryEntry) {
        if (memoryEntry.expiresAt > Date.now()) {
          return memoryEntry.data;
        } else {
          // Entry expired, remove it
          this.memoryStore.delete(socketId);
        }
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error getting socket auth for ${socketId}:`, error);
      
      // Fallback to memory store only
      const memoryEntry = this.memoryStore.get(socketId);
      if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
        return memoryEntry.data;
      }
      
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
        throw new Error(`Socket ${socketId} not found`);
      }

      authData.sessionId = sessionId;
      authData.lastActivity = new Date();

      // Save back using the same hybrid approach
      if (await this.isRedisAvailable()) {
        const key = this.getSocketKey(socketId);
        await this.redis.setex(key, this.defaultTTL, JSON.stringify(authData));
      } else {
        const expiresAt = Date.now() + (this.defaultTTL * 1000);
        this.memoryStore.set(socketId, { data: authData, expiresAt });
      }

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

      // Save back using the same hybrid approach
      if (await this.isRedisAvailable()) {
        const key = this.getSocketKey(socketId);
        await this.redis.setex(key, this.defaultTTL, JSON.stringify(authData));
      } else {
        const expiresAt = Date.now() + (this.defaultTTL * 1000);
        this.memoryStore.set(socketId, { data: authData, expiresAt });
      }

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
      // Remove from Redis if available
      if (await this.isRedisAvailable()) {
        const key = this.getSocketKey(socketId);
        await this.redis.del(key);
      }
      
      // Always remove from memory store
      this.memoryStore.delete(socketId);
      
      this.logger.log(`Socket auth removed: ${socketId}`);
    } catch (error) {
      this.logger.error(`Error removing socket auth for ${socketId}:`, error);
      // Still try to remove from memory store
      this.memoryStore.delete(socketId);
    }
  }

  /**
   * Obtém todos os sockets autenticados (para estatísticas)
   */
  async getConnectedSocketsCount(): Promise<number> {
    try {
      if (await this.isRedisAvailable()) {
        const pattern = `${this.keyPrefix}*`;
        const keys = await this.redis.keys(pattern);
        return keys.length;
      } else {
        // Count active entries in memory store
        const now = Date.now();
        let count = 0;
        for (const [_, entry] of this.memoryStore.entries()) {
          if (entry.expiresAt > now) {
            count++;
          }
        }
        return count;
      }
    } catch (error) {
      this.logger.error('Error getting connected sockets count:', error);
      // Fallback to memory store count
      const now = Date.now();
      let count = 0;
      for (const [_, entry] of this.memoryStore.entries()) {
        if (entry.expiresAt > now) {
          count++;
        }
      }
      return count;
    }
  }

  /**
   * Busca sockets por userId
   */
  async getSocketsByUser(userId: string): Promise<string[]> {
    const sockets: string[] = [];
    
    try {
      if (await this.isRedisAvailable()) {
        const pattern = `${this.keyPrefix}*`;
        const keys = await this.redis.keys(pattern);

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
      }
      
      // Also check memory store
      const now = Date.now();
      for (const [socketId, entry] of this.memoryStore.entries()) {
        if (entry.expiresAt > now && entry.data.userId === userId) {
          // Avoid duplicates if Redis also returned this socket
          if (!sockets.includes(socketId)) {
            sockets.push(socketId);
          }
        }
      }

      return sockets;
    } catch (error) {
      this.logger.error(`Error getting sockets for user ${userId}:`, error);
      
      // Fallback to memory store only
      const now = Date.now();
      for (const [socketId, entry] of this.memoryStore.entries()) {
        if (entry.expiresAt > now && entry.data.userId === userId) {
          sockets.push(socketId);
        }
      }
      
      return sockets;
    }
  }

  /**
   * Limpa sockets expirados manualmente (backup do TTL automático)
   */
  async cleanupExpiredSockets(maxAgeMinutes: number = 60): Promise<number> {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    let cleaned = 0;

    try {
      // Clean Redis if available
      if (await this.isRedisAvailable()) {
        const pattern = `${this.keyPrefix}*`;
        const keys = await this.redis.keys(pattern);

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
      }

      // Clean memory store (this happens regardless of Redis availability)
      const now = Date.now();
      const maxAge = maxAgeMinutes * 60 * 1000;
      for (const [socketId, entry] of this.memoryStore.entries()) {
        const age = now - entry.data.lastActivity.getTime();
        if (age > maxAge) {
          this.memoryStore.delete(socketId);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        this.logger.log(`Cleaned up ${cleaned} expired socket entries`);
      }

      return cleaned;
    } catch (error) {
      this.logger.error('Error cleaning up expired sockets:', error);
      return cleaned; // Return whatever we managed to clean
    }
  }

  /**
   * Health check do Redis
   */
  async healthCheck(): Promise<boolean> {
    if (!this.useRedis || !this.redis) {
      this.logger.log('Health check: Using memory store (Redis not configured)');
      return true; // Memory store is always "healthy"
    }
    
    try {
      const result = await this.redis.ping();
      const isHealthy = result === 'PONG';
      this.useRedis = isHealthy; // Update flag based on health check
      return isHealthy;
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      this.useRedis = false;
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
