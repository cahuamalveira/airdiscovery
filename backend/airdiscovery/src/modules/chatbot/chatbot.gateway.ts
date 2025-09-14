import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatMessageDto, StartChatDto, MessageRole } from './dto/chat-message.dto';
import { StreamChunk } from './interfaces/chat.interface';
import { AuthenticatedRequest } from '../../common/middlewares/auth.middleware';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { ConfigService } from '@nestjs/config';
import { SocketAuthRepository } from './repositories/socket-auth.repository';

/**
 * WebSocket Gateway para chat em tempo real com AWS Bedrock
 * 
 * Funcionalidades:
 * - Autenticação via JWT token
 * - Streaming de resposta em tempo real
 * - Gerenciamento de sessões de chat
 * - Namespace isolado para chat (/chat)
 */
@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
})
export class ChatbotGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatbotGateway.name);
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly configService: ConfigService,
    private readonly socketAuthRepository: SocketAuthRepository,
  ) {
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const userPoolId = this.configService.get<string>('USER_POOL_ID');
    if (!userPoolId) {
      throw new Error('USER_POOL_ID environment variable is required');
    }
    
    const jwksUri = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
    this.jwks = createRemoteJWKSet(new URL(jwksUri));
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Autentica o cliente usando o token JWT
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = await this.verifyToken(token);
      const userId = payload.sub as string;
      
      await this.socketAuthRepository.setSocketAuth(client.id, { userId });
      
      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
      
      // Envia confirmação de conexão
      client.emit('connected', {
        message: 'Successfully connected to chat',
        userId: userId,
      });

    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const socketData = await this.socketAuthRepository.getSocketAuth(client.id);
    if (socketData?.sessionId) {
      // Opcionalmente, finalize a sessão de chat
      await this.chatbotService.endChatSession(socketData.sessionId);
    }
    await this.socketAuthRepository.removeSocketAuth(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Inicia uma nova sessão de chat
   */
  @SubscribeMessage('startChat')
  async handleStartChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: StartChatDto,
  ) {
    try {
      const socketData = await this.socketAuthRepository.getSocketAuth(client.id);
      if (!socketData) {
        throw new UnauthorizedException('Not authenticated');
      }

      const sessionId = await this.chatbotService.startChatSession(
        socketData.userId,
        data.sessionId,
      );

      // Atualiza sessionId no Redis
      await this.socketAuthRepository.updateSocketSession(client.id, sessionId);

      // Envia mensagem inicial do assistente
      const initialMessage: StreamChunk = {
        content: 'Olá! Sou seu assistente de viagem da AIR Discovery e estou aqui para te ajudar a encontrar o destino perfeito! 🌍✈️ Para começar, me conta: que tipo de atividades você mais gosta de fazer quando está de férias?',
        isComplete: true,
        sessionId,
        metadata: {
          questionNumber: 1,
          totalQuestions: 8,
          interviewComplete: false,
        },
      };

      client.emit('chatResponse', initialMessage);

      this.logger.log(`Chat session started: ${sessionId} for user ${socketData.userId}`);

    } catch (error) {
      this.logger.error(`Error starting chat:`, error);
      client.emit('error', { message: 'Failed to start chat session' });
    }
  }

  /**
   * Processa mensagem do usuário
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: ChatMessageDto,
  ) {
    try {
      const socketData = await this.socketAuthRepository.getSocketAuth(client.id);
      if (!socketData?.sessionId) {
        throw new UnauthorizedException('No active chat session');
      }

      this.logger.log(`Processing message from user ${socketData.userId}: ${message.content}`);

      // Processa mensagem via streaming
      await this.chatbotService.processMessage(
        socketData.sessionId,
        {
          ...message,
          role: MessageRole.USER,
        },
        (chunk: StreamChunk) => {
          // Envia cada chunk em tempo real
          client.emit('chatResponse', chunk);
        },
      );

    } catch (error) {
      this.logger.error(`Error processing message:`, error);
      client.emit('error', { message: 'Failed to process message' });
    }
  }

  /**
   * Finaliza sessão de chat
   */
  @SubscribeMessage('endChat')
  async handleEndChat(@ConnectedSocket() client: Socket) {
    try {
      const socketData = await this.socketAuthRepository.getSocketAuth(client.id);
      if (!socketData?.sessionId) {
        client.emit('error', { message: 'No active chat session' });
        return;
      }

      const profile = await this.chatbotService.endChatSession(socketData.sessionId);

      // Remove sessionId dos dados do socket no Redis
      await this.socketAuthRepository.removeSocketSession(client.id);

      client.emit('chatEnded', { 
        message: 'Chat session ended',
        profile: profile,
      });

      this.logger.log(`Chat session ended: ${socketData.sessionId}`);

    } catch (error) {
      this.logger.error(`Error ending chat:`, error);
      client.emit('error', { message: 'Failed to end chat session' });
    }
  }

  /**
   * Obtém status da sessão atual
   */
  @SubscribeMessage('getSessionStatus')
  async handleGetSessionStatus(@ConnectedSocket() client: Socket) {
    try {
      const socketData = await this.socketAuthRepository.getSocketAuth(client.id);
      if (!socketData) {
        throw new UnauthorizedException('Not authenticated');
      }

      if (!socketData.sessionId) {
        client.emit('sessionStatus', { hasActiveSession: false });
        return;
      }

      const session = await this.chatbotService.getChatSession(socketData.sessionId);
      client.emit('sessionStatus', {
        hasActiveSession: !!session,
        sessionId: socketData.sessionId,
        interviewComplete: session?.interviewComplete || false,
        messageCount: session?.messages.length || 0,
      });

    } catch (error) {
      this.logger.error(`Error getting session status:`, error);
      client.emit('error', { message: 'Failed to get session status' });
    }
  }

  /**
   * Extrai token JWT do socket
   */
  private extractTokenFromSocket(client: Socket): string | null {
    // Tenta extrair do header Authorization
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Tenta extrair dos query parameters
    const token = client.handshake.query.token;
    if (token && typeof token === 'string') {
      return token;
    }

    return null;
  }

  /**
   * Verifica token JWT usando AWS Cognito JWKS
   */
  private async verifyToken(token: string): Promise<any> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: `https://cognito-idp.${this.configService.get('AWS_REGION')}.amazonaws.com/${this.configService.get('USER_POOL_ID')}`,
        audience: this.configService.get('USER_POOL_CLIENT_ID'),
      });

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Obtém estatísticas do gateway (para monitoramento)
   */
  async getConnectedClientsCount(): Promise<number> {
    return await this.socketAuthRepository.getConnectedSocketsCount();
  }

  /**
   * Obtém número de sessões ativas
   */
  getActiveSessionsCount(): Promise<number> {
    return this.chatbotService.getActiveSessionsCount();
  }
}
