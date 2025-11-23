import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Request,
  HttpStatus,
  HttpException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto } from './dto/stripe.dto';

/**
 * StripeController - Controller REST para operações de pagamento Stripe
 * 
 * Endpoints:
 * - POST /payments/stripe/create-intent - Criar Payment Intent
 * - GET /payments/stripe/status/:intentId - Verificar status do Payment Intent
 * 
 * Integra com o Stripe para processar pagamentos
 * 
 * SECURITY MODEL:
 * - Payment amounts are NEVER accepted from the client
 * - All amounts are calculated server-side from booking data
 * - User authentication is required via JWT token
 * - Booking ownership is validated before payment creation
 */
@Controller('payments/stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  /**
   * Criar Payment Intent
   * POST /api/payments/stripe/create-intent
   * 
   * Creates a Stripe Payment Intent for a booking. The payment amount is calculated
   * server-side from the booking entity to prevent price manipulation.
   * 
   * @param createPaymentIntentDto - Contains only the bookingId (no amount)
   * @param req - Express request object containing authenticated user from JWT
   * @returns Payment Intent with clientSecret and calculated amount
   * 
   * @throws {NotFoundException} 404 - Booking not found or user doesn't own the booking
   * @throws {ForbiddenException} 403 - User is not authorized to create payment for this booking
   * @throws {BadRequestException} 400 - Booking status is not PENDING, invalid amount, or no passengers
   * @throws {ConflictException} 409 - Payment Intent already exists for this booking
   * 
   * Requirements: 2.2, 2.3, 5.1, 5.2, 5.3
   */
  @Post('create-intent')
  async createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
    @Request() req: any,
  ): Promise<{
    statusCode: number;
    message: string;
    data: {
      id: string;
      clientSecret: string;
      status: string;
      amount: number;
      currency: string;
    };
  }> {
    try {
      // Extract userId from JWT token (Requirement 2.2)
      const userId = req.user?.sub || req.user?.id;
      
      if (!userId) {
        throw new ForbiddenException('User authentication required');
      }

      // Pass bookingId and userId to service (Requirement 5.1, 5.2)
      const paymentIntent = await this.stripeService.createPaymentIntent(
        createPaymentIntentDto.bookingId,
        userId,
      );

      // Return response with clientSecret and calculated amount (Requirement 5.3)
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Payment Intent criado com sucesso',
        data: paymentIntent,
      };
    } catch (error) {
      // Proper error handling for all validation exceptions (Requirement 2.3)
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      
      // Re-throw any other HttpException as-is
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Wrap unexpected errors
      throw new BadRequestException(
        error?.message || 'Failed to create payment intent',
      );
    }
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