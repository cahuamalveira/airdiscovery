import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  BedrockRuntimeClient, 
  ConverseStreamCommand,
  ConverseStreamCommandInput,
  ConversationRole 
} from '@aws-sdk/client-bedrock-runtime';
import { fromEnv } from '@aws-sdk/credential-providers';
import { 
  ChatSession, 
  ChatMessage, 
  UserProfile, 
  InterviewConfig,
  StreamChunk 
} from './interfaces/chat.interface';
import { ChatMessageDto, MessageRole } from './dto/chat-message.dto';
import { ChatSessionRepository } from './repositories/chat-session.repository';
import { randomUUID } from 'crypto';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly bedrockClient: BedrockRuntimeClient;
  
  // Configuração da entrevista baseada nos requisitos RF006
  private readonly interviewConfig: InterviewConfig = {
    systemPrompt: `Você é um assistente de viagem especializado da AIR Discovery. Sua função é conduzir uma entrevista personalizada para entender o perfil do viajante e recomendar destinos ideais.

INSTRUÇÕES IMPORTANTES:
1. Seja amigável, conversacional e entusiasmado sobre viagens
2. Faça UMA pergunta por vez
3. Baseie-se nas respostas anteriores para fazer perguntas de seguimento relevantes
4. Colete informações sobre: atividades preferidas, orçamento, propósito da viagem, hobbies
5. A entrevista deve ter entre 4-8 perguntas dependendo das respostas
6. Ao final, confirme se coletou informações suficientes

FLUXO DA ENTREVISTA:
- Inicie com uma saudação calorosa
- Pergunte sobre atividades preferidas em férias
- Explore orçamento de viagem
- Descubra o propósito da viagem (lazer, trabalho, rotina)
- Identifique hobbies e interesses
- Faça perguntas de seguimento baseadas nas respostas
- Finalize confirmando se tem informações suficientes

Mantenha cada resposta concisa (máximo 2-3 frases) e sempre termine com uma pergunta clara.`,
    questions: [
      {
        id: 'greeting',
        category: 'activities',
        question: 'Olá! Sou seu assistente de viagem da AIR Discovery e estou aqui para te ajudar a encontrar o destino perfeito! 🌍✈️ Para começar, me conta: que tipo de atividades você mais gosta de fazer quando está de férias?'
      },
      {
        id: 'budget',
        category: 'budget',
        question: 'Perfeito! E qual seria um orçamento aproximado que você tem em mente para essa viagem? Pode ser uma faixa de valores que se sinta confortável.'
      },
      {
        id: 'purpose',
        category: 'purpose', 
        question: 'Entendi! E me conta, qual é o principal motivo dessa viagem? É mais para relaxar e descansar, aventura e diversão, trabalho, ou algo específico que você tem em mente?'
      },
      {
        id: 'hobbies',
        category: 'hobbies',
        question: 'Que interessante! E no seu tempo livre, quais são seus hobbies favoritos? O que você gosta de fazer para se divertir ou relaxar?'
      }
    ],
    maxQuestions: 8
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly chatSessionRepository: ChatSessionRepository
  ) {
    this.bedrockClient = new BedrockRuntimeClient({
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      credentials: fromEnv(),
    });
  }

  /**
   * Inicia uma nova sessão de chat
   */
  async startChatSession(userId: string, sessionId?: string): Promise<string> {
    const id = sessionId || randomUUID();
    
    const session: ChatSession = {
      sessionId: id,
      userId,
      messages: [],
      profileData: {
        activities: [],
        budget: '',
        purpose: '',
        hobbies: [],
        additionalInfo: {}
      },
      currentQuestionIndex: 0,
      interviewComplete: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.chatSessionRepository.saveSession(session);
    this.logger.log(`Chat session started for user ${userId}: ${id}`);
    
    return id;
  }

  /**
   * Processa mensagem do usuário e gera resposta via streaming
   */
  async processMessage(
    sessionId: string, 
    message: ChatMessageDto,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const session = await this.chatSessionRepository.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    try {
      // Adiciona mensagem do usuário
      session.messages.push({
        role: message.role,
        content: message.content,
        timestamp: new Date()
      });

      // Extrai informações do perfil da resposta do usuário
      this.extractProfileData(session, message.content);

      // Prepara o contexto para o Bedrock
      const conversationHistory = this.buildConversationHistory(session);
      
      // Gera resposta via streaming
      await this.streamBedrockResponse(session, conversationHistory, onChunk);

      session.updatedAt = new Date();
      
      // Salva sessão atualizada no DynamoDB
      await this.chatSessionRepository.saveSession(session);
      
    } catch (error) {
      this.logger.error(`Error processing message for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Obtém sessão de chat
   */
  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    try {
      const session = await this.chatSessionRepository.getSession(sessionId);
      return session || undefined;
    } catch (error) {
      this.logger.error(`Error getting session ${sessionId}:`, error);
      return undefined;
    }
  }

  /**
   * Finaliza sessão de chat
   */
  async endChatSession(sessionId: string): Promise<UserProfile | undefined> {
    try {
      const session = await this.chatSessionRepository.getSession(sessionId);
      if (!session) {
        return undefined;
      }

      const profile = session.profileData;
      await this.chatSessionRepository.deleteSession(sessionId);
      this.logger.log(`Chat session ended: ${sessionId}`);
      
      return profile;
    } catch (error) {
      this.logger.error(`Error ending session ${sessionId}:`, error);
      return undefined;
    }
  }

  /**
   * Constrói histórico da conversa para o Bedrock
   */
  private buildConversationHistory(session: ChatSession): ConverseStreamCommandInput {
    const messages: Array<{
      role: ConversationRole;
      content: Array<{ text: string }>;
    }> = [];

    // Adiciona mensagens da conversa
    session.messages.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: [{
          text: msg.content
        }]
      });
    });

    // Se é a primeira mensagem, adiciona a pergunta inicial
    if (session.messages.length === 1) {
      const currentQuestion = this.getCurrentQuestion(session);
      if (currentQuestion) {
        messages.push({
          role: 'assistant',
          content: [{
            text: currentQuestion.question
          }]
        });
      }
    }

    return {
      modelId: this.configService.get<string>('BEDROCK_MODEL', 'anthropic.claude-3-sonnet-20240229-v1:0'),
      messages: messages,
      system: [{
        text: this.interviewConfig.systemPrompt
      }],
      inferenceConfig: {
        maxTokens: 500,
        temperature: 0.7,
        topP: 0.9
      }
    };
  }

  /**
   * Faz streaming da resposta do Bedrock
   */
  private async streamBedrockResponse(
    session: ChatSession,
    input: ConverseStreamCommandInput,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    try {
      const command = new ConverseStreamCommand(input);
      const response = await this.bedrockClient.send(command);

      let assistantResponse = '';
      
      if (response.stream) {
        for await (const chunk of response.stream) {
          if (chunk.contentBlockDelta?.delta?.text) {
            const text = chunk.contentBlockDelta.delta.text;
            assistantResponse += text;
            
            // Envia chunk em tempo real
            onChunk({
              content: text,
              isComplete: false,
              sessionId: session.sessionId,
              metadata: {
                questionNumber: session.currentQuestionIndex + 1,
                totalQuestions: this.interviewConfig.maxQuestions,
                interviewComplete: session.interviewComplete
              }
            });
          }
          
          if (chunk.messageStop) {
            // Adiciona resposta completa ao histórico
            session.messages.push({
              role: 'assistant',
              content: assistantResponse,
              timestamp: new Date()
            });

            // Verifica se a entrevista está completa
            this.checkInterviewCompletion(session);
            
            // Salva sessão atualizada
            await this.chatSessionRepository.saveSession(session);
            
            // Envia chunk final
            onChunk({
              content: '',
              isComplete: true,
              sessionId: session.sessionId,
              metadata: {
                questionNumber: session.currentQuestionIndex + 1,
                totalQuestions: this.interviewConfig.maxQuestions,
                interviewComplete: session.interviewComplete,
                profileData: session.interviewComplete ? session.profileData : undefined
              }
            });
            
            break;
          }
        }
      }
    } catch (error) {
      this.logger.error('Error streaming from Bedrock:', error);
      throw error;
    }
  }

  /**
   * Extrai dados do perfil das respostas do usuário
   */
  private extractProfileData(session: ChatSession, userMessage: string): void {
    const message = userMessage.toLowerCase();
    
    // Análise simples por palavras-chave - em produção poderia usar NLP mais sofisticado
    const currentIndex = session.currentQuestionIndex;
    
    if (currentIndex === 0) {
      // Atividades preferidas
      const activities: string[] = [];
      if (message.includes('praia') || message.includes('sol')) activities.push('Praia');
      if (message.includes('montanha') || message.includes('trilha')) activities.push('Montanha');
      if (message.includes('cidade') || message.includes('urbano')) activities.push('Cidade');
      if (message.includes('cultura') || message.includes('museu')) activities.push('Cultural');
      if (message.includes('aventura') || message.includes('radical')) activities.push('Aventura');
      if (message.includes('relax') || message.includes('spa')) activities.push('Relaxamento');
      
      session.profileData.activities = activities;
    } else if (currentIndex === 1) {
      // Orçamento
      if (message.includes('econômic') || message.includes('barato')) {
        session.profileData.budget = 'Econômico';
      } else if (message.includes('médio') || message.includes('moderado')) {
        session.profileData.budget = 'Médio';
      } else if (message.includes('alto') || message.includes('luxo')) {
        session.profileData.budget = 'Alto';
      } else {
        session.profileData.budget = userMessage; // Valor específico
      }
    } else if (currentIndex === 2) {
      // Propósito
      if (message.includes('trabalho') || message.includes('negócio')) {
        session.profileData.purpose = 'Trabalho';
      } else if (message.includes('lazer') || message.includes('férias')) {
        session.profileData.purpose = 'Lazer';
      } else if (message.includes('família') || message.includes('familiar')) {
        session.profileData.purpose = 'Família';
      } else {
        session.profileData.purpose = userMessage;
      }
    } else if (currentIndex === 3) {
      // Hobbies
      const hobbies: string[] = [];
      if (message.includes('esporte') || message.includes('academia')) hobbies.push('Esportes');
      if (message.includes('ler') || message.includes('livro')) hobbies.push('Leitura');
      if (message.includes('música') || message.includes('tocar')) hobbies.push('Música');
      if (message.includes('cozinha') || message.includes('culinária')) hobbies.push('Culinária');
      if (message.includes('arte') || message.includes('pintar')) hobbies.push('Arte');
      if (message.includes('tecnologia') || message.includes('programar')) hobbies.push('Tecnologia');
      
      session.profileData.hobbies = hobbies;
    }

    session.currentQuestionIndex++;
  }

  /**
   * Obtém a pergunta atual baseada no índice
   */
  private getCurrentQuestion(session: ChatSession) {
    const index = session.currentQuestionIndex;
    if (index < this.interviewConfig.questions.length) {
      return this.interviewConfig.questions[index];
    }
    return null;
  }

  /**
   * Verifica se a entrevista está completa
   */
  private checkInterviewCompletion(session: ChatSession): void {
    const minQuestions = 4;
    const hasBasicInfo = session.profileData.activities.length > 0 ||
                        !!session.profileData.budget ||
                        !!session.profileData.purpose ||
                        session.profileData.hobbies.length > 0;

    session.interviewComplete = session.currentQuestionIndex >= minQuestions && hasBasicInfo;
  }

  /**
   * Obtém estatísticas das sessões ativas
   */
  async getActiveSessionsCount(): Promise<number> {
    try {
      return await this.chatSessionRepository.getActiveSessionsCount();
    } catch (error) {
      this.logger.error('Error getting active sessions count:', error);
      return 0;
    }
  }

  /**
   * Limpa sessões antigas (pode ser chamado por um cron job)
   */
  async cleanupOldSessions(maxAgeHours: number = 24): Promise<number> {
    try {
      return await this.chatSessionRepository.cleanupExpiredSessions(maxAgeHours);
    } catch (error) {
      this.logger.error('Error cleaning up old sessions:', error);
      return 0;
    }
  }
}
