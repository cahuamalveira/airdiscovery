import { config } from 'dotenv';
import { join } from 'path';

/**
 * E2E Test Setup
 * 
 * This file runs before all e2e tests to configure the test environment
 */

// Load test environment variables
config({ path: join(__dirname, '../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test setup
beforeAll(() => {
  console.log('🧪 Starting E2E tests...');
  console.log(`📦 Database: ${process.env.DATABASE_NAME}`);
  console.log(`🔐 Auth: Mock mode`);
});

afterAll(() => {
  console.log('✅ E2E tests completed');
});
