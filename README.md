### 1. Visão Geral da Arquitetura

A arquitetura proposta é um sistema distribuído e desacoplado, hospedado inteiramente na AWS, projetado para alta disponibilidade e escalabilidade. Utilizaremos uma abordagem de três camadas (three-tier architecture): uma camada de apresentação (frontend), uma camada de aplicação (backend) e uma camada de dados (banco de dados), complementadas por serviços gerenciados da AWS para autenticação e infraestrutura.

O AWS Cloud Development Kit (CDK) será a espinha dorsal de nossa estratégia de Infraestrutura como Código (IaC), permitindo-nos versionar, automatizar e replicar nossa infraestrutura de forma confiável em múltiplos ambientes (ex: desenvolvimento, homologação, produção).

## 🛫 **NOVO**: Sistema de Reserva de Voos Completo

**Status**: ✅ **IMPLEMENTADO**

O AirDiscovery agora possui um sistema completo de reserva de voos com:

- **Frontend Moderno**: CheckoutPage com stepper UI, validação de formulário e integração Stripe
- **Backend Robusto**: APIs para reservas, pagamentos e confirmações por email
- **Pagamento Stripe**: Integração completa com gateway internacional
- **Email Confirmations**: Templates profissionais via AWS SES
- **Testes Abrangentes**: Cobertura de testes >80% frontend e backend

📋 [Ver documentação completa do sistema de reservas](./FLIGHT_BOOKING_IMPLEMENTATION.md)

### Fluxo de Reserva:
1. **Seleção de Voo** → Botão "Selecionar Voo" na busca
2. **Checkout** → Formulário de passageiro com validação
3. **Pagamento Stripe** → Formulário seguro de cartão de crédito
4. **Confirmação** → Email enviado + status atualizado em tempo real

### APIs Principais:
- `POST /api/bookings` - Criar reserva
- `POST /api/payments/stripe/create-intent` - Criar Payment Intent
- `POST /api/webhooks/stripe` - Processar eventos Stripe
- `GET /api/bookings` - Listar reservas do usuário

### 2. Decomposição dos Componentes

#### **2.1. Frontend (ReactJS SPA)**

- Path no projeto: "./app"

- **Hospedagem:** O Single-Page Application (SPA) em React será hospedado como um site estático no **Amazon S3**.
    
- **Distribuição:** O **Amazon CloudFront** atuará como nossa CDN (Content Delivery Network), servindo o conteúdo do S3 globalmente. Isso garante baixa latência para usuários em qualquer lugar do mundo, além de fornecer uma camada de segurança (DDoS protection com AWS Shield Standard) e a gestão de certificados SSL/TLS.
    
- **Autenticação:** A integração com o **Amazon Cognito** será feita diretamente do cliente utilizando a biblioteca AWS Amplify, que simplifica os fluxos de login, registro e gerenciamento de sessões (JWT).
    

#### **2.2. Backend (NestJS)**

- Path no projeto: "./backend"

- **Containerização:** A aplicação NestJS será containerizada utilizando Docker, garantindo um ambiente de execução consistente e portátil.
    
- **Orquestração:** Utilizaremos o **Amazon Elastic Container Service (ECS)** com o tipo de inicialização **Fargate**. Essa abordagem serverless para containers nos permite executar nossa aplicação sem a necessidade de gerenciar servidores (instâncias EC2), com escalabilidade automática baseada em CPU e memória.
    
- **Gateway e Roteamento:** Um **Application Load Balancer (ALB)** será posicionado na frente do serviço ECS para distribuir o tráfego de entrada entre as tarefas do Fargate e para rotear requisições para os serviços corretos.
    
- **Estrutura Modular:** O backend será desenvolvido como um "monolito modular". Cada funcionalidade principal (Autenticação, Usuários, Destinos, Integração Amadeus, Reservas) será encapsulada em seu próprio módulo NestJS, promovendo uma forte separação de conceitos e facilitando a futura transição para microserviços, se necessário.
    

#### **2.3. Banco de Dados (PostgreSQL)**

- **Serviço Gerenciado:** Utilizaremos o **Amazon RDS for PostgreSQL**. Isso abstrai a complexidade operacional de gerenciamento do banco de dados, como provisionamento, patching, backups e recuperação.
    
- **Escalabilidade e Disponibilidade:** Iniciaremos com uma instância única, mas o RDS nos permite escalar verticalmente (aumentando a potência da instância) e horizontalmente (adicionando réplicas de leitura para cargas de trabalho intensivas em leitura) com facilidade. A configuração Multi-AZ pode ser ativada para garantir alta disponibilidade.
    

#### **2.4. Autenticação (Amazon Cognito)**

- **Gerenciamento de Identidades:** O Cognito User Pools será a nossa fonte de verdade para as identidades dos usuários. Ele gerenciará o registro, login, perfis de usuário e a emissão de JSON Web Tokens (JWT) após a autenticação bem-sucedida.
    
- **Federação:** Conforme solicitado, o Cognito será configurado para permitir login social com provedores de identidade como Google OAuth.
    

#### **2.5. CI/CD (GitHub Actions)**

- **Workflow:** Um pipeline robusto de integração e deployment contínuo será configurado no GitHub Actions.
    
- **Passos do Pipeline:**
    
    1. **Trigger:** Acionado em cada push para as branches `develop` (para ambiente de homologação) e `main` (para produção).
        
    2. **Build & Test:** Instalação de dependências, execução de linters e da suíte de testes unitários e de integração com Jest.
        
    3. **Docker Image:** Construção da imagem Docker do backend NestJS.
        
    4. **Push to ECR:** Envio da imagem versionada para o **Amazon Elastic Container Registry (ECR)**.
        
    5. **Deploy:** Atualização do serviço ECS para utilizar a nova imagem do ECR. Este passo pode ser executado via AWS CLI ou, de forma mais elegante, acionando um pipeline do AWS CDK.
        

### 3. Fluxo de Dados

#### **Cenário 1: Busca por Destino**

1. O usuário digita um destino no frontend React.
    
2. Uma requisição `GET /api/destinations?q=<destino>` é enviada ao nosso backend via CloudFront e ALB.
    
3. O `DestinationModule` do NestJS recebe a requisição. Ele primeiro consulta a tabela `destinations` no RDS para verificar se existem dados recentes (cacheados) para aquele destino.
    
4. **Cache Hit:** Se os dados existem e são considerados "frescos" (baseado em um timestamp `last_updated`), eles são retornados imediatamente ao usuário.
    
5. **Cache Miss:** Se não há dados ou estão desatualizados, o `DestinationModule` invoca o `AmadeusIntegrationModule`.
    
6. Este módulo faz uma chamada segura à API da Amadeus para buscar voos e pontos de interesse.
    
7. Os dados recebidos da Amadeus são transformados em nosso modelo de domínio, salvos/atualizados no banco de dados PostgreSQL (preenchendo tabelas como `flights`, `points_of_interest`, etc.) e então retornados ao frontend.
    

#### **Estratégia de Cache:**

O PostgreSQL servirá como nosso primeiro nível de cache persistente para dados da Amadeus, reduzindo custos de API e latência. A "validade" dos dados será controlada por uma política de TTL (Time-To-Live) definida no nível da aplicação. Por exemplo, informações de pontos de interesse podem ser cacheadas por semanas, enquanto preços de voos podem precisar ser revalidados a cada poucos minutos ou horas.

### 4. Plano de Implementação (Fases)

Propomos um desenvolvimento iterativo, dividido em fases para entregar valor de forma incremental.

#### **Fase 0: Fundação e CI/CD**

- **Metas:** Estabelecer a infraestrutura base e o pipeline de automação.
    
- **Tarefas:**
    
    - Configurar repositório no GitHub.
        
    - Inicializar o projeto AWS CDK e definir a infraestrutura essencial (VPC, Cognito User Pool, S3/CloudFront, cluster ECS, instância RDS).
        
    - Criar o pipeline inicial no GitHub Actions que executa testes, constrói a imagem Docker, a envia para o ECR e faz o deploy de uma versão "Hello World" do backend e frontend.
        
    - Configurar o ambiente de desenvolvimento local com Docker Compose.
        

#### **Fase 1: Autenticação e Busca de Destinos

- **Metas:** Permitir que usuários se cadastrem e busquem informações básicas de destinos.
    
- **Tarefas:**
    
    - **Backend:** Implementar o `AuthModule` com integração Cognito (login/registro). Desenvolver o `DestinationModule` e o `AmadeusIntegrationModule` (inicialmente apenas para pontos de interesse).
        
    - **Frontend:** Construir as páginas de Login/Registro utilizando a biblioteca AWS Amplify. Desenvolver a tela de busca e a de exibição de resultados.
        
    - **API:** Definir e implementar os endpoints RESTful: `POST /auth/login`, `GET /users/me`, `GET /destinations`.
        

#### **Fase 2: Voos e Pacotes de Itinerário

- **Metas:** Integrar a busca de voos e permitir a montagem de pacotes.
    
- **Tarefas:**
    
    - **Backend:** Expandir o `AmadeusIntegrationModule` para incluir busca de voos. Implementar a lógica de negócio para combinar voos e pontos de interesse em "pacotes".
        
    - **Frontend:** Desenvolver a UI para visualização e seleção de voos. Criar a tela de visualização do pacote completo (voo + itinerário).
        
    - **Cache:** Refinar a estratégia de cache no PostgreSQL para lidar com a alta volatilidade dos dados de voos.
        

#### **Fase 3: Processo de Reserva

- **Metas:** Habilitar a funcionalidade de reserva de pacotes.
    
- **Tarefas:**
    
    - **Backend:** Implementar o `BookingModule` com o endpoint `POST /bookings` protegido por autenticação.
        
    - **Banco de Dados:** Modelar e criar as tabelas `bookings`, `booking_flights`, etc.
        
    - **Frontend:** Construir o fluxo de checkout, a página de confirmação e a área "Minhas Viagens" no perfil do usuário.
        

#### **Fase 4: Preparação para Produção

- **Metas:** Garantir que a aplicação está pronta para o lançamento.
    
- **Tarefas:**
    
    - Configurar o ambiente de produção via CDK com capacidade e redundância adequadas.
        
    - Implementar logging, monitoramento e alertas centralizados com **Amazon CloudWatch**.
        
    - Realizar testes de carga e otimizar gargalos de performance.
        
    - Conduzir uma revisão de segurança na aplicação e infraestrutura.