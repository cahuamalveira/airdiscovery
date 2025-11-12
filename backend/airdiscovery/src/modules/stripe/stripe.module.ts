import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeController } from './stripe.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../bookings/entities/payment.entity';
import { BookingModule } from '../bookings/booking.module';
import { MailModule } from '../mail/mail.module';
import { BookingService } from '../bookings/booking.service';

/**
 * StripeModule - Módulo para integração com Stripe
 * 
 * Fornece:
 * - Cliente Stripe configurado
 * - Serviço para operações de pagamento
 * - Controller para webhooks
 * - Integração com BookingModule
 */
@Module({
    imports: [
        BookingModule,
        TypeOrmModule.forFeature([Payment]),
        MailModule,
    ],
    providers: [
        {
            provide: Stripe,
            useFactory: (configService: ConfigService) => {
                const secretKey = configService.get<string>('STRIPE_SECRET_KEY');
                if (!secretKey) {
                    throw new Error('STRIPE_SECRET_KEY não configurado');
                }
                return new Stripe(secretKey, {
                    apiVersion: '2025-08-27.basil',
                    typescript: true,
                });
            },
            inject: [ConfigService],
        },
        StripeService,
    ],
    controllers: [StripeWebhookController, StripeController],
    exports: [StripeService],
})
export class StripeModule {}