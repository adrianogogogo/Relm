import { Test, TestingModule } from '@nestjs/testing';
import { AiAssistantService } from './ai-assistant.service';
import { ConfigService } from '@nestjs/config';

describe('AiAssistantService', () => {
  let service: AiAssistantService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAssistantService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AiAssistantService>(AiAssistantService);
  });

  it('deve gerar copy usando o engine inteligente de fallback', async () => {
    const result = await service.generateCopy({
      prompt: 'Promoção de revisão de bicicleta',
      type: 'CAMPAIGN_COPY',
    });

    expect(result.success).toBe(true);
    expect(result.type).toBe('CAMPAIGN_COPY');
    expect(result.content).toBeDefined();
  });

  it('deve gerar mensagem diária para ciclistas', async () => {
    const result = await service.generateCopy({
      prompt: 'Dica diária',
      type: 'DAILY_RIDER_MESSAGE',
    });

    expect(result.success).toBe(true);
    expect(result.type).toBe('DAILY_RIDER_MESSAGE');
    expect(result.heading).toContain('Ciclista');
  });
});
