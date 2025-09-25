import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class InitRelationalSchema1732456789001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create customers table
        await queryRunner.createTable(new Table({
            name: 'customers',
            columns: [
                { name: 'customer_id', type: 'serial', isPrimary: true },
                { name: 'name', type: 'varchar', length: '100', isNullable: false },
                { name: 'email', type: 'varchar', length: '100', isUnique: true, isNullable: false },
                { name: 'phone', type: 'varchar', length: '20', isNullable: true },
            ],
        }), true);

        // Create flights table
        await queryRunner.createTable(new Table({
            name: 'flights',
            columns: [
                { name: 'flight_id', type: 'serial', isPrimary: true },
                { name: 'flight_number', type: 'varchar', length: '20', isUnique: true, isNullable: false },
                { name: 'origin', type: 'varchar', length: '3', isNullable: false },
                { name: 'destination', type: 'varchar', length: '3', isNullable: false },
                { name: 'departure_time', type: 'timestamp', isNullable: false },
                { name: 'arrival_time', type: 'timestamp', isNullable: false },
            ],
        }), true);

        // Create bookings table
        await queryRunner.createTable(new Table({
            name: 'bookings',
            columns: [
                { name: 'booking_id', type: 'serial', isPrimary: true },
                { name: 'customer_id', type: 'int', isNullable: false },
                { name: 'booking_date', type: 'date', default: 'CURRENT_DATE', isNullable: false },
                { name: 'total_amount', type: 'decimal', precision: 10, scale: 2, isNullable: false },
                { name: 'status', type: 'varchar', length: '20', isNullable: false },
            ],
        }), true);
        await queryRunner.createForeignKey('bookings', new TableForeignKey({
            columnNames: ['customer_id'],
            referencedTableName: 'customers',
            referencedColumnNames: ['customer_id'],
            onDelete: 'CASCADE',
        }));

        // Create passengers table
        await queryRunner.createTable(new Table({
            name: 'passengers',
            columns: [
                { name: 'passenger_id', type: 'serial', isPrimary: true },
                { name: 'booking_id', type: 'int', isNullable: false },
                { name: 'first_name', type: 'varchar', length: '50', isNullable: false },
                { name: 'last_name', type: 'varchar', length: '50', isNullable: false },
                { name: 'passport_number', type: 'varchar', length: '20', isNullable: true },
            ],
        }), true);
        await queryRunner.createForeignKey('passengers', new TableForeignKey({
            columnNames: ['booking_id'],
            referencedTableName: 'bookings',
            referencedColumnNames: ['booking_id'],
            onDelete: 'CASCADE',
        }));

        // Create seats table
        await queryRunner.createTable(new Table({
            name: 'seats',
            columns: [
                { name: 'seat_id', type: 'serial', isPrimary: true },
                { name: 'flight_id', type: 'int', isNullable: false },
                { name: 'seat_number', type: 'varchar', length: '5', isNullable: false },
                { name: 'class', type: 'varchar', length: '20', isNullable: true },
                { name: 'is_available', type: 'boolean', default: true, isNullable: false },
            ],
        }), true);
        await queryRunner.createForeignKey('seats', new TableForeignKey({
            columnNames: ['flight_id'],
            referencedTableName: 'flights',
            referencedColumnNames: ['flight_id'],
            onDelete: 'CASCADE',
        }));

        // Create payments table
        await queryRunner.createTable(new Table({
            name: 'payments',
            columns: [
                { name: 'payment_id', type: 'serial', isPrimary: true },
                { name: 'booking_id', type: 'int', isNullable: false },
                { name: 'amount', type: 'decimal', precision: 10, scale: 2, isNullable: false },
                { name: 'payment_date', type: 'timestamp', default: 'NOW()', isNullable: false },
                { name: 'method', type: 'varchar', length: '20', isNullable: true },
                { name: 'status', type: 'varchar', length: '20', isNullable: false },
            ],
        }), true);
        await queryRunner.createForeignKey('payments', new TableForeignKey({
            columnNames: ['booking_id'],
            referencedTableName: 'bookings',
            referencedColumnNames: ['booking_id'],
            onDelete: 'CASCADE',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop in reverse order
        await queryRunner.dropTable('payments');
        await queryRunner.dropTable('seats');
        await queryRunner.dropTable('passengers');
        await queryRunner.dropTable('bookings');
        await queryRunner.dropTable('flights');
        await queryRunner.dropTable('customers');
    }
}
