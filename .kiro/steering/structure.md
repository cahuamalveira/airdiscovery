# Project Structure

## Root Organization

```
/
├── app/                    # React frontend application
├── backend/
│   ├── airdiscovery/      # NestJS backend application
│   └── cdk-infra/         # AWS CDK infrastructure code
├── docs/                   # Project documentation
└── *.md                    # Implementation summaries and guides
```

## Frontend Structure (./app/src)

```
src/
├── components/            # Reusable React components
│   ├── chat/             # Chat-related components
│   ├── checkout/         # Checkout flow components
│   ├── AuthGuard.tsx     # Route protection
│   ├── Layout.tsx        # Main layout wrapper
│   └── UserProfile.tsx   # User profile display
├── pages/                # Route-level page components
│   ├── Home.tsx
│   ├── ChatPageV2.tsx
│   ├── CheckoutPage.tsx
│   ├── FlightSearch.jsx
│   └── Wishlist.jsx
├── hooks/                # Custom React hooks
│   ├── checkout/         # Checkout-specific hooks
│   ├── useJsonChat.ts    # Chat functionality
│   └── useFlightSearch.ts
├── contexts/             # React Context providers
│   └── AuthContext.tsx
├── reducers/             # State management reducers
├── schemas/              # Zod validation schemas
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
├── config/               # Configuration (Amplify, etc.)
├── data/                 # Static data and mock data
└── tests/                # Test files
```

### Frontend Conventions

- Pages are route-level components in `pages/`
- Reusable UI components go in `components/`
- Business logic extracted to custom hooks in `hooks/`
- State management uses Context + reducers pattern
- Form validation with Zod schemas in `schemas/`
- TypeScript types centralized in `types/`

## Backend Structure (./backend/airdiscovery/src)

```
src/
├── modules/              # Feature modules (NestJS)
│   ├── auth/            # Authentication & authorization
│   ├── bookings/        # Flight booking management
│   ├── chatbot/         # AI chatbot functionality
│   ├── customers/       # User/customer management
│   ├── destinations/    # Destination recommendations
│   ├── flights/         # Flight search & data
│   ├── mail/            # Email notifications (SES)
│   └── stripe/          # Payment processing
├── common/              # Shared code
│   ├── amadeus/         # Amadeus API client
│   ├── clients/         # External service clients
│   ├── decorators/      # Custom decorators
│   ├── guards/          # Auth guards
│   └── middlewares/     # HTTP middlewares
├── services/            # Shared services
│   └── bedrock.service.ts  # AWS Bedrock LLM
├── config/              # Configuration modules
├── migrations/          # TypeORM database migrations
├── app.module.ts        # Root application module
├── main.ts              # Application entry point
└── data-source.ts       # TypeORM data source config
```

### Backend Conventions

- Each feature is a self-contained NestJS module in `modules/`
- Modules follow structure: controller, service, entity, DTOs
- Database entities use TypeORM decorators
- Migrations in `migrations/` with timestamp prefixes
- Shared functionality in `common/` (guards, decorators, clients)
- External API integrations in `common/clients/` or `common/amadeus/`
- Environment-specific config via NestJS ConfigModule

## Infrastructure Structure (./backend/cdk-infra)

```
cdk-infra/
├── lib/                  # CDK stack definitions
├── bin/                  # CDK app entry point
├── scripts/              # Deployment scripts
├── templates/            # CloudFormation templates
└── test/                 # Infrastructure tests
```

## Key Patterns

- **Modular Monolith**: Backend organized by business domain, not technical layer
- **Feature Folders**: Related files grouped by feature/module
- **Separation of Concerns**: Clear boundaries between presentation, business logic, and data access
- **Type Safety**: TypeScript throughout with strict typing
- **Testing Co-location**: Test files alongside source files (`.spec.ts`, `.test.tsx`)
