import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import {
  PAGINA_SCHEMA,
  PaginaGerada,
  RespostaModelo,
  paginaDeResposta,
  sanitizePagina,
} from '../ai-design/blocks.schema';
import {
  DEFAULT_IMAGE_MODEL,
  DEFAULT_IMAGE_QUALITY,
  DEFAULT_TEXT_MODEL,
  Destino,
  IMAGE_MODELS,
  TEXT_MODELS,
} from './models';

const KEY_TEXT = 'ai_text_model';
const KEY_IMAGE = 'ai_image_model';
const KEY_QUALITY = 'ai_image_quality';

/** Onde a imagem gerada é gravada. Servido estaticamente em /uploads/marketing. */
const IMAGE_DIR = join(process.cwd(), 'uploads', 'marketing');

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

Em "meio" use de dois a quatro blocos. Não repita em "meio" a ideia que já está
no hero ou no cta.

Sem URL inventada: quando não souber para onde o botão aponta, use "/clube".`;

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private openai: OpenAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // A chave fica no .env de propósito: ela tem cobrança atrelada, e backup de
    // banco não é lugar para isso. Só os modelos vão para a tela.
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      const baseURL = this.configService.get<string>('OPENAI_BASE_URL') || undefined;
      this.openai = new OpenAI({ apiKey, baseURL });
    } else {
      this.logger.warn('OPENAI_API_KEY ausente — geração por IA desligada.');
    }
  }

  /**
   * Valida na LEITURA, não só na escrita: um modelo pode sair do catálogo num
   * commit futuro e a linha antiga continuaria no banco, quebrando toda geração
   * com 400 até alguém abrir a tela.
   */
  async getConfig() {
    const rows = await this.prisma.clubSettings.findMany({
      where: { key: { in: [KEY_TEXT, KEY_IMAGE, KEY_QUALITY] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    return {
      textModel: TEXT_MODELS.includes(map[KEY_TEXT]) ? map[KEY_TEXT] : DEFAULT_TEXT_MODEL,
      imageModel: IMAGE_MODELS[map[KEY_IMAGE]] ? map[KEY_IMAGE] : DEFAULT_IMAGE_MODEL,
      imageQuality: map[KEY_QUALITY] === 'alta' ? 'alta' : DEFAULT_IMAGE_QUALITY,
      textModels: TEXT_MODELS,
      imageModels: Object.keys(IMAGE_MODELS),
    };
  }

  async setConfig(dto: { textModel?: string; imageModel?: string; imageQuality?: string }) {
    const pares: [string, string][] = [];
    if (dto.textModel && TEXT_MODELS.includes(dto.textModel)) {
      pares.push([KEY_TEXT, dto.textModel]);
    }
    if (dto.imageModel && IMAGE_MODELS[dto.imageModel]) {
      pares.push([KEY_IMAGE, dto.imageModel]);
    }
    if (dto.imageQuality === 'alta' || dto.imageQuality === 'padrao') {
      pares.push([KEY_QUALITY, dto.imageQuality]);
    }

    for (const [key, value] of pares) {
      await this.prisma.clubSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    return this.getConfig();
  }

  /**
   * Tema livre digitado pela equipe → página em blocos, pronta para os dois
   * renderizadores.
   *
   * O structured output prende a resposta ao schema, então não há parser
   * defensivo aqui. O que o schema NÃO garante é o conteúdo — cor e URL passam
   * por sanitizePagina antes de virar `style` e `href`.
   */
  async gerarPagina(tema: string, destino: Destino, contexto?: string): Promise<PaginaGerada> {
    if (!this.openai) {
      throw new ServiceUnavailableException(
        'Geração por IA indisponível: OPENAI_API_KEY não configurada.',
      );
    }

    const cfg = await this.getConfig();
    this.logger.log(`Gerando página [${cfg.textModel}, destino ${destino}]: ${tema}`);

    const completion = await this.openai.chat.completions.create({
      model: cfg.textModel,
      messages: [
        { role: 'system', content: SISTEMA },
        {
          role: 'user',
          content: contexto
            ? `Tema da campanha: ${tema}\n\nContexto adicional: ${contexto}`
            : `Tema da campanha: ${tema}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'pagina', strict: true, schema: PAGINA_SCHEMA },
      },
    } as any);

    const texto = completion.choices[0]?.message?.content;
    if (!texto) {
      throw new ServiceUnavailableException('Resposta do modelo veio sem conteúdo.');
    }

    const pagina = sanitizePagina(paginaDeResposta(JSON.parse(texto) as RespostaModelo));
    pagina.imagemUrl = await this.gerarImagem(tema, pagina, destino, cfg);
    return pagina;
  }

  /**
   * A imagem é sempre baixada e gravada em disco. Os modelos que devolvem URL
   * dão uma URL que expira em ~1h — um e-mail exportado hoje e disparado amanhã
   * sairia com a imagem quebrada, e ninguém ligaria uma coisa na outra.
   *
   * Falha aqui não derruba a geração: página sem imagem é utilizável, e a tela
   * permite subir uma no lugar.
   */
  private async gerarImagem(
    tema: string,
    pagina: PaginaGerada,
    destino: Destino,
    cfg: { imageModel: string; imageQuality: string },
  ): Promise<string | undefined> {
    const modelo = IMAGE_MODELS[cfg.imageModel];

    try {
      const resposta = await this.openai!.images.generate({
        model: cfg.imageModel,
        prompt: `Fotografia realista de alta qualidade sobre ciclismo para a campanha "${tema}". ${pagina.subtitulo}. Luz natural, sem texto na imagem, sem logotipo.`,
        n: 1,
        size: modelo.tamanho[destino],
        ...(modelo.quality ? { quality: modelo.quality[cfg.imageQuality] } : {}),
      } as any);

      const item = resposta.data?.[0];
      if (!item) return undefined;

      // Uns modelos devolvem base64, outros URL. Os dois acabam no mesmo lugar.
      const bytes = item.b64_json
        ? Buffer.from(item.b64_json, 'base64')
        : Buffer.from(await (await fetch(item.url!)).arrayBuffer());

      const nome = `${randomUUID()}.png`;
      await mkdir(IMAGE_DIR, { recursive: true });
      await writeFile(join(IMAGE_DIR, nome), bytes);
      return `/uploads/marketing/${nome}`;
    } catch (err: any) {
      this.logger.warn(`Imagem não gerada (a página segue sem ela): ${err.message}`);
      return undefined;
    }
  }
}
