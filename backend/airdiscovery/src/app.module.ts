import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlightsModule } from './modules/flights/flights.module';
import { AuthModule } from './modules/auth/auth.module';
import { DestinationsModule } from './modules/destinations/destinations.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { BookingModule } from './modules/bookings/booking.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { MailModule } from './modules/mail/mail.module';
import { AuthMiddleware } from './common/middlewares/auth.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRootAsync({
       imports: [ConfigModule],
       useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity.js'],
        synchronize: true, // Enable synchronize temporarily to create tables
        ssl: {
          rejectUnauthorized: false,
        },
        logging: ['query', 'error'],
       }),
       inject: [ConfigService]
    }),
    FlightsModule,
    AuthModule,
    DestinationsModule,
    ChatbotModule,
    BookingModule,
    StripeModule,
    MailModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        'health',
        'auth/public/*path',
        '*path/health',
        'docs/*path',
        // Add any other public routes here
      )
      .forRoutes('*'); // Apply to all routes except excluded ones
  }
}
