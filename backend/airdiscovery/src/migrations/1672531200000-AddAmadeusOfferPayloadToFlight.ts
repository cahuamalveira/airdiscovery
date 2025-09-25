import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAmadeusOfferPayloadToFlight1672531200000 implements MigrationInterface {
    name = 'AddAmadeusOfferPayloadToFlight1672531200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flight" 
            ADD COLUMN "amadeus_offer_payload" jsonb
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flight" 
            DROP COLUMN "amadeus_offer_payload"
        `);
    }
}