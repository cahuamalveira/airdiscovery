# ElastiCache Redis Setup Guide

## 🎯 **Objetivo**

Provisionar uma instância ElastiCache Redis via AWS CDK para suportar autenticação de sockets WebSocket e cache futuro de APIs do Amadeus.

## 🏗️ **Arquitetura Implementada**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Client  │───▶│   NestJS API     │───▶│   AWS Bedrock   │
│   (Socket.IO)   │    │   (WebSocket)    │    │   (Claude AI)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   ElastiCache    │    │   DynamoDB      │
                       │   (Socket Auth)  │    │   (Chat Sessions)│
                       └──────────────────┘    └─────────────────┘
                                │
                                ▼
                         ┌─────────────────┐
                         │  Private VPC    │
                         │  Subnets        │
                         └─────────────────┘
```

## 📋 **Recursos Provisionados**

### 1. **ElastiCache Redis Cluster**
```typescript
// Single node Redis 7.0
- Instance Type: cache.t3.micro (Free tier eligible)
- Engine Version: Redis 7.0 (latest stable)
- Nodes: 1 (pode escalar para cluster depois)
- Encryption: Transit disabled (development)
- Backup: 1 daily snapshot
```

### 2. **Security Group**
```typescript
// Restrictive access for Redis
- Inbound: Port 6379 apenas dentro da VPC
- Outbound: Bloqueado por padrão
- VPC: Mesma VPC do RDS e ECS
```

### 3. **Subnet Group**
```typescript
// Private subnets apenas
- Subnets: Todas as private subnets da VPC
- Availability Zones: Multi-AZ para alta disponibilidade
- Name: air-discovery-redis-subnet-group
```

## 🚀 **Deploy Instructions**

### 1. **Deploy da Infraestrutura**
```bash
cd backend/cdk-infra

# Verificar mudanças
npx cdk diff

# Deploy das mudanças
npx cdk deploy

# Aguardar provisionamento (3-5 minutos)
```

### 2. **Obter Outputs do CDK**
Após o deploy, os seguintes outputs estarão disponíveis:

```bash
# Verificar outputs
npx cdk ls --outputs

# Outputs disponíveis:
- RedisEndpoint: clustername.cache.amazonaws.com
- RedisPort: 6379  
- RedisClusterId: air-discovery-redis-xxxx
```

### 3. **Configurar Aplicação**
```bash
# No arquivo .env do backend
REDIS_HOST=<RedisEndpoint-from-cdk-output>
REDIS_PORT=6379
REDIS_PASSWORD=  # Vazio para esta configuração

# Ou usar URL completa:
# REDIS_URL=redis://clustername.cache.amazonaws.com:6379
```

## 📊 **Especificações Técnicas**

### Instance Sizing
```
cache.t3.micro:
- vCPU: 2
- Memory: 1 GB  
- Network: Up to 5 Gigabit
- Cost: ~$15/month (24/7)
```

### Performance Expectations
```
- Latency: < 1ms (same AZ)
- Throughput: ~100,000 ops/sec
- Connections: Up to 65,000 concurrent
- Storage: In-memory only
```

### Backup & Maintenance
```
- Backup Window: 02:00-03:00 UTC
- Maintenance Window: Sunday 03:00-04:00 UTC
- Retention: 1 day (development)
- Snapshot: Daily automatic
```

## 🔧 **Configuration Options**

### Development vs Production

**Development (Current):**
```typescript
cacheNodeType: 'cache.t3.micro'
numCacheNodes: 1
transitEncryptionEnabled: false
snapshotRetentionLimit: 1
```

**Production (Future):**
```typescript
cacheNodeType: 'cache.t3.small'  // or larger
numCacheNodes: 3  // Cluster mode
transitEncryptionEnabled: true
atRestEncryptionEnabled: true  // Replication groups only
snapshotRetentionLimit: 7
authTokenEnabled: true
```

### Scaling Options
```bash
# Horizontal scaling (cluster mode)
numCacheNodes: 3

# Vertical scaling  
cacheNodeType: 'cache.t3.small'   # 2GB RAM
cacheNodeType: 'cache.t3.medium'  # 4GB RAM
cacheNodeType: 'cache.m6g.large'  # 8GB RAM
```

## 🔐 **Security Configuration**

### Network Security
```typescript
// Security Group Rules
- Source: VPC CIDR (10.0.0.0/16)
- Protocol: TCP
- Port: 6379
- Description: "Redis access from application subnets only"
```

### Access Control
```bash
# Current: No authentication (private VPC only)
# Future: AUTH token + SSL/TLS

# Para produção, habilitar:
authTokenEnabled: true
transitEncryptionEnabled: true
```

### VPC Configuration
```typescript
// Private subnets apenas (sem internet gateway)
- Subnet 1: 10.0.2.0/24 (AZ-a)
- Subnet 2: 10.0.3.0/24 (AZ-b)
- NAT Gateway: Para atualizações de software
```

## 📈 **Monitoring & Alertas**

### CloudWatch Metrics
```bash
# Métricas importantes:
- CPUUtilization
- DatabaseMemoryUsagePercentage  
- CacheHits / CacheMisses
- NetworkBytesIn / NetworkBytesOut
- CurrConnections
```

### Recommended Alerts
```typescript
// CPU Usage > 80%
CPUUtilization > 80 for 5 minutes

// Memory Usage > 90%  
DatabaseMemoryUsagePercentage > 90 for 2 minutes

// Connection Count > 1000
CurrConnections > 1000 for 1 minute
```

## 🧪 **Testing & Validation**

### Health Check
```bash
# Via aplicação NestJS
curl http://localhost:3001/health/redis

# Response:
{
  "redis": "UP",
  "endpoint": "clustername.cache.amazonaws.com",
  "connectedSockets": 0
}
```

### Manual Testing
```bash
# Conectar via redis-cli (se em subnet pública ou via bastion)
redis-cli -h clustername.cache.amazonaws.com -p 6379

# Comandos básicos:
PING
SET test "hello"
GET test
INFO server
```

### Load Testing
```bash
# Testar throughput com redis-benchmark
redis-benchmark -h clustername.cache.amazonaws.com -p 6379 -c 100 -n 10000

# Expected results:
# SET: ~50,000 ops/sec
# GET: ~80,000 ops/sec  
# Latency: <1ms avg
```

## 💰 **Cost Optimization**

### Current Setup Cost
```bash
# cache.t3.micro (24/7):
- Instance: ~$15/month
- Data Transfer: ~$1/month (within AZ)
- Snapshots: ~$0.50/month (1GB)
- Total: ~$16.50/month
```

### Cost Reduction Tips
```bash
# 1. Use Reserved Instances (1-year):
# Savings: ~30-40% discount

# 2. Right-size instance:
# Monitor memory usage and downsize if needed

# 3. Optimize snapshot retention:
# Reduce from 7 days to 1 day for dev environment
```

## 🔮 **Future Enhancements**

### 1. **Cluster Mode** (High Availability)
```typescript
// Replication Group para cluster
const replicationGroup = new elasticache.CfnReplicationGroup(this, 'RedisReplicationGroup', {
  replicationGroupDescription: 'Redis cluster for AirDiscovery',
  numCacheClusters: 3,
  cacheNodeType: 'cache.t3.small',
  engine: 'redis',
  multiAzEnabled: true,
  atRestEncryptionEnabled: true,
  transitEncryptionEnabled: true,
});
```

### 2. **SSL/TLS Encryption**
```bash
# Production configuration
transitEncryptionEnabled: true
authTokenEnabled: true

# Connection string:
REDIS_URL=rediss://username:password@cluster.cache.amazonaws.com:6380
```

### 3. **Parameter Groups**
```typescript
// Custom Redis configuration
const parameterGroup = new elasticache.CfnParameterGroup(this, 'RedisParameterGroup', {
  cacheParameterGroupFamily: 'redis7',
  description: 'Custom Redis parameters for AirDiscovery',
  properties: {
    'maxmemory-policy': 'allkeys-lru',
    'timeout': '300',
    'tcp-keepalive': '60',
  },
});
```

### 4. **Global Tables** (Multi-Region)
```typescript
// Para aplicações globais
const globalReplicationGroup = new elasticache.CfnGlobalReplicationGroup(this, 'GlobalRedis', {
  globalReplicationGroupDescription: 'Global Redis for AirDiscovery',
  members: [
    { replicationGroupId: primaryReplicationGroup.ref, role: 'PRIMARY' },
    { replicationGroupId: secondaryReplicationGroup.ref, role: 'SECONDARY' },
  ],
});
```

## 📝 **Troubleshooting**

### Common Issues

**1. Connection Timeout**
```bash
# Verificar security groups
# Verificar subnet groups  
# Verificar VPC routing tables
```

**2. Memory Pressure**
```bash
# Verificar CloudWatch metrics
# Implementar cache eviction policies
# Consider upgrading instance type
```

**3. Performance Issues**
```bash
# Verificar cache hit ratio
# Otimizar key patterns
# Implementar connection pooling
```

## ✅ **Checklist de Deploy**

- [x] ✅ ElastiCache cluster configurado
- [x] ✅ Security groups restritivos
- [x] ✅ Subnet groups em private subnets
- [x] ✅ Outputs CDK exportados
- [x] ✅ Backup e maintenance windows configurados
- [ ] ⏳ Deploy realizado
- [ ] ⏳ Configuração de aplicação atualizada
- [ ] ⏳ Health checks implementados
- [ ] ⏳ Monitoring configurado
- [ ] ⏳ Load testing executado

A infraestrutura está **ready for deployment**! 🚀

## 🎯 **Next Steps**

1. **Deploy**: `npx cdk deploy` 
2. **Configure**: Atualizar `.env` com endpoint Redis
3. **Test**: Verificar conectividade e performance
4. **Monitor**: Configurar alertas CloudWatch
5. **Scale**: Planejar upgrade para cluster mode conforme demanda
