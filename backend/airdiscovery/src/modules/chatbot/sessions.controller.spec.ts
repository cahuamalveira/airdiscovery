import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { ChatSessionRepository } from './repositories/chat-session.repository';
import { ChatSession } from './interfaces/chat.interface';

describe('SessionsController', () => {
  let controller: SessionsController;
  let repository: jest.Mocked<ChatSessionRepository>;

  const mockUser = {
    sub: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockSession: ChatSession = {
    sessionId: 'session-456',
    userId: 'user-123',
    messages: [
      {
        role: 'user',
        content: 'Olá, quero viajar para a praia',
        timestamp: new Date('2025-11-10T10:00:00Z'),
      },
      {
        role: 'assistant',
        content: 'Ótimo! Vou te ajudar',
        timestamp: new Date('2025-11-10T10:00:05Z'),
      },
    ],
    profileData: {
      origin: 'São Paulo',
      activities: ['praia', 'mergulho'],
      budget: 500000, // R$ 5000.00
      purpose: 'lazer',
      hobbies: ['natação'],
    },
    currentQuestionIndex: 2,
    interviewComplete: true,
    readyForRecommendation: true,
    recommendedDestination: 'Maldivas',
    questionsAsked: 5,
    totalQuestionsAvailable: 5,
    interviewEfficiency: 1.0,
    createdAt: new Date('2025-11-10T10:00:00Z'),
    updatedAt: new Date('2025-11-10T10:15:00Z'),
  };

  beforeEach(async () => {
    const mockRepository = {
      getAllUserSessions: jest.fn(),
      getSession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        {
          provide: ChatSessionRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<SessionsController>(SessionsController);
    repository = module.get(ChatSessionRepository);
  });

  describe('getUserSessions', () => {
    it('should return sessions for authenticated user', async () => {
      repository.getAllUserSessions.mockResolvedValue([mockSession]);

      const result = await controller.getUserSessions('user-123', mockUser as any);

      expect(result.sessions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.sessions[0].sessionId).toBe('session-456');
      expect(result.sessions[0].summary).toContain('Olá');
      expect(result.sessions[0].messageCount).toBe(2);
      expect(repository.getAllUserSessions).toHaveBeenCalledWith('user-123');
    });

    it('should throw ForbiddenException when user tries to access another user sessions', async () => {
      await expect(
        controller.getUserSessions('other-user-456', mockUser as any),
      ).rejects.toThrow(ForbiddenException);

      expect(repository.getAllUserSessions).not.toHaveBeenCalled();
    });

    it('should return empty array when user has no sessions', async () => {
      repository.getAllUserSessions.mockResolvedValue([]);

      const result = await controller.getUserSessions('user-123', mockUser as any);

      expect(result.sessions).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle multiple sessions correctly', async () => {
      const session2: ChatSession = {
        ...mockSession,
        sessionId: 'session-789',
        createdAt: new Date('2025-11-11T14:00:00Z'),
        updatedAt: new Date('2025-11-11T14:30:00Z'),
      };

      repository.getAllUserSessions.mockResolvedValue([mockSession, session2]);

      const result = await controller.getUserSessions('user-123', mockUser as any);

      expect(result.sessions).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('getSessionDetail', () => {
    it('should return session details for owner', async () => {
      repository.getSession.mockResolvedValue(mockSession);

      const result = await controller.getSessionDetail('session-456', mockUser as any);

      expect(result.session.sessionId).toBe('session-456');
      expect(result.session.messages).toHaveLength(2);
      expect(result.session.profileData?.origin).toBe('São Paulo');
      expect(result.session.recommendedDestination).toBe('Maldivas');
      expect(repository.getSession).toHaveBeenCalledWith('session-456');
    });

    it('should throw NotFoundException when session does not exist', async () => {
      repository.getSession.mockResolvedValue(null);

      await expect(
        controller.getSessionDetail('nonexistent-session', mockUser as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user tries to access another user session', async () => {
      const otherUserSession: ChatSession = {
        ...mockSession,
        userId: 'other-user-456',
      };
      repository.getSession.mockResolvedValue(otherUserSession);

      await expect(
        controller.getSessionDetail('session-456', mockUser as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should include all message details', async () => {
      repository.getSession.mockResolvedValue(mockSession);

      const result = await controller.getSessionDetail('session-456', mockUser as any);

      expect(result.session.messages[0].role).toBe('user');
      expect(result.session.messages[0].content).toBe('Olá, quero viajar para a praia');
      expect(result.session.messages[0].timestamp).toEqual(
        new Date('2025-11-10T10:00:00Z'),
      );
    });

    it('should handle incomplete sessions', async () => {
      const incompleteSession: ChatSession = {
        ...mockSession,
        interviewComplete: false,
        recommendedDestination: undefined,
      };
      repository.getSession.mockResolvedValue(incompleteSession);

      const result = await controller.getSessionDetail('session-456', mockUser as any);

      expect(result.session.interviewComplete).toBe(false);
      expect(result.session.recommendedDestination).toBeUndefined();
    });
  });
});
