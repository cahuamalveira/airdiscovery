import * as common from '@nestjs/common';
import type { Request, Response } from 'express';
import { StripeService } from './stripe.service';
import { Logger } from '@nestjs/common';

/**
 * StripeWebhookController - Controller para webhooks do Stripe
 * 
 * Endpoints:
 * - POST /webhooks/stripe - Recebe eventos do Stripe
 * 
 * Processa eventos de pagamento e atualiza status das reservas
 */
@common.Controller('webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private readonly stripeService: StripeService) {}

  /**
   * Webhook do Stripe
   * POST /api/webhooks/stripe
   */
  @common.Post('stripe')
  async handleStripeWebhook(
    @common.Req() req: common.RawBodyRequest<Request>,
    @common.Res() res: Response,
    @common.Headers('stripe-signature') signature: string,
  ): Promise<void> {
    try {
      if (!signature) {
        this.logger.error('Assinatura Stripe ausente no header');
        res.status(common.HttpStatus.BAD_REQUEST).send('Assinatura ausente');
        return;
      }

      if (!req.rawBody) {
        this.logger.error('Corpo da requisição ausente');
        res.status(common.HttpStatus.BAD_REQUEST).send('Corpo da requisição ausente');
        return;
      }

      await this.stripeService.processWebhook(req.rawBody, signature);
      
      res.status(common.HttpStatus.OK).json({ received: true });

    } catch (error) {
      this.logger.error('Erro no processamento do webhook:', error);
      res.status(common.HttpStatus.BAD_REQUEST).send(`Webhook Error: ${error.message}`);
    }
  }
}