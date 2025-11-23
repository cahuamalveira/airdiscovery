# E2E Testing Guide

This directory contains end-to-end (e2e) integration tests for the AIR Discovery backend.

## Prerequisites

Before running e2e tests, ensure you have:

1. **PostgreSQL Database**: A test database instance running
2. **Redis** (optional): For session storage tests
3. **Node.js**: Version 18 or higher
4. **Dependencies**: Run `npm install` in the backend directory

## Test Database Setup

### Option 1: Use Existing Database

If you have a PostgreSQL instance running, update `.env.test`:

```bash
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=airdiscovery_test
```

### Option 2: Use Docker

Run a PostgreSQL container for testing:

```bash
docker run --name postgres-test \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=airdiscovery_test \
  -p 5432:5432 \
  -d postgres:15
```

### Create Test Database

If using an existing PostgreSQL instance:

```bash
psql -U postgres -c "CREATE DATABASE airdiscovery_test;"
```

## Running E2E Tests

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run Specific Test Suite

```bash
npm run test:e2e -- payment-flow.e2e-spec.ts
```

### Run with Coverage

```bash
npm run test:e2e -- --coverage
```

### Run in Watch Mode (Development)

```bash
npm run test:e2e -- --watch
```

## Test Configuration

### Environment Variables

E2E tests use `.env.test` for configuration. Key variables:

- `NODE_ENV=test` - Enables test mode
- `DATABASE_NAME=airdiscovery_test` - Separate test database
- `LOG_LEVEL=error` - Reduces log noise during tests
- Mock AWS credentials (no real AWS calls in tests)

### Mock Authentication

Tests use `MockAuthMiddleware` instead of real Cognito authentication:

- No real JWT tokens required
- Test user automatically injected: `test-user-123`
- Customize per test by modifying the middleware

### Test Database

- Schema is auto-created on first run (`synchronize: true`)
- Data is cleaned between test suites
- Uses separate database from development

## Test Structure

### Payment Flow Tests (`payment-flow.e2e-spec.ts`)

Tests the complete payment flow including:

1. **Complete booking + payment flow**
   - Create booking with passengers
   - Create payment intent
   - Verify amounts match

2. **Multi-passenger calculations**
   - Test amount calculation for multiple passengers
   - Verify Stripe payment intent metadata

3. **Currency handling**
   - Test BRL and USD currencies
   - Verify proper cent conversion

4. **Concurrent payment attempts**
   - Test duplicate payment prevention
   - Verify 409 Conflict response

5. **Invalid booking states**
   - Test payment rejection for cancelled bookings
   - Test payment rejection for paid bookings

6. **Amount verification**
   - Verify booking amount matches Stripe amount
   - Test decimal amount handling

## Troubleshooting

### Database Connection Errors

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Ensure PostgreSQL is running and `.env.test` has correct credentials.

### Jest Module Resolution Errors

```
SyntaxError: Unexpected token 'export'
```

**Solution**: The `jest-e2e.json` config handles ESM modules. Ensure it's properly configured.

### Stripe API Errors

```
Error: Invalid API Key provided
```

**Solution**: Tests use mock Stripe keys. Ensure `.env.test` has `STRIPE_SECRET_KEY=sk_test_mock_key_for_testing`.

### Timeout Errors

```
Timeout - Async callback was not invoked within the 5000 ms timeout
```

**Solution**: Increase timeout in `jest-e2e.json` or specific test:

```typescript
jest.setTimeout(30000); // 30 seconds
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data in `afterEach` or `afterAll`
3. **Realistic Data**: Use realistic test data that matches production patterns
4. **Error Cases**: Test both success and failure scenarios
5. **Performance**: Keep tests fast by minimizing database operations

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run E2E Tests
  run: |
    docker run -d --name postgres-test \
      -e POSTGRES_PASSWORD=password \
      -e POSTGRES_DB=airdiscovery_test \
      -p 5432:5432 postgres:15
    
    sleep 5  # Wait for PostgreSQL to start
    
    cd backend/airdiscovery
    npm run test:e2e
  env:
    DATABASE_HOST: localhost
    DATABASE_PORT: 5432
    DATABASE_USERNAME: postgres
    DATABASE_PASSWORD: password
    DATABASE_NAME: airdiscovery_test
```

## Writing New E2E Tests

### Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Feature Name (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should test feature', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/endpoint')
      .set('Authorization', 'Bearer mock-token')
      .expect(200);

    expect(response.body).toBeDefined();
  });
});
```

## Additional Resources

- [NestJS Testing Documentation](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [TypeORM Testing Guide](https://typeorm.io/testing)
