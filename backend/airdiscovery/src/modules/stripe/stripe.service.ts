import { Injectable, Inject, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BookingService } from '../bookings/booking.service';
import { Payment as PaymentEntity } from '../bookings/entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
   */
  async createPaymentIntent(
    createPaymentIntentDto: CreatePaymentIntentDto
  ): Promise<PaymentIntentResponse> {
    const startTime = Date.now();

    this.logger.info('Creating payment intent', {
      bookingId: createPaymentIntentDto.bookingId,
      amount: createPaymentIntentDto.amount,
      currency: createPaymentIntentDto.currency || 'brl',
      function: 'createPaymentIntent',
    });

    try {
      // Buscar dados da reserva
      const booking = await this.bookingService.findById(createPaymentIntentDto.bookingId);

      // Validar se a reserva pode receber pagamento
      if (booking.status !== BookingStatus.AWAITING_PAYMENT && booking.status !== BookingStatus.PENDING) {
        throw new BadRequestException(
          `Reserva não pode receber pagamento. Status atual: ${booking.status}`
        );
      }

      const passenger = booking.passengers[0]; // Usar o primeiro passageiro como pagador

      // Criar Payment Intent no Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: createPaymentIntentDto.amount, // Valor em centavos
        currency: createPaymentIntentDto.currency || 'brl',
        description: createPaymentIntentDto.description || `Passagem aérea - ${passenger.firstName} ${passenger.lastName}`,
        metadata: {
          bookingId: createPaymentIntentDto.bookingId,
          flightId: booking.flightId,
          passengerName: `${passenger.firstName} ${passenger.lastName}`,
          passengerEmail: passenger.email,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      const responseTime = Date.now() - startTime;

      this.logger.info('Stripe payment intent created', {
        paymentIntentId: paymentIntent.id,
        bookingId: createPaymentIntentDto.bookingId,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
        responseTime,
      });

      // Salvar referência do Payment Intent no banco
      const paymentEntity = this.paymentRepository.create({
        bookingId: createPaymentIntentDto.bookingId,
        paymentIntentId: paymentIntent.id,
        amount: createPaymentIntentDto.amount / 100, // Converter de centavos para reais
        currency: createPaymentIntentDto.currency || 'brl',
        status: 'pending',
        provider: 'stripe',
        createdAt: new Date(),
      });

      await this.paymentRepository.save(paymentEntity);

      this.logger.debug('Payment entity saved to database', {
        paymentIntentId: paymentIntent.id,
        bookingId: createPaymentIntentDto.bookingId,
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Failed to create payment intent', error as Error, {
        bookingId: createPaymentIntentDto.bookingId,
        amount: createPaymentIntentDto.amount,
        responseTime,
        function: 'createPaymentIntent',
      });
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro interno do servidor ao criar Payment Intent');
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