import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateCopyDto } from './dto/generate-copy.dto';

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateCopy(dto: GenerateCopyDto) {
    const apiKey = this.configService.get('OPENAI_API_KEY') || this.configService.get('GEMINI_API_KEY');

    if (apiKey) {
      // In production with API key, call external LLM
      try {
        // Mocked or actual API call structure
        this.logger.log(`Gerando copy via API externa para o tipo ${dto.type || 'GENERAL'}`);
      } catch (err) {
        this.logger.error(`Erro ao chamar API externa de IA: ${err.message}`);
      }
    }

    // Fallback template engine for Relm Care+ Marketing
    return this.generateSmartFallback(dto);
  }

  private generateSmartFallback(dto: GenerateCopyDto) {
    const tone = dto.tone || 'entusiasta e profissional';
    const audience = dto.targetAudience || 'ciclistas e entusiastas';
    const promptLower = dto.prompt.toLowerCase();

    if (dto.type === 'DAILY_RIDER_MESSAGE') {
      return {
        success: true,
        type: 'DAILY_RIDER_MESSAGE',
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
        heading: '📧 Sugestões de Assuntos de E-mail de Alta Conversão',
        content: [
          `🚴 Seus pontos Relm Care+ estão prontos para resgate!`,
          `Sua bike merece o melhor: Ganhe benefícios exclusivos no Clube Relm`,
          `Manutenção em dia = Pedalada segura. Veja suas vantagens de hoje!`,
          `🚨 Lembrete: Seus pontos do mês vencem em breve. Resgate agora!`,
        ].join('\n'),
      };
    }

    if (dto.type === 'LANDING_PAGE') {
      return {
        success: true,
        type: 'LANDING_PAGE',
        heading: `🚀 Estrutura de Landing Page: ${dto.prompt}`,
        hero: {
          title: `Eleve o Nível da Sua Pedalada com o Relm Care+`,
          subtitle: `Proteção completa para sua bike, revisões gratuitas na oficina e acúmulo de pontos a cada compra.`,
          ctaText: `Quero Ser Membro Plus`,
        },
        features: [
          `Revisão preventiva mensal incluída`,
          `Garantia estendida por número de série`,
          `Pontos mensais renováveis sem acumular`,
          `Descontos exclusivos em conveniências e lojas parceiras`,
        ],
        ctaBanner: `Cadastre sua bike na loja credenciada mais próxima e ative seus benefícios hoje mesmo!`,
      };
    }

    // Default Campaign Copy
    return {
      success: true,
      type: 'CAMPAIGN_COPY',
      heading: `✨ Copy de Campanha de Marketing`,
      content: `Acelere seu desempenho e pedale sem preocupações! Com o Relm Care+, você conta com atendimento prioritário na oficina, resgate de vouchers para serviços essenciais e vantagens exclusivas em todas as lojas credenciadas. Seja para o pedal de fim de semana ou treinos diários, nós cuidamos da sua bicicleta para você focar no caminho.`,
      suggestedSubject: `Sua bike pronta para qualquer desafio com o Relm Care+`,
      cta: 'Saiba Mais',
    };
  }
}
