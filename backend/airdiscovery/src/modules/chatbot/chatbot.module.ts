import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatbotService } from './chatbot.service';
import { ChatbotGateway } from './chatbot.gateway'; // Agora é o gateway JSON
import { ChatSessionRepository } from './repositories/chat-session.repository';
import { SocketAuthRepository } from './repositories/socket-auth.repository';
import { RedisConfigService } from './services/redis-config.service';

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
 */
@Module({
  imports: [ConfigModule],
  providers: [
    ChatbotService, 
    ChatbotGateway, // Gateway único que utiliza JsonChatbotService
    ChatSessionRepository, 
    SocketAuthRepository, 
    RedisConfigService
  ],
  exports: [ChatbotService], // Permite uso em outros módulos
})
export class ChatbotModule {}
