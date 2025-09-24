import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto, UpdateBookingDto, BookingQueryDto, BookingResponseDto } from './dto/booking.dto';

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
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  /**
   * Criar uma nova reserva
   */
  async create(createBookingDto: CreateBookingDto, userId: string): Promise<BookingResponseDto> {
    try {
      // Validar dados de entrada
      await this.validateBookingData(createBookingDto);

      // Criar entidade de reserva
      const booking = this.bookingRepository.create({
        ...createBookingDto,
        userId,
        status: BookingStatus.PENDING,
      });

      // Salvar no banco de dados
      const savedBooking = await this.bookingRepository.save(booking);

      // Atualizar status para awaiting_payment após salvar
      savedBooking.status = BookingStatus.AWAITING_PAYMENT;
      const updatedBooking = await this.bookingRepository.save(savedBooking);

      return this.toResponseDto(updatedBooking);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao criar reserva: ' + error.message);
    }
  }

  /**
   * Buscar reserva por ID
   */
  async findById(id: string, userId?: string): Promise<BookingResponseDto> {
    const whereConditions: any = { id };
    
    // Se userId for fornecido, filtrar apenas reservas do usuário
    if (userId) {
      whereConditions.userId = userId;
    }

    const booking = await this.bookingRepository.findOne({
      where: whereConditions,
    });

    if (!booking) {
      throw new NotFoundException(`Reserva com ID ${id} não encontrada`);
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
      whereConditions.userId = userId;
    }
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (flightId) {
      whereConditions.flightId = flightId;
    }

    // Configurar opções de consulta
    const options: FindManyOptions<Booking> = {
      where: whereConditions,
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
    // Buscar reserva existente
    const booking = await this.findBookingEntity(id, userId);

    // Validar transição de status
    if (updateBookingDto.status) {
      this.validateStatusTransition(booking.status, updateBookingDto.status);
    }

    // Aplicar atualizações
    Object.assign(booking, updateBookingDto);

    // Salvar alterações
    const updatedBooking = await this.bookingRepository.save(booking);

    return this.toResponseDto(updatedBooking);
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
    const booking = await this.findBookingEntity(bookingId);

    // Validar se a reserva pode ser paga
    if (!booking.canBePaid()) {
      throw new BadRequestException(
        `Reserva não pode ser paga. Status atual: ${booking.status}`
      );
    }

    // Atualizar status e dados do pagamento
    booking.status = BookingStatus.PAID;
    booking.paymentData = {
      ...booking.paymentData,
      provider: 'mercadopago',
      paymentId: paymentData.paymentId,
      transactionId: paymentData.transactionId,
    };

    const updatedBooking = await this.bookingRepository.save(booking);

    return this.toResponseDto(updatedBooking);
  }

  /**
   * Cancelar reserva
   */
  async cancel(id: string, userId?: string, reason?: string): Promise<BookingResponseDto> {
    const booking = await this.findBookingEntity(id, userId);

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

    return this.toResponseDto(updatedBooking);
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
   * Atualizar dados do pagamento (usado pelos webhooks)
   */
  async updatePaymentData(
    bookingId: string,
    paymentData: any,
  ): Promise<BookingResponseDto> {
    const booking = await this.findBookingEntity(bookingId);

    booking.paymentData = {
      ...booking.paymentData,
      ...paymentData,
    };

    const updatedBooking = await this.bookingRepository.save(booking);

    return this.toResponseDto(updatedBooking);
  }

  /**
   * Métodos privados de apoio
   */

  /**
   * Buscar entidade de reserva (uso interno)
   */
  private async findBookingEntity(id: string, userId?: string): Promise<Booking> {
    const whereConditions: any = { id };
    
    if (userId) {
      whereConditions.userId = userId;
    }

    const booking = await this.bookingRepository.findOne({
      where: whereConditions,
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

    // Validar dados do voo
    if (!createBookingDto.flightDetails || !createBookingDto.flightDetails.id) {
      throw new BadRequestException('Detalhes do voo são obrigatórios');
    }

    // Validar dados do passageiro
    const { passengerData } = createBookingDto;
    
    // Validar idade (data de nascimento)
    const birthDate = new Date(passengerData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 18 || age > 120) {
      throw new BadRequestException('Passageiro deve ter entre 18 e 120 anos');
    }

    // Validar CPF (algoritmo simples)
    if (!this.isValidCPF(passengerData.document)) {
      throw new BadRequestException('CPF inválido');
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
      id: booking.id,
      flightId: booking.flightId,
      userId: booking.userId,
      status: booking.status,
      passengerData: booking.passengerData,
      flightDetails: booking.flightDetails,
      totalAmount: booking.totalAmount,
      currency: booking.currency,
      preferenceId: booking.preferenceId,
      paymentData: booking.paymentData,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }
}