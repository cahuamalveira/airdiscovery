import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Temporariamente removendo webhook do Stripe para debug
  // TODO: Re-adicionar após resolver o problema do body parsing

  // Debug middleware para logar requests (agora depois do JSON parsing)
  app.use('/flights/from-offer', (req: any, res: any, next: any) => {
    console.log('=== DEBUG REQUEST ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers Content-Type:', req.headers['content-type']);
    console.log('Body:', req.body);
    console.log('Body type:', typeof req.body);
    console.log('Body keys:', Object.keys(req.body || {}));
    console.log('Raw body length:', req.rawBody ? req.rawBody.length : 'N/A');
    console.log('===================');
    next();
  });

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
  
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
