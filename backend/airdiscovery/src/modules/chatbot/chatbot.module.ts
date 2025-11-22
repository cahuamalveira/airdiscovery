import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatbotService } from './chatbot.service';
import { ChatbotGateway } from './chatbot.gateway'; // Agora é o gateway JSON
import { SessionsController } from './sessions.controller';
import { ChatSessionRepository } from './repositories/chat-session.repository';
import { SocketAuthRepository } from './repositories/socket-auth.repository';
import { RedisConfigService } from './services/redis-config.service';
import { JsonResponseParser } from './utils/json-response-parser';
import { LoggerModule } from '../logger/logger.module';

/**
 * Módulo responsável pelo sistema de chat inteligente com AWS Bedrock
 * 
 * Funcionalidades:
 * - Chat em tempo real via WebSockets com respostas JSON estruturadas
 * - Integração com AWS Bedrock para IA conversacional
 * - Entrevista estruturada para coleta de perfil do usuário
 * - Autenticação JWT integrada
 * - Suporte a respostas JSON estruturadas (nova arquitetura)
 * - Mantém compatibilidade com endpoints WebSocket existentes
 * - API REST para histórico de conversas
 */
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [
    ChatbotService, 
    ChatbotGateway, // Gateway único que utiliza JsonChatbotService
    ChatSessionRepository, 
    SocketAuthRepository, 
    RedisConfigService,
    JsonResponseParser
  ],
  controllers: [SessionsController], // Controller REST para histórico
  exports: [ChatbotService], // Permite uso em outros módulos
})
export class ChatbotModule {}
