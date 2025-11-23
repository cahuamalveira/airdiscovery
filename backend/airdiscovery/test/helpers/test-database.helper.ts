import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * Test Database Helper
 * 
 * Provides utilities for setting up and tearing down test database
 */
export class TestDatabaseHelper {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Clean all tables in the database
   * Useful for resetting state between tests
   */
  async cleanDatabase(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;

    // Disable foreign key checks temporarily
    await this.dataSource.query('SET session_replication_role = replica;');

    try {
      // Delete all data from each table
      for (const entity of entities) {
        const repository = this.dataSource.getRepository(entity.name);
        await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
      }
    } finally {
      // Re-enable foreign key checks
      await this.dataSource.query('SET session_replication_role = DEFAULT;');
    }
  }

  /**
   * Drop all tables and recreate schema
   * Use with caution - this will destroy all data
   */
  async resetDatabase(): Promise<void> {
    await this.dataSource.dropDatabase();
    await this.dataSource.synchronize();
  }

  /**
   * Check if database connection is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Create a test data source configuration
 */
export function createTestDataSourceConfig(configService: ConfigService) {
  return {
    type: 'postgres' as const,
    host: configService.get<string>('DATABASE_HOST', 'localhost'),
    port: configService.get<number>('DATABASE_PORT', 5432),
    username: configService.get<string>('DATABASE_USERNAME', 'postgres'),
    password: configService.get<string>('DATABASE_PASSWORD', 'password'),
    database: configService.get<string>('DATABASE_NAME', 'airdiscovery_test'),
    entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
    synchronize: true, // Auto-create schema for tests
    dropSchema: false, // Don't drop schema automatically
    logging: false, // Disable logging in tests
  };
}
