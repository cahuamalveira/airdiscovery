import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCustomerToUseUuid1672531300000 implements MigrationInterface {
    name = 'UpdateCustomerToUseUuid1672531300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraint first
        await queryRunner.query(`
            ALTER TABLE "bookings" 
            DROP CONSTRAINT IF EXISTS "FK_bookings_customer_id"
        `);

        // Backup existing customer data if any exists
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "customers_backup" AS 
            SELECT * FROM "customers"
        `);

        // Drop and recreate customer table with UUID
        await queryRunner.query(`
            DROP TABLE IF EXISTS "customers"
        `);

        await queryRunner.query(`
            CREATE TABLE "customers" (
                "customer_id" varchar(36) PRIMARY KEY,
                "name" varchar(100) NOT NULL,
                "email" varchar(100) UNIQUE NOT NULL,
                "phone" varchar(20)
            )
        `);

        // Update bookings table to handle UUID customer_id
        await queryRunner.query(`
            ALTER TABLE "bookings" 
            ALTER COLUMN "customer_id" TYPE varchar(36)
        `);

        // Recreate foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "bookings" 
            ADD CONSTRAINT "FK_bookings_customer_id" 
            FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") 
            ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "bookings" 
            DROP CONSTRAINT IF EXISTS "FK_bookings_customer_id"
        `);

        // Restore original customer table structure
        await queryRunner.query(`
            DROP TABLE IF EXISTS "customers"
        `);

        await queryRunner.query(`
            CREATE TABLE "customers" (
                "customer_id" SERIAL PRIMARY KEY,
                "name" varchar(100) NOT NULL,
                "email" varchar(100) UNIQUE NOT NULL,
                "phone" varchar(20)
            )
        `);

        // Restore customer data from backup if it exists
        await queryRunner.query(`
            INSERT INTO "customers" ("name", "email", "phone")
            SELECT "name", "email", "phone" FROM "customers_backup"
            WHERE EXISTS (SELECT 1 FROM "customers_backup")
        `);

        // Update bookings table back to integer customer_id
        await queryRunner.query(`
            ALTER TABLE "bookings" 
            ALTER COLUMN "customer_id" TYPE integer
        `);

        // Recreate foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "bookings" 
            ADD CONSTRAINT "FK_bookings_customer_id" 
            FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") 
            ON DELETE CASCADE
        `);

        // Drop backup table
        await queryRunner.query(`
            DROP TABLE IF EXISTS "customers_backup"
        `);
    }
}