import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiAssistantService } from './ai-assistant.service';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_IMAGE_MODEL, DEFAULT_TEXT_MODEL } from './models';
import { ClubSettingsService } from '../club-settings/club-settings.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

describe('AiAssistantService', () => {
  let service: AiAssistantService;
  let prisma: any;

  const mockPrisma = {
    clubSettings: { findMany: jest.fn(), upsert: jest.fn() },
  };
  const mockAudit = { log: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAssistantService,
        // Sem OPENAI_API_KEY: o módulo tem que subir mesmo assim, senão a API
        // inteira cai porque a campanha não foi configurada.
        { provide: ConfigService, useValue: { get: () => null } },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ClubSettingsService, useValue: { getSettings: jest.fn() } },
        { provide: AuditLogsService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AiAssistantService>(AiAssistantService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('usa os defaults quando não há nada configurado', async () => {
    prisma.clubSettings.findMany.mockResolvedValue([]);

    const cfg = await service.getConfig();

    expect(cfg.textModel).toBe(DEFAULT_TEXT_MODEL);
    expect(cfg.imageModel).toBe(DEFAULT_IMAGE_MODEL);
    expect(cfg.imageQuality).toBe('padrao');
  });

  it('ignora modelo salvo que saiu do catálogo em vez de gerar 400 a cada uso', async () => {
    prisma.clubSettings.findMany.mockResolvedValue([
      { key: 'ai_text_model', value: 'modelo-aposentado' },
      { key: 'ai_image_model', value: 'modelo-aposentado' },
      { key: 'ai_image_quality', value: 'alta' },
    ]);

    const cfg = await service.getConfig();

    expect(cfg.textModel).toBe(DEFAULT_TEXT_MODEL);
    expect(cfg.imageModel).toBe(DEFAULT_IMAGE_MODEL);
    // A qualidade era válida e sobrevive.
    expect(cfg.imageQuality).toBe('alta');
  });

  it('não grava valor fora do catálogo', async () => {
    prisma.clubSettings.findMany.mockResolvedValue([]);

    await service.setConfig({ textModel: 'inventado', imageQuality: 'alta' });

    const chaves = prisma.clubSettings.upsert.mock.calls.map((c) => c[0].where.key);
    expect(chaves).toEqual(['ai_image_quality']);
  });

  it('recusa gerar sem OPENAI_API_KEY em vez de falhar em silêncio', async () => {
    await expect(service.gerarPagina('Revisão de inverno', 'LANDING')).rejects.toThrow(
      /OPENAI_API_KEY/,
    );
  });
});
