import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
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
Também deve classificar o tema do enredo em uma das seguintes categorias: 'WORKSHOP', 'MTB_TRAIL', 'ROAD', 'URBAN', 'EQUIPMENT', 'EVENT'.

Responda EXCLUSIVAMENTE em formato JSON válido contendo a seguinte estrutura dependendo do tipo:

Para LANDING_PAGE:
{
  "heading": "Título principal curto da oferta",
  "category": "WORKSHOP | MTB_TRAIL | ROAD | URBAN | EQUIPMENT | EVENT",
  "dalleImagePrompt": "Detailed English prompt for high-resolution photorealistic cycling image matching this storyline",
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
  "category": "WORKSHOP | MTB_TRAIL | ROAD | URBAN | EQUIPMENT | EVENT",
  "dalleImagePrompt": "Detailed English prompt for high-resolution photorealistic cycling image matching this storyline",
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

      // Attempt DALL-E image generation matching the storyline prompt
      let dalleImageUrl = null;
      if (parsedJson.dalleImagePrompt) {
        try {
          this.logger.log(`Solicitando imagem temática via OpenAI DALL-E...`);
          const imageRes = await this.openai.images.generate({
            model: 'dall-e-2', // or dall-e-3 based on account tier
            prompt: `High quality realistic photograph: ${parsedJson.dalleImagePrompt}, cycling theme, bright lighting, professional product photo style`,
            n: 1,
            size: '512x512',
          });
          dalleImageUrl = imageRes.data[0]?.url || null;
        } catch (imgErr: any) {
          this.logger.warn(`DALL-E imagem não gerada (usando foto de tema): ${imgErr.message}`);
        }
      }

      return {
        success: true,
        modelUsed: selectedModel,
        type: type,
        category: parsedJson.category || 'WORKSHOP',
        dalleImageUrl: dalleImageUrl,
        ...parsedJson,
      };
    } catch (err: any) {
      this.logger.error(`Falha na API da OpenAI: ${err.message}`, err.stack);
      throw new ServiceUnavailableException(
        `Erro ao comunicar com a OpenAI (${selectedModel}): ${err.message || 'Falha na resposta da API.'}`
      );
    }
  }

  private generateSmartFallback(dto: GenerateCopyDto) {
    if (dto.type === 'DAILY_RIDER_MESSAGE') {
      return {
        success: true,
        type: 'DAILY_RIDER_MESSAGE',
        category: 'ROAD',
        heading: '🚴 Mensagem Diária para o Ciclista',
        content: `Mantenha sua pedalada no mais alto nível! O seu plano Relm Care+ garante revisão preventiva em dia e pontuação acumulada a cada pedalada. Não esqueça de verificar a pressão dos pneus e o lubrificante da corrente antes de sair hoje. Bora rodar com segurança!`,
        suggestedSubject: 'Dica do dia Relm Care+: Mantenha sua bike na melhor performance 🚴‍♂️',
        cta: 'Ver Benefícios do Meu Plano',
      };
    }

    if (dto.type === 'EMAIL_SUBJECT') {
      return {
        success: true,
        type: 'EMAIL_SUBJECT',
        category: 'WORKSHOP',
        heading: '📧 Sugestões de Assuntos de E-mail de Alta Conversão',
        content: `🚴 Seus pontos Relm Care+ estão prontos para resgate!\nSua bike merece o melhor: Ganhe benefícios exclusivos no Clube Relm\nManutenção em dia = Pedalada segura. Veja suas vantagens de hoje!`,
        suggestedSubject: `Sua bike pronta para qualquer desafio com o Relm Care+`,
      };
    }

    if (dto.type === 'LANDING_PAGE') {
      return {
        success: true,
        type: 'LANDING_PAGE',
        category: 'WORKSHOP',
        heading: `🚀 Estrutura de Landing Page: ${dto.prompt}`,
        hero: {
          title: `Eleve o Nível da Sua Pedalada com o Relm Care+`,
          subtitle: `Proteção completa para sua bike, revisões gratuitas na oficina e acúmulo de pontos a cada compra.`,
          ctaText: `Quero Ser Membro Plus`,
        },
        content: `Cadastre sua bike na loja credenciada mais próxima e ative seus benefícios hoje mesmo!`,
      };
    }

    return {
      success: true,
      type: 'CAMPAIGN_COPY',
      category: 'ROAD',
      heading: `✨ Copy de Campanha de Marketing`,
      content: `Acelere seu desempenho e pedale sem preocupações! Com o Relm Care+, você conta com atendimento prioritário na oficina, resgate de vouchers para serviços essenciais e vantagens exclusivas em todas as lojas credenciadas.`,
      suggestedSubject: `Sua bike pronta para qualquer desafio com o Relm Care+`,
      cta: 'Saiba Mais',
    };
  }
}
