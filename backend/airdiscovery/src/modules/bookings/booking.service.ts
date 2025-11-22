import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, DataSource } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { StripeService } from '../stripe/stripe.service';
import { Passenger } from './entities/passenger.entity';
import { Flight } from '../flights/entities/flight.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CreateBookingDto, UpdateBookingDto, BookingQueryDto, BookingResponseDto, PassengerDataDto } from './dto/booking.dto';
import { LoggerService } from '../logger/logger.service';

/**
 * BookingService - Serviço para gerenciar reservas de voos
 * 
 * Implementa a lógica de negócio para:
 * - Criação de reservas
 * - Atualização de status
 * - Consultas com filtros
 * - Validações de estado
 * 
 * Segue padrões da AirDiscovery: Clean Architecture + SOLID + DDD
 */
@Injectable()
export class BookingService {
  private readonly logger: LoggerService;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Flight)
    private readonly flightRepository: Repository<Flight>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly loggerService: LoggerService,
  ) {
    this.logger = loggerService.child({ module: 'BookingService' });
  }

  /**
   * Criar uma nova reserva
   */
  async create(createBookingDto: CreateBookingDto, userId: string): Promise<BookingResponseDto> {
    this.logger.info('Creating new booking', {
      userId,
      flightId: createBookingDto.flightId,
      passengerCount: createBookingDto.passengers.length,
      totalAmount: createBookingDto.totalAmount,
      function: 'create',
    });

    try {
      // Validar dados de entrada
      await this.validateBookingData(createBookingDto);

      // Buscar Flight existente pelo ID interno (obrigatório)
      if (!createBookingDto.flightId) {
        throw new BadRequestException('flightId is required. Flight must be created first via POST /flights/from-offer');
      }

      const flightEntity = await this.flightRepository.findOne({ where: { id: createBookingDto.flightId } });
      if (!flightEntity) {
        throw new BadRequestException(`Flight with ID ${createBookingDto.flightId} not found`);
      }

      // Buscar ou criar Customer baseado no userId (UUID do Cognito)
      let customerEntity = await this.customerRepository.findOne({ where: { id: userId } });

      if (!customerEntity) {
        // Criar customer usando dados do primeiro passageiro (assumindo que é o usuário)
        const primaryPassenger = createBookingDto.passengers[0];
        if (!primaryPassenger) {
          throw new BadRequestException('At least one passenger is required to create a customer');
        }

        customerEntity = this.customerRepository.create({
          id: userId, // Use Cognito UUID
          name: `${primaryPassenger.firstName} ${primaryPassenger.lastName}`,
          email: primaryPassenger.email,
          phone: primaryPassenger.phone || undefined, // Convert null to undefined
        });

        customerEntity = await this.customerRepository.save(customerEntity);
        this.logger.debug('Created new customer', { userId, customerId: customerEntity.id });
      }

      // Mapear passageiros
      const passengerEntities: Passenger[] = createBookingDto.passengers.map(p => {
        const passenger = new Passenger();
        passenger.first_name = p.firstName;
        passenger.last_name = p.lastName;
        passenger.passport_number = p.document;
        passenger.email = p.email;
        passenger.phone = p.phone;
        passenger.document = p.document;
        passenger.birth_date = p.birthDate;
        return passenger;
      });

      // Criar e salvar reserva inicial
      const booking = this.bookingRepository.create({
        customer: customerEntity, // Use the full customer entity
        flight: flightEntity, // Use the full flight entity
        total_amount: createBookingDto.totalAmount,
        status: BookingStatus.PENDING,
        passengers: passengerEntities,
      });
      let saved = await this.bookingRepository.save(booking);

      this.logger.info('Booking created successfully', {
        bookingId: saved.booking_id,
        userId,
        flightId: createBookingDto.flightId,
        status: saved.status,
      });

      // Atualizar status para awaiting_payment
      saved.status = BookingStatus.AWAITING_PAYMENT;
      saved = await this.bookingRepository.save(saved);

      this.logger.info('Booking status updated', {
        bookingId: saved.booking_id,
        oldStatus: BookingStatus.PENDING,
        newStatus: BookingStatus.AWAITING_PAYMENT,
      });

      // Reload with relations for proper DTO conversion
      const bookingWithRelations = await this.bookingRepository.findOne({
        where: { booking_id: saved.booking_id },
        relations: ['customer', 'flight', 'passengers', 'payments']
      });

      return this.toResponseDto(bookingWithRelations!);
    } catch (error) {
      this.logger.error('Failed to create booking', error as Error, {
        userId,
        flightId: createBookingDto.flightId,
        function: 'create',
      });
      throw error;
    }
  }

  /**
   * Buscar reserva por ID
   */
  async findById(booking_id: string, userId?: string): Promise<BookingResponseDto> {
    const whereConditions: any = { booking_id };

    // Se userId for fornecido, filtrar apenas reservas do usuário
    if (userId) {
      whereConditions.customer = { id: userId };
    }

    const booking = await this.bookingRepository.findOne({
      where: whereConditions,
      relations: ['customer', 'flight', 'passengers', 'payments']
    });

    if (!booking) {
      throw new NotFoundException(`Reserva com ID ${booking_id} não encontrada`);
    }

    return this.toResponseDto(booking);
  }

  /**
   * Buscar reservas com filtros e paginação
   */
  async findMany(
    queryDto: BookingQueryDto,
    userId?: string,
  ): Promise<{ data: BookingResponseDto[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, status, flightId } = queryDto;

    // Construir condições de filtro
    const whereConditions: any = {};

    if (userId) {
      whereConditions.customer = { id: userId };
    }

    if (status) {
      whereConditions.status = status;
    }

    if (flightId) {
      whereConditions.flight = { id: flightId };
    }

    // Configurar opções de consulta
    const options: FindManyOptions<Booking> = {
      where: whereConditions,
      relations: ['customer', 'flight', 'passengers', 'payments'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    };

    // Executar consulta
    const [bookings, total] = await this.bookingRepository.findAndCount(options);

    return {
      data: bookings.map(booking => this.toResponseDto(booking)),
      total,
      page,
      limit,
    };
  }

  /**
   * Atualizar reserva
   */
  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
    userId?: string,
  ): Promise<BookingResponseDto> {
    this.logger.info('Updating booking', {
      bookingId: id,
      userId,
      updates: Object.keys(updateBookingDto),
      function: 'update',
    });

    try {
      // Buscar reserva existente
      const booking = await this.findBookingEntity(id, userId);
      const oldStatus = booking.status;

      // Validar transição de status
      if (updateBookingDto.status) {
        this.validateStatusTransition(booking.status, updateBookingDto.status);
      }

      // Aplicar atualizações, exceto dados de pagamento que são via entidade Payment
      const { paymentData, ...restDto } = updateBookingDto as any;
      Object.assign(booking, restDto);
      if (paymentData) {
        // TODO: Persistir payments via Payment entity
      }

      // Salvar alterações
      const updatedBooking = await this.bookingRepository.save(booking);

      // Log status change if it occurred
      if (updateBookingDto.status && oldStatus !== updateBookingDto.status) {
        this.logger.info('Booking status changed', {
          bookingId: id,
          oldStatus,
          newStatus: updateBookingDto.status,
        });
      }

      this.logger.info('Booking updated successfully', {
        bookingId: id,
        userId,
      });

      return this.toResponseDto(updatedBooking);
    } catch (error) {
      this.logger.error('Failed to update booking', error as Error, {
        bookingId: id,
        userId,
        function: 'update',
      });
      throw error;
    }
  }

  /**
   * Confirmar pagamento da reserva
   */
  async confirmPayment(
    bookingId: string,
    paymentData: {
      paymentId: string;
      transactionId?: string;
    },
  ): Promise<BookingResponseDto> {
    this.logger.info('Confirming payment for booking', {
      bookingId,
      paymentId: paymentData.paymentId,
      transactionId: paymentData.transactionId,
      function: 'confirmPayment',
    });

    try {
      // Confirm payment and persist via StripeService
      const booking = await this.findBookingEntity(bookingId);
      const oldStatus = booking.status;

      if (!booking.canBePaid()) {
        throw new BadRequestException(`Reserva não pode ser paga. Status atual: ${booking.status}`);
      }

      booking.status = BookingStatus.PAID;
      const updatedBooking = await this.bookingRepository.save(booking);

      this.logger.info('Payment confirmed successfully', {
        bookingId,
        oldStatus,
        newStatus: BookingStatus.PAID,
        paymentId: paymentData.paymentId,
      });

      // Delegate saving payment details
      return this.toResponseDto(updatedBooking);
    } catch (error) {
      this.logger.error('Failed to confirm payment', error as Error, {
        bookingId,
        paymentId: paymentData.paymentId,
        function: 'confirmPayment',
      });
      throw error;
    }
  }

  async updateBookingToAwaitingPayment(bookingId: string, preferenceId: string): Promise<void> {
    this.logger.info('Updating booking to awaiting payment', {
      bookingId,
      preferenceId,
      function: 'updateBookingToAwaitingPayment',
    });

    try {
      const booking = await this.findBookingEntity(bookingId);
      const oldStatus = booking.status;

      if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.AWAITING_PAYMENT) {
        throw new ConflictException(`Booking status must be PENDING to update to AWAITING_PAYMENT. Current status: ${booking.status}`);
      }

      if (booking.status === BookingStatus.AWAITING_PAYMENT && booking.preferenceId === preferenceId) {
        this.logger.debug('Booking already in awaiting payment status with same preference ID', {
          bookingId,
          preferenceId,
        });
        return; // No update needed
      }

      booking.status = BookingStatus.AWAITING_PAYMENT;
      booking.preferenceId = preferenceId;
      await this.bookingRepository.save(booking);

      this.logger.info('Booking status updated to awaiting payment', {
        bookingId,
        oldStatus,
        newStatus: BookingStatus.AWAITING_PAYMENT,
        preferenceId,
      });
    } catch (error) {
      this.logger.error('Failed to update booking to awaiting payment', error as Error, {
        bookingId,
        preferenceId,
        function: 'updateBookingToAwaitingPayment',
      });
      throw error;
    }
  }

  /**
   * Cancelar reserva
   */
  async cancel(id: string, userId?: string, reason?: string): Promise<BookingResponseDto> {
    this.logger.info('Cancelling booking', {
      bookingId: id,
      userId,
      reason,
      function: 'cancel',
    });

    try {
      const booking = await this.findBookingEntity(id, userId);
      const oldStatus = booking.status;

      // Verificar se a reserva pode ser cancelada
      if (booking.isFinalStatus()) {
        throw new BadRequestException(
          `Reserva não pode ser cancelada. Status atual: ${booking.status}`
        );
      }

      // Atualizar status e adicionar observação sobre o cancelamento
      booking.status = BookingStatus.CANCELLED;

      if (reason) {
        booking.notes = booking.notes
          ? `${booking.notes}\n\nCancelamento: ${reason}`
          : `Cancelamento: ${reason}`;
      }

      const updatedBooking = await this.bookingRepository.save(booking);

      this.logger.info('Booking cancelled successfully', {
        bookingId: id,
        oldStatus,
        newStatus: BookingStatus.CANCELLED,
        reason,
      });

      return this.toResponseDto(updatedBooking);
    } catch (error) {
      this.logger.error('Failed to cancel booking', error as Error, {
        bookingId: id,
        userId,
        function: 'cancel',
      });
      throw error;
    }
  }

  /**
   * Buscar reservas por preferenceId do Mercado Pago
   */
  async findByPreferenceId(preferenceId: string): Promise<Booking | null> {
    return this.bookingRepository.findOne({
      where: { preferenceId },
    });
  }


  /**
   * Métodos privados de apoio
   */

  /**
   * Buscar entidade de reserva (uso interno)
   */
  private async findBookingEntity(id: string, userId?: string): Promise<Booking> {
    const whereConditions: any = { booking_id: id };

    if (userId) {
      whereConditions.customer = { id: userId };
    }

    const booking = await this.bookingRepository.findOne({
      where: whereConditions,
      relations: ['customer', 'flight', 'passengers', 'payments'],
    });

    if (!booking) {
      throw new NotFoundException(`Reserva com ID ${id} não encontrada`);
    }

    return booking;
  }

  /**
   * Validar dados de reserva
   */
  private async validateBookingData(createBookingDto: CreateBookingDto): Promise<void> {
    // Validar se o valor total é positivo
    if (createBookingDto.totalAmount <= 0) {
      throw new BadRequestException('Valor total deve ser maior que zero');
    }

    // Validar passageiros
    if (!createBookingDto.passengers || createBookingDto.passengers.length === 0) {
      throw new BadRequestException('Ao menos um passageiro é obrigatório');
    }

    // Count adults and infants
    let adultCount = 0;
    let infantCount = 0;

    // Validar dados de cada passageiro
    for (const p of createBookingDto.passengers) {
      // Validar idade usando o método calculateAge
      const age = this.calculateAge(p.birthDate);
      
      if (age < 0 || age > 120) {
        throw new BadRequestException(`Idade inválida para passageiro ${p.firstName}`);
      }

      // Count adults (age >= 12) and infants (age < 2)
      if (age >= 12) {
        adultCount++;
      }
      if (age < 2) {
        infantCount++;
      }

      // Validar CPF
      if (!this.isValidCPF(p.document)) {
        throw new BadRequestException(`CPF inválido para passageiro ${p.firstName}`);
      }
    }

    // Validate at least one adult
    if (adultCount === 0) {
      throw new BadRequestException('Ao menos um adulto é obrigatório');
    }

    // Validate infant count doesn't exceed adult count
    if (infantCount > adultCount) {
      throw new BadRequestException('Número de bebês não pode exceder número de adultos');
    }
  }

  /**
   * Validar transição de status
   */
  private validateStatusTransition(currentStatus: BookingStatus, newStatus: BookingStatus): void {
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [BookingStatus.AWAITING_PAYMENT, BookingStatus.CANCELLED],
      [BookingStatus.AWAITING_PAYMENT]: [BookingStatus.PAID, BookingStatus.CANCELLED],
      [BookingStatus.PAID]: [], // Status final - sem transições permitidas
      [BookingStatus.CANCELLED]: [], // Status final - sem transições permitidas
    };

    const allowedStatuses = validTransitions[currentStatus];

    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Transição de status inválida: ${currentStatus} -> ${newStatus}`
      );
    }
  }

  /**
   * Calculate age from birth date considering month and day
   */
  private calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Validar CPF (algoritmo simplificado)
   */
  private isValidCPF(cpf: string): boolean {
    // Remover formatação
    const cleanCPF = cpf.replace(/\D/g, '');

    // Verificar se tem 11 dígitos
    if (cleanCPF.length !== 11) {
      return false;
    }

    // Verificar sequências inválidas (111.111.111-11, etc.)
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      return false;
    }

    // Implementação básica do algoritmo do CPF
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
  }

  /**
   * Converter entidade para DTO de resposta
   */
  private toResponseDto(booking: Booking): BookingResponseDto {
    return {
      // Support both legacy and new properties for compatibility
      id: booking.booking_id,
      flightId: booking.flight?.id ?? (booking as any).flightId,
      userId: booking.customer.id,
      status: booking.status,
      passengers: booking.passengers?.map(p => ({
        firstName: p.first_name,
        lastName: p.last_name,
        email: p.email,
        phone: p.phone,
        document: p.document,
        birthDate: p.birth_date,
      } as PassengerDataDto)) || [],
      totalAmount: Number(booking.total_amount),
      currency: 'BRL',
      payments: booking.payments?.map(pay => ({
        amount: Number(pay.amount),
        method: pay.method,
        status: pay.status,
        paymentDate: pay.payment_date,
      })) || [],
      // notes, createdAt, updatedAt if supported
    };
  }
}