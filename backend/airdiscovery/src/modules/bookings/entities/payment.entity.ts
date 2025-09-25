import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from './booking.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn({ name: 'payment_id' })
  payment_id: number;

  @ManyToOne(() => Booking, booking => booking.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @Column({ name: 'amount', type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'currency', length: 3, default: 'brl' })
  currency: string;

  @Column({ name: 'payment_date', type: 'timestamp', default: () => 'NOW()' })
  payment_date: Date;

  @Column({ name: 'method', length: 20, nullable: true })
  method: string;

  @Column({ name: 'status', length: 20 })
  status: string;

  // Campos específicos do Stripe
  @Column({ name: 'payment_intent_id', nullable: true })
  paymentIntentId?: string;

  @Column({ name: 'provider', length: 20, default: 'stripe' })
  provider: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date;

  // Campos legados do Mercado Pago (manter para compatibilidade)
  @Column({ name: 'preference_id', nullable: true })
  preferenceId?: string;

  @Column({ name: 'external_reference', nullable: true })
  externalReference?: string;
}