import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotGateway } from './chatbot.gateway';
import { ChatbotService } from './chatbot.service';

describe('ChatbotGateway', () => {
  let gateway: ChatbotGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatbotGateway, ChatbotService],
    }).compile();

    gateway = module.get<ChatbotGateway>(ChatbotGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
