import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatbotService } from './chatbot.service';
import { ChatbotGateway } from './chatbot.gateway';
import { ChatSessionRepository } from './repositories/chat-session.repository';
import { SocketAuthRepository } from './repositories/socket-auth.repository';

/**
 * Módulo responsável pelo sistema de chat inteligente com AWS Bedrock
 * 
 * Funcionalidades:
 * - Chat em tempo real via WebSockets
 * - Integração com AWS Bedrock para IA conversacional
 * - Entrevista estruturada para coleta de perfil do usuário
 * - Autenticação JWT integrada
 */
@Module({
  imports: [ConfigModule],
  providers: [ChatbotService, ChatbotGateway, ChatSessionRepository, SocketAuthRepository],
  exports: [ChatbotService], // Permite uso em outros módulos
})
export class ChatbotModule {}
