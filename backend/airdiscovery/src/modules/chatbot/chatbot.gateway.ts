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
import { JsonStreamChunk } from './interfaces/json-response.interface';
import { AuthenticatedRequest } from '../../common/middlewares/auth.middleware';
import { jwtVerify, createRemoteJWKSet, decodeJwt } from 'jose';
import { ConfigService } from '@nestjs/config';
import { SocketAuthRepository } from './repositories/socket-auth.repository';

/**
 * WebSocket Gateway para chat em tempo real com JSON estruturado
 * 
 * Esta implementação utiliza o chatbotService para trabalhar
 * com respostas JSON estruturadas do LLM, eliminando a necessidade
 * de parsing manual de strings.
 * 
 * Funcionalidades:
 * - Autenticação via JWT token
 * - Streaming de resposta com dados JSON estruturados
 * - Gerenciamento de sessões de chat com estado estruturado
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
    this.logger.log('Chat WebSocket Gateway initialized with JSON support');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      this.logger.log(`New JSON chat client connected: ${client.id}`);

      // Permite conexão inicial sem autenticação
      // A autenticação ocorrerá no evento startChat
      client.emit('connected', {
        message: 'Connected to JSON chat server. Please authenticate to start chatting.',
        socketId: client.id,
        type: 'json-chat'
      });

    } catch (error) {
      this.logger.error(`Error during connection for JSON chat client ${client.id}:`, error.message);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      this.logger.log(`JSON chat client disconnecting: ${client.id}`);

      const socketData = await this.socketAuthRepository.getSocketAuth(client.id);
      if (socketData?.sessionId) {
        // Não deleta a sessão, apenas registra a desconexão
        // A sessão permanece disponível por 30 dias para recuperação
        this.logger.log(`Preserving JSON chat session for reconnection: ${socketData.sessionId}`);
      }

      await this.socketAuthRepository.removeSocketAuth(client.id);
      this.logger.log(`JSON chat client disconnected and cleaned up: ${client.id}`);
    } catch (error) {
      this.logger.error(`Error during JSON chat client disconnect ${client.id}:`, error);
      // Ainda tenta limpar
      await this.socketAuthRepository.removeSocketAuth(client.id);
    }
  }

  /**
   * Inicia uma nova sessão de chat com autenticação
   */
  @SubscribeMessage('startChat')
  async handleStartChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: StartChatDto,
  ) {
    try {
      this.logger.log(`Start JSON chat request from client: ${client.id}`);

      // Autenticação do cliente
      let socketData = await this.socketAuthRepository.getSocketAuth(client.id);

      if (!socketData) {
        // Cliente não autenticado - autentica agora
        const token = this.extractTokenFromSocket(client);
        if (!token) {
          this.logger.warn(`Authentication failed: No token provided for ${client.id}`);
          client.emit('error', { message: 'Authentication token required' });
          return;
        }

        // Verificação de token para desenvolvimento e produção
        let payload;
        if (this.configService.get('NODE_ENV') === 'development') {
          try {
            payload = await this.verifyToken(token);
          } catch (error) {
            this.logger.warn(`JWT verification failed in development mode, using fallback: ${error.message}`);
            try {
              payload = decodeJwt(token);
              this.logger.debug('Using decoded token without verification for development');
            } catch (decodeError) {
              this.logger.error(`Token decode failed: ${decodeError.message}`);
              client.emit('error', { message: 'Invalid token format' });
              return;
            }
          }
        } else {
          payload = await this.verifyToken(token);
        }

        const userId = payload.sub as string;

        // Armazena autenticação no repositório de socket
        await this.socketAuthRepository.setSocketAuth(client.id, { userId });
        socketData = await this.socketAuthRepository.getSocketAuth(client.id);

        this.logger.log(`JSON chat client authenticated successfully: ${client.id} (User: ${userId})`);
      }

      if (!socketData) {
        throw new UnauthorizedException('Authentication failed');
      }

      console.log({ socketData, handleStartJsonChatData: data });

      // Inicia sessão JSON
      const sessionId = await this.chatbotService.startChatSession(
        socketData.userId,
        data.sessionId,
      );

      // Atualiza sessionId no storage
      await this.socketAuthRepository.updateSocketSession(client.id, sessionId);

      // Obtém mensagem inicial estruturada
      const initialMessage = await this.chatbotService.getInitialMessage(sessionId);

      // Envia resposta inicial com dados JSON estruturados
      client.emit('chatResponse', initialMessage);

      this.logger.log(`JSON chat session started: ${sessionId} for user ${socketData.userId}`);

    } catch (error) {
      this.logger.error(`Error starting JSON chat:`, error);
      client.emit('error', { message: `Failed to start JSON chat session: ${error.message}` });
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
        throw new UnauthorizedException('No active JSON chat session');
      }

      this.logger.log(`Processing JSON message from user ${socketData.userId}: ${message.content}`);

      // Processa mensagem com resposta completa (sem streaming de chunks)
      await this.chatbotService.processMessage(
        socketData.sessionId,
        {
          ...message,
          role: MessageRole.USER,
        },
        (response: JsonStreamChunk) => {
          // Envia resposta completa ou indicador de loading
          client.emit('chatResponse', response);
        },
      );

    } catch (error) {
      this.logger.error(`Error processing JSON message:`, error);
      client.emit('error', { message: 'Failed to process JSON message' });
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
        client.emit('error', { message: 'No active JSON chat session' });
        return;
      }

      const profile = await this.chatbotService.endChatSession(socketData.sessionId);

      // Remove sessionId dos dados do socket no Redis
      await this.socketAuthRepository.removeSocketSession(client.id);

      client.emit('chatEnded', {
        message: 'Chat session ended',
        profile: profile,
      });

      this.logger.log(`JSON chat session ended: ${socketData.sessionId}`);

    } catch (error) {
      this.logger.error(`Error ending JSON chat:`, error);
      client.emit('error', { message: 'Failed to end JSON chat session' });
    }
  }

  @SubscribeMessage('sessionInfo')
  async handleSessionInfo(@ConnectedSocket() client: Socket) {
    try {
      const socketData = await this.socketAuthRepository.getSocketAuth(client.id);
      if (!socketData?.sessionId) {
        client.emit('sessionInfo', { hasActiveSession: false });
        return;
      }

      const session = await this.chatbotService.getChatSession(socketData.sessionId);
      if (!session) {
        client.emit('sessionInfo', { hasActiveSession: false });
        return;
      }

      client.emit('sessionInfo', {
        hasActiveSession: true,
        sessionId: session.sessionId,
        currentStage: session.currentStage,
        collectedData: session.collectedData,
        isComplete: session.isComplete,
        hasRecommendation: session.hasRecommendation,
        messageCount: session.messages.length,
      });
    } catch (error) {
      this.logger.error(`Error getting session info:`, error);
      client.emit('error', { message: 'Failed to get session info' });
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
        currentStage: session?.currentStage || null,
        isComplete: session?.isComplete || false,
        hasRecommendation: session?.hasRecommendation || false,
        messageCount: session?.messages.length || 0,
        collectedData: session?.collectedData || null,
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
    const authHeader = client.handshake.auth.token;
    console.log('Auth Header:', authHeader);
    console.log('Handshake Query:', client.handshake);

    if (authHeader && typeof authHeader === 'string') {
      return authHeader;
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
      let decodedPayload;
      try {
        decodedPayload = decodeJwt(token);
        this.logger.debug(`Token decoded successfully. Token use: ${decodedPayload.token_use}, Has aud: ${!!decodedPayload.aud}, Has client_id: ${!!decodedPayload.client_id}`);
      } catch (error) {
        this.logger.error(`Failed to decode token: ${error.message}`);
        throw new UnauthorizedException('Invalid JWT token format');
      }

      // Determina opções de verificação baseado no tipo de token
      const verificationOptions: any = {
        issuer: `https://cognito-idp.${this.configService.get('AWS_REGION')}.amazonaws.com/${this.configService.get('USER_POOL_ID')}`,
      };

      // Valida audience apenas se o token tem claim 'aud' (tipicamente ID tokens)
      // Access tokens geralmente têm 'client_id' ao invés de 'aud'
      if (decodedPayload.aud && this.configService.get('USER_POOL_CLIENT_ID')) {
        verificationOptions.audience = this.configService.get('USER_POOL_CLIENT_ID');
      }

      this.logger.debug(`Attempting JWT verification with issuer: ${verificationOptions.issuer}`);
      this.logger.debug(`Audience validation: ${verificationOptions.audience ? 'enabled' : 'disabled'}`);

      // Executa verificação JWT única com opções apropriadas
      const { payload } = await jwtVerify(token, this.jwks, verificationOptions);

      this.logger.debug(`JWT verification successful for user: ${payload.sub}`);
      return payload;
    } catch (error) {
      this.logger.error(`JWT verification error details:`, {
        message: error.message,
        stack: error.stack,
        region: this.configService.get('AWS_REGION'),
        userPoolId: this.configService.get('USER_POOL_ID'),
        jwksUrl: `https://cognito-idp.${this.configService.get('AWS_REGION')}.amazonaws.com/${this.configService.get('USER_POOL_ID')}/.well-known/jwks.json`
      });

      // Fornece mensagens de erro mais específicas
      if (error.message.includes('Expected 200 OK')) {
        throw new UnauthorizedException('Unable to fetch JWT keys from AWS Cognito. Please check network connectivity and configuration.');
      } else if (error.message.includes('Invalid Compact JWS')) {
        throw new UnauthorizedException('Invalid JWT token format - malformed token');
      } else if (error.message.includes('signature verification failed')) {
        throw new UnauthorizedException('Token signature verification failed');
      } else if (error.message.includes('expired')) {
        throw new UnauthorizedException('Token has expired');
      } else if (error.message.includes('audience')) {
        throw new UnauthorizedException('Token audience mismatch');
      } else if (error.message.includes('issuer')) {
        throw new UnauthorizedException('Token issuer mismatch');
      }

      throw new UnauthorizedException(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Obtém estatísticas do gateway JSON (para monitoramento)
   */
  async getConnectedClientsCount(): Promise<number> {
    return await this.socketAuthRepository.getConnectedSocketsCount();
  }

  /**
   * Obtém número de sessões JSON ativas
   */
  async getActiveSessionsCount(): Promise<number> {
    const stats = await this.chatbotService.getSessionStats();
    return stats.active;
  }
}