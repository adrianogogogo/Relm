import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PAGINA_SCHEMA, PaginaGerada, sanitizePagina } from './blocks.schema';

const MODELO = 'claude-opus-5';

const SISTEMA = `Você monta páginas de campanha para a Relm Bikes, uma marca de
bicicletas com clube de assinatura (Care gratuito e Care Plus pago) vendido por
lojas parceiras no Brasil.

Escreva em português do Brasil, no tom de quem conhece ciclismo e fala com
ciclista — direto, específico, sem jargão de marketing. Prefira o benefício
concreto ("revisão inclusa a cada 6 meses") ao adjetivo ("experiência
incrível").

A paleta deve nascer do tema, não de um padrão fixo: uma campanha de inverno não
tem a mesma cor de um lançamento de bike infantil. Garanta contraste legível
entre corTexto e corFundo.

Estrutura: comece por um hero, feche por um cta, e entre eles use de dois a
quatro blocos. Não repita a mesma ideia em blocos diferentes.

Sem URL inventada: quando não souber para onde o botão aponta, use "/clube".`;

@Injectable()
export class AiDesignService {
  private readonly logger = new Logger(AiDesignService.name);
  private readonly client: Anthropic | null;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');
    // Sem chave o módulo sobe mesmo assim: o resto da API não pode deixar de
    // funcionar porque a campanha não foi configurada. Quem chamar recebe 503.
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY ausente — geração por IA desligada.');
    }
  }

  get disponivel(): boolean {
    return this.client !== null;
  }

  /**
   * Tema livre digitado pela equipe → página em blocos.
   *
   * `output_config.format` prende a resposta ao schema: não existe caminho em
   * que volte texto solto, então não há parser defensivo aqui. O que o schema
   * NÃO garante é o conteúdo — cor e URL passam por sanitizePagina.
   */
  async gerarPagina(tema: string, contexto?: string): Promise<PaginaGerada> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Geração por IA indisponível: ANTHROPIC_API_KEY não configurada.',
      );
    }

    const resposta = await this.client.messages.create({
      model: MODELO,
      max_tokens: 16000,
      system: SISTEMA,
      output_config: { format: { type: 'json_schema', schema: PAGINA_SCHEMA } },
      messages: [
        {
          role: 'user',
          content: contexto
            ? `Tema da campanha: ${tema}\n\nContexto adicional: ${contexto}`
            : `Tema da campanha: ${tema}`,
        },
      ],
    } as any);

    // Uma recusa devolve 200 com content vazio — ler content[0] direto
    // quebraria com TypeError em vez de dizer o que houve.
    if (resposta.stop_reason === 'refusal') {
      throw new ServiceUnavailableException(
        'O modelo recusou gerar esta campanha. Reformule o tema.',
      );
    }

    const bloco = resposta.content.find((b) => b.type === 'text');
    if (!bloco || bloco.type !== 'text') {
      throw new ServiceUnavailableException('Resposta do modelo veio sem conteúdo.');
    }

    return sanitizePagina(JSON.parse(bloco.text) as PaginaGerada);
  }
}
