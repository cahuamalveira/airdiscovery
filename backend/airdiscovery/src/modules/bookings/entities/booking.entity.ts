import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index
} from 'typeorm';

/**
 * Status da reserva
 * - pending: Reserva criada, aguardando dados do passageiro
 * - awaiting_payment: Dados preenchidos, aguardando pagamento
 * - paid: Pagamento confirmado
 * - cancelled: Reserva cancelada
 */
export enum BookingStatus {
  PENDING = 'pending',
  AWAITING_PAYMENT = 'awaiting_payment',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

/**
 * Dados do passageiro armazenados em formato JSON
 */
export interface PassengerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  document: string;
  birthDate: string;
}

/**
 * Detalhes do voo armazenados em formato JSON (dados do Amadeus API)
 */
export interface FlightDetails {
  id: string;
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        dateTime: string;
      };
      arrival: {
        iataCode: string;
        dateTime: string;
      };
      carrierCode: string;
      aircraft?: {
        code: string;
      };
    }>;
  }>;
  price: {
    currency: string;
    total: string;
    base: string;
    grandTotal: string;
  };
  validatingAirlineCodes: string[];
  numberOfBookableSeats: number;
}

/**
 * Entidade Booking - Representa uma reserva de voo
 * Segue os padrões da AirDiscovery: Clean Architecture + TypeORM + NestJS
 */
@Entity('bookings')
@Index(['userId', 'status'])
@Index(['preferenceId'], { unique: true, where: 'preference_id IS NOT NULL' })
export class Booking {
  /**
   * ID único da reserva (UUID)
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID do voo (pode ser do Amadeus ou sistema interno)
   */
  @Column({ type: 'varchar', length: 255 })
  @Index()
  flightId: string;

  /**
   * ID do usuário que fez a reserva (obtido do JWT)
   */
  @Column({ type: 'varchar', length: 255 })
  @Index()
  userId: string;

  /**
   * Status atual da reserva
   */
  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  @Index()
  status: BookingStatus;

  /**
   * Dados do passageiro em formato JSON
   */
  @Column({ type: 'jsonb' })
  passengerData: PassengerData;

  /**
   * Detalhes completos do voo em formato JSON
   */
  @Column({ type: 'jsonb' })
  flightDetails: FlightDetails;

  /**
   * Valor total da reserva (em centavos para evitar problemas de float)
   */
  @Column({ type: 'bigint' })
  totalAmount: number;

  /**
   * Moeda da reserva (ISO 4217)
   */
  @Column({ type: 'varchar', length: 3, default: 'BRL' })
  currency: string;

  /**
   * ID da preferência do Mercado Pago (para rastreamento do pagamento)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  preferenceId?: string;

  /**
   * Dados adicionais do pagamento (JSON flexível para diferentes providers)
   */
  @Column({ type: 'jsonb', nullable: true })
  paymentData?: {
    provider: 'mercadopago';
    paymentId?: string;
    transactionId?: string;
    pixCode?: string;
    qrCodeBase64?: string;
    expirationDate?: string;
  };

  /**
   * Observações ou notas adicionais
   */
  @Column({ type: 'text', nullable: true })
  notes?: string;

  /**
   * Data de criação da reserva
   */
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /**
   * Data da última atualização
   */
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  /**
   * Método para verificar se a reserva está em status final
   */
  isFinalStatus(): boolean {
    return this.status === BookingStatus.PAID || this.status === BookingStatus.CANCELLED;
  }

  /**
   * Método para verificar se a reserva pode ser paga
   */
  canBePaid(): boolean {
    return this.status === BookingStatus.AWAITING_PAYMENT;
  }

  /**
   * Método para obter o nome completo do passageiro
   */
  getPassengerFullName(): string {
    return `${this.passengerData.firstName} ${this.passengerData.lastName}`;
  }

  /**
   * Método para calcular o valor total em reais (convertendo de centavos)
   */
  getTotalAmountInReais(): number {
    return this.totalAmount / 100;
  }
}