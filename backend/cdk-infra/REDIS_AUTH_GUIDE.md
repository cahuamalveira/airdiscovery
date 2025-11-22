# Como Usar Redis com Autenticação

## Configuração de Segurança Implementada

O Redis agora está configurado com:
- ✅ **Token de autenticação** gerenciado pelo AWS Secrets Manager
- ✅ **Criptografia em trânsito** (TLS)
- ✅ **Criptografia em repouso**
- ✅ **Acesso restrito** apenas dentro da VPC

## Outputs Disponíveis

```bash
AirDiscoveryRedisEndpoint        # Endpoint do Redis
AirDiscoveryRedisPort           # Porta do Redis (6379)
AirDiscoveryRedisClusterId      # ID do cluster
AirDiscoveryRedisAuthSecretArn  # ARN do secret com o token
```

## Exemplo de Uso na Aplicação

### 1. Obter o Token de Autenticação (Node.js)

```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager({ region: 'us-east-2' });

async function getRedisAuthToken() {
  try {
    const secret = await secretsManager.getSecretValue({
      SecretId: 'air-discovery-redis-auth-token'
    }).promise();
    
    const secretData = JSON.parse(secret.SecretString);
    return secretData['auth-token'];
  } catch (error) {
    console.error('Error retrieving Redis auth token:', error);
    throw error;
  }
}
```

### 2. Conectar ao Redis com Autenticação

```javascript
const Redis = require('ioredis');

async function createRedisConnection() {
  const authToken = await getRedisAuthToken();
  
  const redis = new Redis({
    host: process.env.REDIS_ENDPOINT, // Obtido do CloudFormation Output
    port: process.env.REDIS_PORT || 6379,
    password: authToken,
    tls: {
      // Habilitado devido à criptografia em trânsito
      rejectUnauthorized: false, // Para desenvolvimento
    },
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  });

  redis.on('connect', () => {
    console.log('Connected to Redis with authentication');
  });

  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  return redis;
}
```

### 3. Exemplo com Socket.io (Autenticação de Sessões)

```javascript
const { createRedisConnection } = require('./redis-config');

class SocketAuthService {
  constructor() {
    this.redis = null;
    this.initRedis();
  }

  async initRedis() {
    this.redis = await createRedisConnection();
  }

  async storeSocketSession(userId, socketId, sessionData) {
    const key = `socket:${userId}:${socketId}`;
    await this.redis.setex(key, 3600, JSON.stringify(sessionData)); // 1 hora TTL
  }

  async getSocketSession(userId, socketId) {
    const key = `socket:${userId}:${socketId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async removeSocketSession(userId, socketId) {
    const key = `socket:${userId}:${socketId}`;
    await this.redis.del(key);
  }
}

module.exports = SocketAuthService;
```

### 4. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente na sua aplicação:

```bash
REDIS_ENDPOINT=<obtido-do-cloudformation-output>
REDIS_PORT=6379
AWS_REGION=us-east-2
```

### 5. Permissões IAM Necessárias

A aplicação precisará das seguintes permissões para acessar o secret:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-2:*:secret:air-discovery-redis-auth-token*"
    }
  ]
}
```

## Considerações de Segurança

1. **Token Rotation**: Considere implementar rotação automática do token em produção
2. **Network**: Redis está em subnets privadas, acessível apenas dentro da VPC
3. **Encryption**: Dados em trânsito e em repouso são criptografados
4. **Monitoring**: Configure CloudWatch alarms para monitorar conexões Redis

## Comandos para Deploy

```bash
# Deploy apenas do cache stack
cdk deploy AirDiscoveryCacheStack

# Obter outputs
aws cloudformation describe-stacks \
  --stack-name AirDiscoveryCacheStack \
  --query 'Stacks[0].Outputs'
```
