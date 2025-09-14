# Air Discovery - Stacks Modulares

## Visão Geral

O código de infraestrutura foi modularizado em 5 stacks independentes, permitindo deploy granular e manutenção facilitada.

## Stacks Criadas

### 1. AirDiscoveryVpcStack
**Arquivo:** `lib/shared/vpc.ts`
**Recursos:**
- VPC com 2 AZs
- Subnets públicas e privadas
- Internet Gateway e NAT Gateway

**Exports:**
- `AirDiscoveryVpcId`
- `AirDiscoveryVpcCidr`

### 2. AirDiscoveryFrontendStack
**Arquivo:** `lib/stacks/frontend-spa-stack.ts`
**Recursos:**
- S3 Bucket para hosting do SPA
- CloudFront Distribution com OAC
- Deployment automático dos assets

**Exports:**
- `AirDiscoveryCloudFrontDistributionId`
- `AirDiscoveryCloudFrontDomainName`
- `AirDiscoveryS3BucketName`

### 3. AirDiscoveryAuthStack
**Arquivo:** `lib/stacks/auth-stack.ts`
**Recursos:**
- Cognito User Pool com configurações completas
- User Pool Client para SPA
- Identity Pool para autenticação
- Grupos de usuários (users/admins)

**Exports:**
- `AirDiscoveryUserPoolId`
- `AirDiscoveryUserPoolClientId`
- `AirDiscoveryIdentityPoolId`
- `AirDiscoveryUserPoolArn`
- `AirDiscoveryRegion`

### 4. AirDiscoveryDatabaseStack
**Arquivo:** `lib/stacks/database-stack.ts`
**Recursos:**
- RDS PostgreSQL instance
- DynamoDB table para chat sessions
- Security Groups apropriados

**Exports:**
- `AirDiscoveryDBEndpoint`
- `AirDiscoveryDBPort`
- `AirDiscoveryDBSecretArn`
- `AirDiscoveryChatSessionsTableName`
- `AirDiscoveryChatSessionsTableArn`

### 5. AirDiscoveryCacheStack
**Arquivo:** `lib/stacks/cache-stack.ts`
**Recursos:**
- ElastiCache Redis Replication Group
- Security Groups para Redis (**PÚBLICO para desenvolvimento**)
- Subnet Groups para cache (subnets públicas)
- **Secrets Manager** para gerenciar token de autenticação
- Criptografia em repouso habilitada

**Exports:**
- `AirDiscoveryRedisEndpoint`
- `AirDiscoveryRedisPort`
- `AirDiscoveryRedisClusterId`
- `AirDiscoveryRedisAuthSecretArn`

**⚠️ Configuração de Desenvolvimento:**
- ✅ Autenticação Redis com token gerenciado pelo AWS Secrets Manager
- ⚠️ **Acesso PÚBLICO** habilitado (0.0.0.0/0) para teste local
- ⚠️ **TLS desabilitado** para facilitar conexão local
- ✅ Criptografia em repouso mantida
- 🔐 **Senha obrigatória** para acesso

**📋 Para obter credenciais:**
```powershell
# Windows PowerShell
.\get-redis-credentials.ps1
```

## Dependências entre Stacks

```
VpcStack (base)
├── DatabaseStack (depende da VPC)
└── CacheStack (depende da VPC)

FrontendStack (independente)
AuthStack (independente)
```

## Comandos de Deploy

### Deploy completo (ordem recomendada):
```bash
cdk deploy AirDiscoveryVpcStack
cdk deploy AirDiscoveryFrontendStack AirDiscoveryAuthStack
cdk deploy AirDiscoveryDatabaseStack AirDiscoveryCacheStack
```

### Deploy individual:
```bash
cdk deploy AirDiscoveryVpcStack
cdk deploy AirDiscoveryFrontendStack
cdk deploy AirDiscoveryAuthStack
cdk deploy AirDiscoveryDatabaseStack
cdk deploy AirDiscoveryCacheStack
```

### Verificar diferenças:
```bash
cdk diff AirDiscoveryVpcStack
cdk diff AirDiscoveryFrontendStack
# ... para cada stack
```

## Vantagens da Modularização

1. **Deploy Granular:** Atualizar apenas componentes específicos
2. **Desenvolvimento Paralelo:** Times podem trabalhar em stacks independentes
3. **Rollback Controlado:** Reverter apenas a stack com problema
4. **Organização:** Código mais limpo e organizadoe
5. **Reutilização:** Componentes podem ser reutilizados em outros projetos
6. **Manutenção:** Facilita debugging e manutenção de componentes específicos

## Migração Concluída ✅

- ✅ Stack monolítico preservado como backup
- ✅ 5 stacks modulares criadas e testadas
- ✅ Sintese CDK validada com sucesso
- ✅ Dependências entre stacks configuradas
- ✅ Exports/Imports configurados
