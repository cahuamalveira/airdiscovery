import { Injectable, Inject, BadRequestException, InternalServerErrorException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BookingService } from '../bookings/booking.service';
import { Payment as PaymentEntity } from '../bookings/entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { BookingStatus } from '../bookings/entities/booking.entity';
import { CreatePaymentIntentDto } from './dto/stripe.dto';
import { LoggerService } from '../logger/logger.service';

export interface PaymentIntentResponse {
  id: string;
  clientSecret: string;
  status: string;
  amount: number;
  currency: string;
}

/**
 * StripeService - Serviço para integração com Stripe
 * 
 * Funcionalidades:
 * - Criação de Payment Intents
 * - Processamento de webhooks
 * - Integração com sistema de reservas
 * - Notificações por email
 * 
 * Segue padrões da AirDiscovery: Clean Architecture + SOLID + DDD
 */
@Injectable()
export class StripeService {
  private readonly logger: LoggerService;

  constructor(
    @Inject(Stripe) private readonly stripe: Stripe,
    private readonly configService: ConfigService,
    private readonly bookingService: BookingService,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    private readonly mailService: MailService,
    private readonly loggerService: LoggerService,
  ) {
    this.logger = loggerService.child({ module: 'StripeService' });
  }

  /**
   * Criar Payment Intent para processamento de pagamento
   * 
   * SECURITY MODEL (Requirements 1, 2, 3, 4, 5, 6):
   * - Amount is NEVER accepted from client - retrieved from booking entity
   * - User ownership is validated before processing
   * - Booking status and duplicate payments are checked
   * - All operations are logged for audit trail
   * 
   * @param bookingId - UUID of the booking
   * @param userId - User ID from JWT token for ownership validation
   * @returns Payment intent client secret and calculated amount
   */
  async createPaymentIntent(
    bookingId: string,
    userId: string
  ): Promise<PaymentIntentResponse> {
    this.logger.info('Creating payment intent', {
      bookingId,
      userId,
      function: 'createPaymentIntent',
    });

    try {
      // Requirement 2.1: Fetch booking and validate ownership
      const bookingDto = await this.bookingService.findById(bookingId, userId);
      
      if (!bookingDto) {
        this.logger.warn('Booking not found or unauthorized', {
          bookingId,
          userId,
        });
        throw new NotFoundException('Booking not found');
      }

      // Requirement 2.2: Validate user owns booking (already validated by findById with userId)
      // The findById method with userId parameter ensures only the owner's booking is returned

      // Requirement 3.1: Validate booking status is PENDING or AWAITING_PAYMENT (for retries)
      if (bookingDto.status !== BookingStatus.PENDING && bookingDto.status !== BookingStatus.AWAITING_PAYMENT) {
        this.logger.warn('Invalid booking status', {
          bookingId,
          status: bookingDto.status,
        });
        throw new BadRequestException(`Booking status must be PENDING or AWAITING_PAYMENT. Current status: ${bookingDto.status}`);
      }

      // Requirement 3.3: Check for successful payment (prevent duplicate successful payments)
      const existingSuccessfulPayment = await this.paymentRepository.findOne({
        where: { 
          bookingId, 
          paymentIntentId: Not(IsNull()),
          status: 'succeeded' // Only block if payment already succeeded
        },
      });

      if (existingSuccessfulPayment?.paymentIntentId) {
        this.logger.warn('Payment already completed', {
          bookingId,
          existingPaymentIntentId: existingSuccessfulPayment.paymentIntentId,
        });
        throw new ConflictException('Payment already completed for this booking');
      }

      // Check for existing pending payment intent and reuse it if possible
      const existingPendingPayment = await this.paymentRepository.findOne({
        where: { 
          bookingId, 
          paymentIntentId: Not(IsNull()),
          status: 'pending'
        },
      });

      // If there's a pending payment, retrieve and return the existing payment intent
      if (existingPendingPayment?.paymentIntentId) {
        this.logger.info('Reusing existing payment intent', {
          bookingId,
          paymentIntentId: existingPendingPayment.paymentIntentId,
        });

        try {
          const existingPaymentIntent = await this.stripe.paymentIntents.retrieve(
            existingPendingPayment.paymentIntentId
          );

          // Only reuse if the payment intent is still usable
          if (existingPaymentIntent.status === 'requires_payment_method' || 
              existingPaymentIntent.status === 'requires_confirmation') {
            return {
              id: existingPaymentIntent.id,
              clientSecret: existingPaymentIntent.client_secret!,
              status: existingPaymentIntent.status,
              amount: existingPendingPayment.amount,
              currency: 'brl',
            };
          }
        } catch (error) {
          // If retrieval fails, continue to create a new payment intent
          this.logger.warn('Failed to retrieve existing payment intent, creating new one', {
            bookingId,
            error: error.message,
          });
        }
      }

      // Requirement 4.1, 4.2: Validate totalAmount > 0
      if (bookingDto.totalAmount <= 0) {
        this.logger.error('Invalid booking amount', new Error('Amount must be positive'), {
          bookingId,
          totalAmount: bookingDto.totalAmount,
        });
        throw new BadRequestException('Invalid booking amount');
      }

      // Requirement 4.3, 4.4: Validate passengers exist
      if (!bookingDto.passengers || bookingDto.passengers.length === 0) {
        this.logger.error('No passengers in booking', new Error('Passengers required'), {
          bookingId,
        });
        throw new BadRequestException('No passengers in booking');
      }

      // Requirement 1.1, 1.5: Use booking.totalAmount as authoritative source
      const amount = bookingDto.totalAmount;

      // Requirement 4.5: Convert to cents (smallest currency unit)
      const amountInCents = Math.round(amount * 100);

      // Requirement 6.3: Create Stripe Payment Intent with metadata for audit
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'brl',
        metadata: {
          bookingId,
          userId,
          passengerCount: bookingDto.passengers.length,
        },
      });

      // Requirement 3.5: Store payment intent ID in payment entity
      const paymentEntity = this.paymentRepository.create({
        bookingId,
        paymentIntentId: paymentIntent.id,
        amount,
        currency: 'brl',
        status: 'pending',
        provider: 'stripe',
        createdAt: new Date(),
      });

      await this.paymentRepository.save(paymentEntity);

      // Requirement 3.4: Update booking status to AWAITING_PAYMENT (only if currently PENDING)
      if (bookingDto.status === BookingStatus.PENDING) {
        await this.bookingService.update(bookingId, {
          status: BookingStatus.AWAITING_PAYMENT,
        });
      }

      // Requirement 6.1: Log successful payment intent creation
      this.logger.info('Payment intent created', {
        bookingId,
        userId,
        totalAmount: amount,
        passengerCount: bookingDto.passengers.length,
        paymentIntentId: paymentIntent.id,
      });

      // Requirement 5.3: Return client secret and amount for display
      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        status: paymentIntent.status,
        amount,
        currency: 'brl',
      };

    } catch (error) {
      // Requirement 6.2: Log all validation failures
      if (error instanceof NotFoundException || 
          error instanceof ForbiddenException ||
          error instanceof BadRequestException ||
          error instanceof ConflictException) {
        throw error;
      }

      this.logger.error('Failed to create payment intent', error as Error, {
        bookingId,
        userId,
        function: 'createPaymentIntent',
      });
      throw new InternalServerErrorException('Failed to create payment intent');
    }
  }

  /**
   * Recuperar Payment Intent por ID
   */
  async retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(id);
    } catch (error) {
      this.logger.error(`Erro ao recuperar Payment Intent ${id}:`, error);
      throw new BadRequestException('Payment Intent não encontrado');
    }
  }

  /**
   * Processar webhook do Stripe
   */
  async processWebhook(body: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET não configurado');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      this.logger.error('Erro na verificação da assinatura do webhook:', error);
      throw new BadRequestException('Assinatura do webhook inválida');
    }

    this.logger.log(`Processando evento Stripe: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.canceled':
        await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        this.logger.log(`Evento não tratado: ${event.type}`);
    }
  }

  /**
   * Processar pagamento bem-sucedido
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const bookingId = paymentIntent.metadata.bookingId;
    
    this.logger.info('Processing successful payment', {
      paymentIntentId: paymentIntent.id,
      bookingId,
      amount: paymentIntent.amount,
      function: 'handlePaymentSucceeded',
    });

    try {
      if (!bookingId) {
        this.logger.error('BookingId not found in payment intent metadata', undefined, {
          paymentIntentId: paymentIntent.id,
        });
        return;
      }

      // Atualizar status do pagamento
      await this.paymentRepository.update(
        { paymentIntentId: paymentIntent.id },
        { 
          status: 'paid',
          paidAt: new Date(),
        }
      );

      this.logger.debug('Payment status updated to paid', {
        paymentIntentId: paymentIntent.id,
        bookingId,
      });

      // Atualizar status da reserva
      await this.bookingService.update(bookingId, { status: BookingStatus.PAID });

      // Enviar email de confirmação
      const booking = await this.bookingService.findById(bookingId);
      await this.mailService.sendBookingConfirmation(booking);

      this.logger.info('Payment processed successfully', {
        paymentIntentId: paymentIntent.id,
        bookingId,
        amount: paymentIntent.amount,
      });

    } catch (error) {
      this.logger.error('Failed to process successful payment', error as Error, {
        paymentIntentId: paymentIntent.id,
        bookingId,
        function: 'handlePaymentSucceeded',
      });
      throw error;
    }
  }

  /**
   * Processar falha no pagamento
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const bookingId = paymentIntent.metadata.bookingId;
    
    this.logger.warn('Processing failed payment', {
      paymentIntentId: paymentIntent.id,
      bookingId,
      amount: paymentIntent.amount,
      function: 'handlePaymentFailed',
    });

    try {
      if (!bookingId) {
        this.logger.error('BookingId not found in payment intent metadata', undefined, {
          paymentIntentId: paymentIntent.id,
        });
        return;
      }

      // Atualizar status do pagamento
      await this.paymentRepository.update(
        { paymentIntentId: paymentIntent.id },
        { status: 'failed' }
      );

      this.logger.info('Payment marked as failed', {
        paymentIntentId: paymentIntent.id,
        bookingId,
      });

      // Não alteramos o status da reserva automaticamente em caso de falha
      // Deixamos como AWAITING_PAYMENT para nova tentativa

    } catch (error) {
      this.logger.error('Failed to process payment failure', error as Error, {
        paymentIntentId: paymentIntent.id,
        bookingId,
        function: 'handlePaymentFailed',
      });
      throw error;
    }
  }

  /**
   * Processar cancelamento do pagamento
   */
  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const bookingId = paymentIntent.metadata.bookingId;
    
    this.logger.info('Processing payment cancellation', {
      paymentIntentId: paymentIntent.id,
      bookingId,
      amount: paymentIntent.amount,
      function: 'handlePaymentCanceled',
    });

    try {
      if (!bookingId) {
        this.logger.error('BookingId not found in payment intent metadata', undefined, {
          paymentIntentId: paymentIntent.id,
        });
        return;
      }

      // Atualizar status do pagamento
      await this.paymentRepository.update(
        { paymentIntentId: paymentIntent.id },
        { status: 'canceled' }
      );

      // Atualizar status da reserva para cancelada
      await this.bookingService.update(bookingId, { status: BookingStatus.CANCELLED });

      this.logger.info('Payment cancellation processed', {
        paymentIntentId: paymentIntent.id,
        bookingId,
      });

    } catch (error) {
      this.logger.error('Failed to process payment cancellation', error as Error, {
        paymentIntentId: paymentIntent.id,
        bookingId,
        function: 'handlePaymentCanceled',
      });
      throw error;
    }
  }

  /**
   * Registrar um pagamento para uma reserva
   * Método de compatibilidade com PaymentService
   */
  async recordPayment(bookingId: string, paymentData: { paymentId: string; transactionId?: string }): Promise<void> {
    this.logger.info('Recording payment', {
      bookingId,
      paymentId: paymentData.paymentId,
      transactionId: paymentData.transactionId,
      function: 'recordPayment',
    });

    try {
      // Atualizar ou criar registro de pagamento
      const existingPayment = await this.paymentRepository.findOne({
        where: { paymentIntentId: paymentData.paymentId }
      });

      if (existingPayment) {
        // Atualizar pagamento existente
        existingPayment.status = 'completed';
        existingPayment.paidAt = new Date();
        if (paymentData.transactionId) {
          existingPayment.externalReference = paymentData.transactionId;
        }
        await this.paymentRepository.save(existingPayment);
        
        this.logger.debug('Updated existing payment record', {
          bookingId,
          paymentId: paymentData.paymentId,
        });
      } else {
        // Criar novo registro de pagamento se não existir
        const payment = this.paymentRepository.create({
          bookingId: bookingId,
          paymentIntentId: paymentData.paymentId,
          status: 'completed',
          provider: 'stripe',
          paidAt: new Date(),
          externalReference: paymentData.transactionId,
        });
        await this.paymentRepository.save(payment);
        
        this.logger.debug('Created new payment record', {
          bookingId,
          paymentId: paymentData.paymentId,
        });
      }

      this.logger.info('Payment recorded successfully', {
        bookingId,
        paymentId: paymentData.paymentId,
      });

    } catch (error) {
      this.logger.error('Failed to record payment', error as Error, {
        bookingId,
        paymentId: paymentData.paymentId,
        function: 'recordPayment',
      });
      throw error;
    }
  }
}