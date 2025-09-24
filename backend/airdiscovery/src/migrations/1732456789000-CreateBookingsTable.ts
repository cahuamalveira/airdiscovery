import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

/**
 * Migration: Criar tabela de reservas (bookings)
 * 
 * Esta migration cria a tabela `bookings` com todos os campos necessários
 * para gerenciar reservas de voos, incluindo:
 * - Dados do passageiro
 * - Informações do voo
 * - Status da reserva
 * - Dados de pagamento
 * - Índices para performance
 */
export class CreateBookingsTable1732456789000 implements MigrationInterface {
  name = 'CreateBookingsTable1732456789000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para status da reserva
    await queryRunner.query(`
      CREATE TYPE "booking_status_enum" AS ENUM (
        'pending',
        'awaiting_payment', 
        'paid',
        'cancelled'
      )
    `);

    // Criar tabela bookings
    await queryRunner.createTable(
      new Table({
        name: 'bookings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'flight_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'ID do voo (Amadeus ou sistema interno)',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'ID do usuário que fez a reserva',
          },
          {
            name: 'status',
            type: 'booking_status_enum',
            default: "'pending'",
            isNullable: false,
            comment: 'Status atual da reserva',
          },
          {
            name: 'passenger_data',
            type: 'jsonb',
            isNullable: false,
            comment: 'Dados do passageiro em formato JSON',
          },
          {
            name: 'flight_details',
            type: 'jsonb',
            isNullable: false,
            comment: 'Detalhes completos do voo (dados do Amadeus)',
          },
          {
            name: 'total_amount',
            type: 'bigint',
            isNullable: false,
            comment: 'Valor total em centavos',
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'BRL'",
            isNullable: false,
            comment: 'Moeda da reserva (ISO 4217)',
          },
          {
            name: 'preference_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID da preferência do Mercado Pago',
          },
          {
            name: 'payment_data',
            type: 'jsonb',
            isNullable: true,
            comment: 'Dados adicionais do pagamento',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Observações ou notas adicionais',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Data de criação da reserva',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Data da última atualização',
          },
        ],
      }),
      true, // ifNotExists
    );

    // Criar índices para melhor performance
    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_user_id_status" ON "bookings" ("user_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_flight_id" ON "bookings" ("flight_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_bookings_preference_id" ON "bookings" ("preference_id")
      WHERE "preference_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_created_at" ON "bookings" ("created_at")
    `);

    // Criar trigger para atualizar updated_at automaticamente
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_bookings_updated_at 
        BEFORE UPDATE ON bookings 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Adicionar comentários à tabela
    await queryRunner.query(`
      COMMENT ON TABLE "bookings" IS 'Tabela de reservas de voos - gerencia o ciclo completo desde criação até pagamento'
    `);

    // Adicionar constraints adicionais para validação
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ADD CONSTRAINT "CHK_bookings_total_amount_positive" 
      CHECK (total_amount > 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ADD CONSTRAINT "CHK_bookings_currency_length" 
      CHECK (length(currency) = 3)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover trigger
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column()`);

    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_preference_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_flight_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_user_id_status"`);

    // Remover tabela
    await queryRunner.dropTable('bookings');

    // Remover enum
    await queryRunner.query(`DROP TYPE IF EXISTS "booking_status_enum"`);
  }
}