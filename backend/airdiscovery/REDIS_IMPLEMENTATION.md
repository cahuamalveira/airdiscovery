# Redis Integration - Socket Authentication Store

## 🎯 **Objetivo**

Migrar o armazenamento de sockets autenticados de memória (`Map<string, object>`) para Redis, permitindo escalabilidade horizontal e preparando a infraestrutura para cache de APIs externas.

## 🏗️ **Arquitetura Atual**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Client  │───▶│   NestJS API     │───▶│   AWS Bedrock   │
│   (Socket.IO)   │    │   (WebSocket)    │    │   (Claude AI)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Redis          │    │   DynamoDB      │
                       │   (Socket Auth)  │    │   (Chat Sessions)│
                       └──────────────────┘    └─────────────────┘
```

## 📊 **Estrutura dos Dados Redis**

### Chaves de Socket Autenticado
```
Padrão: socket_auth:{socketId}
TTL: 3600 segundos (1 hora)

Exemplo:
socket_auth:abc123 -> {
  "userId": "user-uuid-123",
  "sessionId": "session-uuid-456", // opcional
  "connectedAt": "2025-09-13T10:00:00Z",
  "lastActivity": "2025-09-13T10:05:00Z"
}
```

### Futuras Expansões (Amadeus Cache)
```
Padrão: amadeus_cache:{endpoint}:{params_hash}
TTL: 300 segundos (5 minutos)

Exemplo:
amadeus_cache:flights:search:hash123 -> {
  "data": {...}, // Resposta da API
  "timestamp": "2025-09-13T10:00:00Z",
  "ttl": 300
}
```

## 🔧 **Componentes Implementados**

### 1. SocketAuthRepository
**Arquivo**: `src/modules/chatbot/repositories/socket-auth.repository.ts`

**Métodos Principais**:
```typescript
// Autenticação de Socket
setSocketAuth(socketId: string, authData: SocketAuthData): Promise<void>
getSocketAuth(socketId: string): Promise<SocketAuthData | null>
removeSocketAuth(socketId: string): Promise<void>

// Gerenciamento de Sessão
updateSocketSession(socketId: string, sessionId: string): Promise<void>
removeSocketSession(socketId: string): Promise<void>

// Estatísticas e Monitoramento
getConnectedSocketsCount(): Promise<number>
getSocketsByUser(userId: string): Promise<string[]>
cleanupExpiredSockets(maxAgeMinutes: number): Promise<number>

// Health Check
healthCheck(): Promise<boolean>
```

### 2. ChatbotGateway Refatorado
**Arquivo**: `src/modules/chatbot/chatbot.gateway.ts`

**Principais Mudanças**:
- ❌ Removido: `private readonly authenticatedSockets = new Map<string, object>()`
- ✅ Adicionado: `SocketAuthRepository` injetado
- ✅ Todos os métodos agora são `async`
- ✅ Dados de socket persistidos no Redis

**Fluxo de Autenticação**:
1. Cliente conecta → JWT validado → `setSocketAuth()`
2. Cliente inicia chat → `updateSocketSession()`
3. Cliente desconecta → `removeSocketAuth()`

## 🌍 **Configuração**

### Variáveis de Ambiente
```bash
# Redis Local (Desenvolvimento)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Redis Cloud/ElastiCache (Produção)
REDIS_URL=redis://username:password@host:port

# AWS ElastiCache Cluster
REDIS_URL=rediss://master.cluster-name.cache.amazonaws.com:6380
```

### Opções de Deployment

#### 1. **Desenvolvimento Local**
```bash
# Docker Compose
docker run -d -p 6379:6379 redis:7-alpine

# Ou via Docker Compose
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

#### 2. **AWS ElastiCache** (Recomendado para Produção)
```typescript
// CDK Configuration
const redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
  cacheNodeType: 'cache.t3.micro',
  engine: 'redis',
  numCacheNodes: 1,
  vpcSecurityGroupIds: [securityGroup.securityGroupId],
  cacheSubnetGroupName: subnetGroup.ref,
});
```

#### 3. **Redis Cloud** (Managed Service)
- Configuração via URL completa
- Backup automático e alta disponibilidade
- Ideal para MVP ou empresas pequenas

## 🚀 **Benefícios da Migração**

### Escalabilidade
- ✅ **Horizontal**: Múltiplas instâncias Fargate compartilham o mesmo estado
- ✅ **Performance**: Latência sub-ms para operações de socket
- ✅ **Memory Efficient**: TTL automático previne memory leaks

### Extensibilidade
- ✅ **Cache Amadeus**: Infraestrutura preparada para cache de APIs
- ✅ **Session Sharing**: Permite load balancing entre instâncias
- ✅ **Monitoring**: Métricas Redis via CloudWatch

### Confiabilidade
- ✅ **Persistence**: Configurável (RDB/AOF) para disaster recovery
- ✅ **Failover**: ElastiCache oferece failover automático
- ✅ **Backup**: Point-in-time recovery disponível

## 📈 **Métricas e Monitoramento**

### Métricas Redis Importantes
```typescript
// Implementadas no SocketAuthRepository
await socketAuthRepository.getConnectedSocketsCount(); // Sockets ativos
await socketAuthRepository.cleanupExpiredSockets(); // Limpeza manual
await socketAuthRepository.healthCheck(); // Status da conexão
```

### CloudWatch Metrics (ElastiCache)
- `CPUUtilization`: CPU usage do Redis
- `DatabaseMemoryUsagePercentage`: Uso de memória
- `CacheHits` / `CacheMisses`: Taxa de acerto do cache
- `NetworkBytesIn/Out`: Throughput de rede

## 🔮 **Roadmap Futuro**

### 1. **Cache API Amadeus** (Próxima Sprint)
```typescript
// AmadeusService com cache Redis
class AmadeusCacheRepository {
  async cacheFlightSearch(params: FlightSearchParams, data: any): Promise<void>
  async getCachedFlightSearch(params: FlightSearchParams): Promise<any | null>
  async invalidateFlightCache(pattern: string): Promise<void>
}
```

### 2. **Session Storage** (Futuro)
- Migrar sessões de chat do DynamoDB para Redis para maior performance
- Manter DynamoDB apenas para persistência de longo prazo

### 3. **Pub/Sub Features** (Futuro)
- Notificações entre instâncias
- Broadcasting de mensagens
- Real-time analytics

## 🔐 **Segurança**

### Configuração de Produção
```bash
# ElastiCache with encryption
REDIS_URL=rediss://cluster.cache.amazonaws.com:6380

# Auth token
REDIS_PASSWORD=your-auth-token

# VPC Security Group
- Permitir apenas tráfego interno (porta 6379/6380)
- Encryption in transit e at rest habilitados
```

### Best Practices
- ✅ Use TLS/SSL em produção (`rediss://`)
- ✅ Configure AUTH token para ElastiCache
- ✅ Limite conexões por instância
- ✅ Monitor memory usage e configure maxmemory policy

## 🧪 **Testes**

### Health Check Endpoint
```typescript
@Get('/health/redis')
async redisHealth() {
  const isHealthy = await this.socketAuthRepository.healthCheck();
  return { redis: isHealthy ? 'UP' : 'DOWN' };
}
```

### Load Testing
```bash
# Testar 1000 conexões simultâneas
artillery run websocket-load-test.yml
```

## 📝 **Migration Checklist**

- [x] ✅ Implementar `SocketAuthRepository`
- [x] ✅ Refatorar `ChatbotGateway` para usar Redis
- [x] ✅ Atualizar variáveis de ambiente
- [x] ✅ Registrar repository no módulo
- [x] ✅ Documentar arquitetura
- [ ] ⏳ Provisionar ElastiCache via CDK
- [ ] ⏳ Implementar health checks
- [ ] ⏳ Configurar monitoring/alertas
- [ ] ⏳ Load testing em ambiente de staging

A migração está **completa e ready for testing**! 🎉
