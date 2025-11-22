import {
  Controller,
  Get,
  Param,
  HttpStatus,
  HttpException,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ChatSessionRepository } from './repositories/chat-session.repository';
import { ChatbotService } from './chatbot.service';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import { AuthenticatedRequest } from '../../common/middlewares/auth.middleware';
import {
  SessionSummaryDto,
  SessionDetailDto,
  SessionListResponseDto,
  SessionDetailResponseDto,
} from './dto/session-history.dto';

/**
 * SessionsController - Controlador REST para histórico de conversas
 * 
 * Endpoints:
 * - GET /api/sessions/:userId - Listar sessões de um usuário
 * - GET /api/sessions/detail/:sessionId - Detalhes de uma sessão específica
 * 
 * Todos os endpoints exigem autenticação via JWT
 * Valida que usuário só pode acessar suas próprias sessões
 */
@Controller('sessions')
export class SessionsController {
  private readonly logger = new Logger(SessionsController.name);

  constructor(
    private readonly chatSessionRepository: ChatSessionRepository,
    private readonly chatbotService: ChatbotService,
  ) {}

  /**
   * Lista todas as sessões de chat de um usuário
   * GET /api/sessions/:userId
   * 
   * @param userId - ID do usuário (Cognito sub)
   * @param user - Usuário autenticado (extraído do JWT)
   * @returns Lista de sessões com resumo
   */
  @Get(':userId')
  async getUserSessions(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedRequest['user'],
  ): Promise<SessionListResponseDto> {
    try {
      // Validação de segurança: usuário só pode acessar suas próprias sessões
      if (user?.sub !== userId) {
        this.logger.warn(
          `User ${user?.sub} attempted to access sessions of ${userId}`,
        );
        throw new ForbiddenException(
          'You can only access your own chat sessions',
        );
      }

      this.logger.log(`Fetching sessions for user: ${userId}`);

      // Busca todas as sessões do usuário
      const sessions = await this.chatSessionRepository.getAllUserSessions(userId);

      // Mapeia para DTOs com resumo
      const sessionSummaries: SessionSummaryDto[] = sessions.map((session) => {
        // Pega primeira mensagem do usuário como resumo
        const firstUserMessage = session.messages.find(
          (msg) => msg.role === 'user',
        );
        const summary = firstUserMessage
          ? firstUserMessage.content.substring(0, 100)
          : 'Nova conversa';

        return {
          sessionId: session.sessionId,
          userId: session.userId,
          startTime: session.createdAt,
          lastUpdated: session.updatedAt,
          summary,
          messageCount: session.messages.length,
          recommendedDestination: session.recommendedDestination,
        };
      });

      this.logger.log(`Found ${sessionSummaries.length} sessions for user ${userId}`);

      return {
        sessions: sessionSummaries,
        total: sessionSummaries.length,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error fetching sessions for user ${userId}:`, error);
      throw new HttpException(
        'Failed to fetch chat sessions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retorna detalhes completos de uma sessão específica
   * GET /api/sessions/detail/:sessionId
   * 
   * @param sessionId - ID da sessão
   * @param user - Usuário autenticado (extraído do JWT)
   * @returns Sessão completa com todas as mensagens
   */
  @Get('detail/:sessionId')
  async getSessionDetail(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthenticatedRequest['user'],
  ): Promise<SessionDetailResponseDto> {
    try {
      this.logger.log(`Fetching session details for: ${sessionId}`);

      // Busca a sessão
      const session = await this.chatSessionRepository.getSession(sessionId);

      if (!session) {
        throw new NotFoundException(`Session ${sessionId} not found`);
      }

      // Validação de segurança: usuário só pode acessar suas próprias sessões
      if (user?.sub !== session.userId) {
        this.logger.warn(
          `User ${user?.sub} attempted to access session ${sessionId} owned by ${session.userId}`,
        );
        throw new ForbiddenException(
          'You can only access your own chat sessions',
        );
      }

      // Mapeia para DTO com detalhes completos
      const sessionDetail: SessionDetailDto = {
        sessionId: session.sessionId,
        userId: session.userId,
        messages: session.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
        profileData: session.profileData,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        interviewComplete: session.interviewComplete,
        recommendedDestination: session.recommendedDestination,
      };

      this.logger.log(`Successfully fetched details for session ${sessionId}`);

      return {
        session: sessionDetail,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Error fetching session ${sessionId}:`, error);
      throw new HttpException(
        'Failed to fetch session details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retorna dados coletados (collectedData) de uma sessão JSON
   * GET /api/sessions/collected-data/:sessionId
   * 
   * @param sessionId - ID da sessão
   * @param user - Usuário autenticado (extraído do JWT)
   * @returns Dados coletados da sessão incluindo passenger_composition
   */
  @Get('collected-data/:sessionId')
  async getCollectedData(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthenticatedRequest['user'],
  ) {
    try {
      this.logger.log(`Fetching collected data for session: ${sessionId}`);

      // Busca a sessão JSON usando o chatbot service
      const jsonSession = await this.chatbotService.getChatSession(sessionId);

      if (!jsonSession) {
        throw new NotFoundException(`Session ${sessionId} not found`);
      }

      // Validação de segurança: usuário só pode acessar suas próprias sessões
      if (user?.sub !== jsonSession.userId) {
        this.logger.warn(
          `User ${user?.sub} attempted to access session ${sessionId} owned by ${jsonSession.userId}`,
        );
        throw new ForbiddenException(
          'You can only access your own chat sessions',
        );
      }

      this.logger.log(`Successfully fetched collected data for session ${sessionId}`);

      return {
        sessionId: jsonSession.sessionId,
        collectedData: jsonSession.collectedData,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Error fetching collected data for session ${sessionId}:`, error);
      throw new HttpException(
        'Failed to fetch collected data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
