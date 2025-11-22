# CDK Infrastructure - AWS Cognito Setup

Este projeto CDK cria a infraestrutura necessária para autenticação com AWS Cognito, incluindo User Pool, Identity Pool e grupos de usuários.

## 🏗️ Recursos Criados

### AWS Cognito
- **User Pool**: Para gerenciamento de usuários
- **User Pool Client**: Para integração com aplicações SPA
- **Identity Pool**: Para autenticação federada
- **Grupos de Usuários**:
  - `users`: Usuários comuns (precedence: 1)
  - `admins`: Administradores (precedence: 0)

### AWS RDS
- **PostgreSQL Database**: Para dados da aplicação
- **VPC e Security Groups**: Infraestrutura de rede

## 🚀 Como usar

### 1. Pré-requisitos

```bash
# Instalar dependências
npm install

# Configurar AWS CLI (se ainda não configurado)
aws configure

# Bootstrap CDK (primeira vez apenas)
cdk bootstrap
```

### 2. Deploy da Infraestrutura

```bash
# Opção 1: Deploy completo com configuração automática
npm run deploy-auth

# Opção 2: Deploy manual
npm run build
cdk deploy

# Opção 3: Apenas extrair configuração (se já deployado)
npm run setup-auth
```

## 📄 Outputs Gerados

Após o deploy, os seguintes outputs são disponibilizados:

- **UserPoolId**: ID do Cognito User Pool
- **UserPoolClientId**: ID do App Client
- **IdentityPoolId**: ID do Identity Pool
- **UserPoolArn**: ARN do User Pool
- **Region**: Região AWS
- **DBInstanceEndpoint**: Endpoint do banco de dados

## 🔧 Configuração Automática

O script `setup-auth.js` automaticamente:

1. **Extrai os outputs** do CDK após deploy
2. **Gera arquivo `.env`** no frontend com as variáveis necessárias
3. **Cria configuração TypeScript** do Amplify

### Arquivos Gerados

```
app/
├── .env                           # Variáveis de ambiente
└── src/config/amplify-generated.ts  # Configuração do Amplify
```

## 👥 Gerenciamento de Usuários

### Criar Usuário Admin via CLI

```bash
# Criar usuário admin
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username admin@example.com \
  --user-attributes Name=email,Value=admin@example.com Name=given_name,Value=Admin \
  --temporary-password TempPassword123! \
  --message-action SUPPRESS

# Definir senha permanente
aws cognito-idp admin-set-user-password \
  --user-pool-id <USER_POOL_ID> \
  --username admin@example.com \
  --password NewPassword123! \
  --permanent

# Adicionar ao grupo de admins
aws cognito-idp admin-add-user-to-group \
  --user-pool-id <USER_POOL_ID> \
  --username admin@example.com \
  --group-name admins
```

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
