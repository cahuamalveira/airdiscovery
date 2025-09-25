import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn, OneToMany } from "typeorm"
import { Booking } from '../../bookings/entities/booking.entity';

@Entity()
export class Flight {
    // Internal UUID primary key to prevent IDOR
    @PrimaryGeneratedColumn('uuid')
    id: string;
    // Amadeus offer ID for reference
    @Column({ name: 'amadeus_offer_id', type: 'varchar', length: 100, unique: true })
    amadeusOfferId: string;

    @Column({ name: 'departure_code', type: 'varchar', length: 10 })
    departureCode: string;

    @Column({ name: 'arrival_code', type: 'varchar', length: 10 })
    arrivalCode: string;
    
    // Additional Amadeus flight offer details
    @Column({ name: 'flight_number', type: 'varchar', length: 20 })
    flightNumber: string;
    @Column({ name: 'departure_datetime', type: 'timestamp' })
    departureDateTime: Date;
    @Column({ name: 'arrival_datetime', type: 'timestamp' })
    arrivalDateTime: Date;
    @Column({ name: 'price_total', type: 'decimal', precision: 10, scale: 2 })
    priceTotal: number;
    @Column({ name: 'currency', type: 'varchar', length: 10 })
    currency: string;

    // Store complete Amadeus offer payload for checkout context
    @Column({ name: 'amadeus_offer_payload', type: 'json', nullable: true })
    amadeusOfferPayload: any;
    
    @OneToMany(() => Booking, booking => booking.flight)
    bookings: Booking[];
}
