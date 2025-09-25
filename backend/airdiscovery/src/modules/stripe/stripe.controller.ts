import { Controller, Post, Get, Body, Param, HttpStatus } from '@nestjs/common';
import { StripeService, PaymentIntentResponse } from './stripe.service';
import { CreatePaymentIntentDto } from './dto/stripe.dto';

/**
 * StripeController - Controller REST para operações de pagamento Stripe
 * 
 * Endpoints:
 * - POST /payments/stripe/create-intent - Criar Payment Intent
 * - GET /payments/stripe/status/:intentId - Verificar status do Payment Intent
 * 
 * Integra com o Stripe para processar pagamentos
 */
@Controller('payments/stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  /**
   * Criar Payment Intent
   * POST /api/payments/stripe/create-intent
   */
  @Post('create-intent')
  async createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: PaymentIntentResponse;
  }> {
    const paymentIntent = await this.stripeService.createPaymentIntent(createPaymentIntentDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Payment Intent criado com sucesso',
      data: paymentIntent,
    };
  }

  /**
   * Verificar status do Payment Intent
   * GET /api/payments/stripe/status/:intentId
   */
  @Get('status/:intentId')
  async getPaymentIntentStatus(
    @Param('intentId') intentId: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: any;
  }> {
    const paymentIntent = await this.stripeService.retrievePaymentIntent(intentId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Status do Payment Intent obtido com sucesso',
      data: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        created: paymentIntent.created,
      },
    };
  }
}