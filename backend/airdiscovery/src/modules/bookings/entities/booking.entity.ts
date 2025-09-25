import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
// Booking status values
export enum BookingStatus {
  PENDING = 'PENDING',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}
import { Customer } from '../../customers/entities/customer.entity';
import { Flight } from '../../flights/entities/flight.entity';
import { Passenger } from './passenger.entity';
import { Payment } from './payment.entity';

/**
 * Booking entity - relational model for flight reservations.
 */
@Entity('bookings')
export class Booking {
  // Use UUID to prevent IDOR
  @PrimaryGeneratedColumn('uuid', { name: 'booking_id' })
  booking_id: string;

  @ManyToOne(() => Customer, customer => customer.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Flight, flight => flight.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flight_id' })
  flight: Flight;

  @Column({ name: 'booking_date', type: 'date', default: () => 'CURRENT_DATE' })
  booking_date: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ name: 'status', type: 'enum', enum: BookingStatus })
  status: BookingStatus;

  @OneToMany(() => Passenger, passenger => passenger.booking, { cascade: true })
  passengers: Passenger[];

  @OneToMany(() => Payment, payment => payment.booking, { cascade: true })
  payments: Payment[];

  // Optional notes for cancellation or comments
  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  // Mercado Pago preference ID if applicable
  @Column({ name: 'preference_id', type: 'varchar', length: 100, nullable: true })
  preferenceId?: string;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business logic helpers
  canBePaid(): boolean {
    return this.status === BookingStatus.AWAITING_PAYMENT;
  }

  isFinalStatus(): boolean {
    return [BookingStatus.PAID, BookingStatus.CANCELLED].includes(this.status as BookingStatus);
  }
}
