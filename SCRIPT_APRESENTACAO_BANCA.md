# 🛫 Script de Apresentação - AirDiscovery
## Sistema de Busca e Reserva de Voos com Inteligência Artificial

**Duração Total**: 5 minutos (1 min por pessoa)
**Formato**: Apresentação formal para banca avaliadora
**Equipe**: 5 apresentadores

---

## 📋 Divisão de Responsabilidades

| **Pessoa** | **Responsabilidade** | **Duração** | **Foco Principal** |
|------------|---------------------|-------------|-------------------|
| **Pessoa 1** | Frontend & UX | 1 min | React, Interface, Fluxos |
| **Pessoa 2** | Backend & APIs | 1 min | NestJS, Integrações |
| **Pessoa 3** | Infraestrutura AWS | 1 min | CDK, Escalabilidade |
| **Pessoa 4** | IA & Chatbot | 1 min | AWS Bedrock, Personalização |
| **Pessoa 5** | Segurança & Qualidade | 1 min | Auth, Pagamentos, Testes |

---

# 👤 PESSOA 1 - FRONTEND & UX (1 min)

"Bom dia, membros da banca. Sou [Nome] e apresento o **AirDiscovery**, plataforma de reserva de voos com IA. 

**Stack Técnico**: React 18 + TypeScript, Material-UI, hospedado no S3 com CloudFront como CDN global.

**Principais Funcionalidades**:
- **Busca inteligente** via API Amadeus com filtros avançados
- **Checkout completo** com stepper UI e validação Zod
- **Pagamento Pix** integrado com QR code dinâmico
- **Chatbot IA** com floating button e streaming em tempo real
- **Dashboard** personalizado com histórico de reservas

**UX Highlights**: Interface responsiva, lazy loading, autenticação via Cognito com Google OAuth.

*Passando para [Nome] apresentar o backend que sustenta esta experiência.*"

---

# 👤 PESSOA 2 - BACKEND & APIs (1 min)

"Obrigado, [Nome]. Sou [Nome] e apresento a arquitetura **NestJS** que sustenta o AirDiscovery.

**Arquitetura Modular**: 6 módulos principais - Auth, Flights, Bookings, Chatbot, Payments e Users. Containerizado com Docker no **ECS Fargate** com auto-scaling.

**APIs Principais**:
```typescript
GET  /api/flights/search     → Amadeus integration
POST /api/bookings          → Sistema de reservas  
POST /api/payments/pix      → Mercado Pago
WebSocket /chatbot          → IA streaming
```

**Integrações Robustas**:
- **Amadeus API**: OAuth2 com cache TTL inteligente
- **Mercado Pago**: Webhooks para confirmação Pix
- **PostgreSQL RDS**: TypeORM com indexes otimizados
- **DynamoDB**: Sessões de chat com TTL automático

**Performance**: Connection pooling, pagination automática, validation DTOs.

*[Nome] apresentará a infraestrutura AWS que orquestra tudo isso.*"

---

# 👤 PESSOA 3 - INFRAESTRUTURA AWS (1 min)

"Obrigado, [Nome]. Sou [Nome] e apresento nossa **Infrastructure as Code** via **AWS CDK**.

**5 Stacks Modulares**:
```typescript
├── VpcStack       → Rede multi-AZ
├── AuthStack      → Cognito + IAM  
├── FrontendStack  → S3 + CloudFront
├── DatabaseStack  → RDS PostgreSQL
└── BackendStack   → ECS + ALB
```

**Escalabilidade Automática**:
- **ECS Fargate** serverless com auto-scaling CPU/memória
- **Multi-AZ deployment** para alta disponibilidade
- **CloudFront CDN** global com edge caching
- **RDS Multi-AZ** com automated backups

**Segurança Multicamada**:
- **VPC privada** com Security Groups restritivos
- **SSL/TLS** end-to-end, WAF para DDoS protection
- **IAM roles** com menor privilégio
- **Secrets Manager** para credenciais

**Monitoramento**: CloudWatch metrics, X-Ray tracing, alertas proativos.

*[Nome] apresentará a IA que diferencia nossa plataforma.*"

---

# 👤 PESSOA 4 - IA & CHATBOT (1 min)

"Obrigado, [Nome]. Sou [Nome] e apresento o **diferencial competitivo**: nosso sistema de IA conversacional.

**AWS Bedrock + Modelo Meta LLaMA**:
- **Streaming em tempo real** via WebSocket autenticado
- **JSON structured responses** para integração seamless
- **Context awareness** mantendo histórico da sessão

**Entrevista Inteligente**:
O chatbot coleta dados do perfil do viajante:
```typescript
interface TravelProfile {
  activities: string[];     // Aventura, cultura, relaxamento
  budget_range: string;     // Econômico, médio, premium  
  travel_purpose: string;   // Lazer, negócios, família
  hobbies: string[];       // Fotografia, culinária, história
}
```

**Recomendações Personalizadas**:
- **Algoritmo de matching** baseado no perfil coletado
- **Seasonal suggestions** respeitando orçamento
- **Dynamic follow-up questions** para refinamento

**Persistência**: DynamoDB com TTL de 24h, analytics para melhoria contínua.

*[Nome] fechará com segurança e qualidade do sistema.*"

---

# 👤 PESSOA 5 - SEGURANÇA & QUALIDADE (1 min)

"Obrigado, [Nome]. Sou [Nome] e fecho com os aspectos críticos de **segurança e qualidade**.

**Autenticação Robusta**:
- **Amazon Cognito** com JWT + MFA opcional

**Pagamentos Seguros**:
- **Webhook verification** com assinatura digital
- **Transações idempotentes** prevenindo duplicatas

**Monitoramento Proativo**: CloudWatch alarms, health checks automatizados.

**Conclusão**: O AirDiscovery combina inovação em IA com arquitetura enterprise-grade, segurança robusta e experiência excepcional. Obrigado!"

---

## 📊 Resumo Executivo

**Tecnologias**: React + TypeScript, NestJS, AWS (CDK/ECS/RDS/Cognito), Bedrock Claude, Mercado Pago

**Funcionalidades**: ✅ Auth seguro ✅ Busca Amadeus ✅ Reservas completas ✅ Pix integrado ✅ Chatbot IA ✅ Infra escalável

**Métricas**: <3s load, 99.9% uptime, >85% test coverage, OWASP/LGPD compliant

---
**Duração**: 5 minutos | **Formato**: Técnico para banca avaliadora