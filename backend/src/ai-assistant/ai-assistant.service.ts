import { Injectable, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GenerateCopyDto } from './dto/generate-copy.dto';

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private openai: OpenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('Cliente OpenAI inicializado com sucesso.');
    } else {
      this.logger.warn('OPENAI_API_KEY não configurada no .env.');
    }
  }

  async generateCopy(dto: GenerateCopyDto) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!this.openai && apiKey) {
      this.openai = new OpenAI({ apiKey });
    }

    if (!this.openai) {
      this.logger.warn('OPENAI_API_KEY ausente. Utilizando motor de fallback.');
      return this.generateSmartFallback(dto);
    }

    const selectedModel = dto.model || 'gpt-4o-mini';
    const type = dto.type || 'LANDING_PAGE';

    const systemPrompt = `Você é o especialista de Marketing da Relm Bikes / Relm Care+, um clube de assinaturas e garantias de bicicletas para ciclistas no Brasil.
Sua missão é escrever copys de alta conversão em português do Brasil com tom entusiasta, direto e focado no benefício para o ciclista.

Responda EXCLUSIVAMENTE em formato JSON válido contendo a seguinte estrutura dependendo do tipo:

Para LANDING_PAGE:
{
  "heading": "Título principal curto da oferta",
  "hero": {
    "title": "Título impactante para o topo da página",
    "subtitle": "Subtítulo explicativo com oferta e benefícios",
    "ctaText": "Texto do botão de ação"
  },
  "content": "Descrição persuasiva detalhada da campanha",
  "suggestedSubject": "Assunto recomendado para e-mail"
}

Para EMAIL_SUBJECT ou CAMPAIGN_COPY ou DAILY_RIDER_MESSAGE:
{
  "heading": "Título principal da mensagem",
  "content": "Texto do e-mail ou mensagem em parágrafos claros",
  "suggestedSubject": "Assunto de alta taxa de abertura para e-mail",
  "cta": "Texto do botão"
}`;

    const userPrompt = `Tipo de Conteúdo: ${type}
Modelo Solicitado: ${selectedModel}
Ideia/Objetivo da Campanha: ${dto.prompt}
Público Alvo: ${dto.targetAudience || 'Ciclistas e clientes das lojas credenciadas Relm'}`;

    try {
      this.logger.log(`Solicitando geração à OpenAI [Modelo: ${selectedModel}, Tipo: ${type}]...`);

      const completion = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const parsedJson = JSON.parse(responseText);

      return {
        success: true,
        modelUsed: selectedModel,
        type: type,
        ...parsedJson,
      };
    } catch (err: any) {
      this.logger.error(`Falha na API da OpenAI: ${err.message}`, err.stack);
      throw new ServiceUnavailableException(
        `Erro ao comunicar com a OpenAI (${selectedModel}): ${err.message || 'Falha na resposta da API.'}`
      );
    }
  }
}
