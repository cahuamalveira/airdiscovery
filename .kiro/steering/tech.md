# Technology Stack

## Frontend (./app)

**Framework**: React 19 with TypeScript  
**Build Tool**: Vite 6  
**UI Library**: Material-UI (MUI) v7  
**State Management**: React Context API with reducers  
**Data Fetching**: TanStack React Query v5, Axios  
**Forms**: React Hook Form with Zod validation  
**Routing**: React Router DOM v7  
**Real-time**: Socket.io Client  
**Payment**: Stripe React components  
**Authentication**: AWS Amplify UI React  
**Testing**: Vitest, React Testing Library  
**Linting**: ESLint 9 with TypeScript plugin

### Frontend Commands

```bash
cd app
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests with Vitest
npm run lint         # Run ESLint
```

### Environment Variables

Frontend environment variables must use `VITE_` prefix to be accessible in the browser.

## Backend (./backend/airdiscovery)

**Framework**: NestJS 11 with TypeScript  
**Database**: PostgreSQL with TypeORM 0.3  
**Cache**: Redis (ioredis)  
**Session Storage**: AWS DynamoDB  
**Authentication**: AWS Cognito with JWT (jose library)  
**AI/LLM**: AWS Bedrock (Claude models)  
**Email**: AWS SES  
**Payment**: Stripe  
**Real-time**: Socket.io  
**External APIs**: Amadeus (flight data)  
**Testing**: Jest  
**Linting**: ESLint 9 with TypeScript plugin

### Backend Commands

```bash
cd backend/airdiscovery
npm run start:dev           # Start in watch mode
npm run build               # Build TypeScript
npm run start:prod          # Run production build
npm run test                # Run unit tests
npm run test:e2e            # Run e2e tests
npm run test:cov            # Run tests with coverage
npm run lint                # Run ESLint with auto-fix
npm run migration:generate  # Generate TypeORM migration
npm run migration:run       # Run pending migrations
npm run migration:revert    # Revert last migration
```

### Docker

Backend includes Dockerfile and docker-compose.yml for containerized development and deployment.

## Infrastructure (./backend/cdk-infra)

**IaC Tool**: AWS CDK (TypeScript)  
**Deployment**: AWS (ECS Fargate, S3, CloudFront, RDS, ElastiCache, Cognito, DynamoDB)  
**CI/CD**: GitHub Actions

### CDK Commands

```bash
cd backend/cdk-infra
cdk deploy           # Deploy stacks to AWS
cdk diff             # Compare deployed stack with current state
cdk synth            # Synthesize CloudFormation template
```

## Architecture Pattern

**Backend**: Modular monolith with NestJS modules (Auth, Bookings, Chatbot, Customers, Destinations, Flights, Mail, Stripe)  
**Frontend**: Component-based architecture with hooks and context  
**Database**: Relational model with TypeORM entities and migrations  
**Caching**: Multi-layer (Redis for sessions, PostgreSQL for Amadeus API responses)
