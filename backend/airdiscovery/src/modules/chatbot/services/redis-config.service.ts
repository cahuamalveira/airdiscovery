import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

@Injectable()
export class RedisConfigService {
  private readonly logger = new Logger(RedisConfigService.name);
  private readonly secretsManager: SecretsManagerClient;
  private cachedPassword: string | null = null;
  private passwordCacheExpiry: number = 0;
  private readonly cacheTimeMs = 5 * 60 * 1000; // 5 minutes cache

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION', 'us-east-2');
    this.secretsManager = new SecretsManagerClient({ region });
  }

  /**
   * Obtém a senha do Redis do Secrets Manager com cache
   */
  async getRedisPassword(): Promise<string> {
    // Check for cached password first
    if (this.cachedPassword && Date.now() < this.passwordCacheExpiry) {
      this.logger.debug('Using cached Redis password');
      return this.cachedPassword;
    }

    try {
      // Check if we have a hardcoded password in env for development
      const envPassword = this.configService.get<string>('REDIS_PASSWORD');
      if (envPassword && envPassword !== 'undefined') {
        this.logger.log('Using Redis password from environment variable');
        this.cachedPassword = envPassword;
        this.passwordCacheExpiry = Date.now() + this.cacheTimeMs;
        return envPassword;
      }

      // Get password from Secrets Manager
      const secretName = this.configService.get<string>('REDIS_AUTH_SECRET_NAME', 'air-discovery-redis-auth-token');
      
      this.logger.log(`Retrieving Redis password from Secrets Manager: ${secretName}`);
      
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });

      const response = await this.secretsManager.send(command);
      
      if (!response.SecretString) {
        throw new Error('Secret value is empty');
      }

      const secretData = JSON.parse(response.SecretString);
      const password = secretData['auth-token'];

      if (!password) {
        throw new Error('auth-token not found in secret');
      }

      // Cache the password
      this.cachedPassword = password;
      this.passwordCacheExpiry = Date.now() + this.cacheTimeMs;

      this.logger.log('Successfully retrieved Redis password from Secrets Manager');
      return password;

    } catch (error) {
      this.logger.error('Failed to retrieve Redis password from Secrets Manager:', error);
      
      // Fallback to environment variable if available
      const fallbackPassword = this.configService.get<string>('REDIS_PASSWORD');
      if (fallbackPassword) {
        this.logger.warn('Using fallback Redis password from environment');
        return fallbackPassword;
      }

      throw new Error(`Failed to retrieve Redis password: ${error.message}`);
    }
  }

  /**
   * Obtém a configuração completa do Redis
   */
  async getRedisConfig(): Promise<{
    host: string;
    port: number;
    password: string;
    url?: string;
  }> {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const password = await this.getRedisPassword();

    return {
      host,
      port,
      password,
      url: redisUrl,
    };
  }

  /**
   * Limpa o cache da senha (para forçar nova busca)
   */
  clearPasswordCache(): void {
    this.cachedPassword = null;
    this.passwordCacheExpiry = 0;
    this.logger.log('Redis password cache cleared');
  }
}
