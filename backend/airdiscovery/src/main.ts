import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { LoggerService } from './modules/logger/logger.service';

async function bootstrap() {
  // Create NestJS app with custom logger disabled initially
  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable default NestJS logger
  });

  // Get custom logger from DI container and set it as the app logger
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Configurar ValidationPipe global para DTOs
  app.useGlobalPipes(new ValidationPipe({
    // Automaticamente transforma payloads em instâncias de DTO
    transform: true,
    // Remove propriedades que não estão no DTO
    whitelist: true,
    // Lança erro se propriedades não permitidas forem enviadas
    forbidNonWhitelisted: false,
    // Permite validação de objetos aninhados
    transformOptions: {
      enableImplicitConversion: true,
    },
    // Detalha erros de validação
    disableErrorMessages: false,
    // Valida mesmo se o valor for undefined (útil para propriedades opcionais)
    skipMissingProperties: false,
  }));

  // Configurar CORS para permitir requisições do frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173', // Vite dev server
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    credentials: true
  });

  // Adicionar prefixo global para APIs
  // app.setGlobalPrefix('api');
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  
  // Log application startup
  logger.info('Application started successfully', {
    port,
    environment: process.env.NODE_ENV || 'development',
  });
}
bootstrap();
