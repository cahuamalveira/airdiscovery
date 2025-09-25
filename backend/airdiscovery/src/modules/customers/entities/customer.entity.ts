import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('customers')
export class Customer {
  // Use Cognito UUID as primary key
  @PrimaryColumn({ name: 'customer_id', type: 'varchar', length: 36 })
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @OneToMany(() => Booking, booking => booking.customer)
  bookings: Booking[];
}
