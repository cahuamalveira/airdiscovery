import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from 'typeorm';
import { Booking } from './booking.entity';

@Entity('passengers')
export class Passenger {
  @PrimaryGeneratedColumn({ name: 'passenger_id' })
  passenger_id: number;

  @ManyToOne(() => Booking, booking => booking.passengers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'first_name', type: 'varchar', length: '50' })
  first_name: string;

  @Column({ name: 'last_name', type: 'varchar', length: '50' })
  last_name: string;

  @Column({ name: 'passport_number', type: 'varchar', length: '20', nullable: true })
  passport_number: string;
  // Additional passenger details
  @Column({ name: 'email', type: 'varchar', length: 100 })
  email: string;
  @Column({ name: 'phone', type: 'varchar', length: 20 })
  phone: string;
  @Column({ name: 'document', type: 'varchar', length: 20 })
  document: string;
  @Column({ name: 'birth_date', type: 'date' })
  birth_date: string;
}