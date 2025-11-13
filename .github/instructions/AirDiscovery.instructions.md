---
applyTo: '**/*.js, **/*.ts, **/*.jsx, **/*.tsx'
title: AirDiscovery Project Instructions
---
description: >
  Instructions for AI to understand the AirDiscovery project context and coding standards.
  
# Coding Guidelines for the AirDiscovery Project

These guidelines instruct the AI to write optimized, clear code aligned with the project's requirements and architecture.

## 1. Overall Architecture
- Clearly separate the frontend, backend, and data layers (three-tier).
- Use IaC (AWS CDK) to provision infrastructure (S3, CloudFront, ECS, RDS, Cognito).

## 2. Code Standards and Quality
- Follow the ESLint and Prettier rules defined in `airdiscovery/eslint.config.js`.
- Write code in TypeScript, leveraging strong typing and interfaces (use `tsconfig.json`).
- Apply SOLID and Clean Architecture: cohesive, low-coupling modules.
- Document functions and components with TSDoc comments.

## 3. Frontend (ReactJS)
- Structure components in `src/components` and pages in `src/pages`.
- Use AWS Amplify for authentication with Cognito and maintain sessions via context (`AuthContext`).
- Protect routes with `AuthGuard` (redirect unauthenticated users).
- Implement Lazy Loading and Suspense to optimize route loading.
- Manage UI state with `useReducer` and `useAuthUI`, following patterns defined in `src/reducers`.
- Keep modular styles: CSS Modules or Tailwind (according to current configuration).

## 4. Backend (NestJS)
- Create independent modules in `backend/airdiscovery/src` (`AuthModule`, `DestinationModule`, `AmadeusModule`, `BookingModule`).
- Use DTOs with validation via `class-validator` and `class-transformer`.
- Handle errors using global filters (`ExceptionFilter`) and interceptors (`LoggingInterceptor`).
- Configure Dockerfile and Compose for the local environment (aligned with `backend/docker-compose.yml`).
- Integrate with the Amadeus API securely, abstracting calls in dedicated services.

## 5. Database and Cache
- Use managed PostgreSQL (Amazon RDS) and an ORM (TypeORM or Prisma) for migrations and models.
- Implement cache TTL on destination and flight entities, validating `last_updated`.
- Separate repositories (Repository pattern) for data access.

## 6. Authentication and Security
- Use Amazon Amplify with Cognito for secure authentication.
- Do not store passwords directly; use Cognito for user management.
- Use HTTPS/TLS and configure restrictive CORS.
- Centralize authentication logic in the `AuthModule` and use NestJS Guards.

## 7. Performance and Monitoring
- Implement pagination and filters on listing endpoints.
- Use AWS CloudWatch and ECS logs to monitor metrics.
- Apply GZIP and compression to HTTP responses via middleware.

## 8. Testing
- Frontend: write unit tests with Vitest (`src/*.test.tsx`), use `@testing-library/react`.
- Backend: write unit and e2e tests with Jest (configured in `backend/test`).
- Maintain coverage >=80% and add tests for critical flows (authentication, search, booking).

## 9. CI/CD
- Set up GitHub Actions to run lint, tests, Docker build, and CDK deploy.
- Trigger pipelines on pushes to `develop` (staging) and `main` (production).

## 10. Documentation
- Update `README.md` and docs in `docs/` for new endpoints and flows.
- Use Swagger (`@nestjs/swagger`) to document the REST API.