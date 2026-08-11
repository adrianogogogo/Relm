import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import {
  PaginaGerada,
  RespostaModelo,
  paginaDeResposta,
  sanitizePagina,
  schemaDe,
} from '../ai-design/blocks.schema';
import { ClubSettingsService } from '../club-settings/club-settings.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CHECKLIST, montarSistema } from './campanha-prompts';
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
/** Camada editável do prompt, uma por destino. O núcleo fica no código. */
const KEY_TOM_LANDING = 'ai_tom_landing';
const KEY_TOM_EMAIL = 'ai_tom_email';
/** Teto do campo de tom: prompt de sistema não é lugar para um documento. */
const TOM_MAX = 2000;

/** Onde a imagem gerada é gravada. Servido estaticamente em /uploads/marketing. */
const IMAGE_DIR = join(process.cwd(), 'uploads', 'marketing');

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private openai: OpenAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly clubSettings: ClubSettingsService,
    private readonly auditLogs: AuditLogsService,
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
      where: { key: { in: [KEY_TEXT, KEY_IMAGE, KEY_QUALITY, KEY_TOM_LANDING, KEY_TOM_EMAIL] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    return {
      textModel: TEXT_MODELS.includes(map[KEY_TEXT]) ? map[KEY_TEXT] : DEFAULT_TEXT_MODEL,
      imageModel: IMAGE_MODELS[map[KEY_IMAGE]] ? map[KEY_IMAGE] : DEFAULT_IMAGE_MODEL,
      imageQuality: map[KEY_QUALITY] === 'alta' ? 'alta' : DEFAULT_IMAGE_QUALITY,
      tomLanding: map[KEY_TOM_LANDING] || '',
      tomEmail: map[KEY_TOM_EMAIL] || '',
      textModels: TEXT_MODELS,
      imageModels: Object.keys(IMAGE_MODELS),
    };
  }

  /**
   * `autorId` existe porque o campo de tom entra no prompt de sistema: é a única
   * configuração daqui que muda o texto que chega ao cliente. Alteração sem
   * rastro de autor só se descobre investigando depois.
   */
  async setConfig(
    dto: {
      textModel?: string;
      imageModel?: string;
      imageQuality?: string;
      tomLanding?: string;
      tomEmail?: string;
    },
    autorId?: string,
  ) {
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

    const anterior = await this.getConfig();
    const tons: [string, string, string][] = [];
    if (dto.tomLanding !== undefined) {
      tons.push([KEY_TOM_LANDING, dto.tomLanding.slice(0, TOM_MAX), anterior.tomLanding]);
    }
    if (dto.tomEmail !== undefined) {
      tons.push([KEY_TOM_EMAIL, dto.tomEmail.slice(0, TOM_MAX), anterior.tomEmail]);
    }

    for (const [key, value] of [...pares, ...tons.map(([k, v]) => [k, v] as [string, string])]) {
      await this.prisma.clubSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    for (const [key, depois, antes] of tons) {
      if (depois === antes) continue;
      await this.auditLogs.log({
        userId: autorId,
        action: 'UPDATE',
        entity: 'AiPrompt',
        entityId: key,
        metadata: { antes, depois },
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
    const ehEmail = destino === 'EMAIL';
    this.logger.log(`Gerando página [${cfg.textModel}, destino ${destino}]: ${tema}`);

    const fatos = await this.clubSettings.getSettings();
    const sistema = montarSistema(destino, fatos, ehEmail ? cfg.tomEmail : cfg.tomLanding);
    const briefing = contexto
      ? `Tema da campanha: ${tema}\n\nContexto adicional: ${contexto}`
      : `Tema da campanha: ${tema}`;

    const rascunho = await this.completar(cfg.textModel, sistema, briefing, schemaDe(ehEmail, false));

    // Segunda passada. Um prompt melhor não pega erro de atribuição de benefício
    // ao plano errado — checklist contra o rascunho pronto pega. Se ela falhar,
    // o rascunho vale: página revisada é melhor, página nenhuma não é opção.
    let bruta = rascunho;
    try {
      bruta = await this.completar(
        cfg.textModel,
        sistema,
        `${briefing}\n\n${CHECKLIST}\n\nRascunho:\n${JSON.stringify(rascunho)}`,
        schemaDe(ehEmail, true),
      );
    } catch (err: any) {
      this.logger.warn(`Revisão falhou, seguindo com o rascunho: ${err.message}`);
    }

    const pagina = sanitizePagina(paginaDeResposta(bruta));
    pagina.imagemUrl = await this.gerarImagem(tema, pagina, destino, cfg);
    return pagina;
  }

  /** Uma chamada de texto presa a um schema. As duas passadas usam esta. */
  private async completar(
    model: string,
    sistema: string,
    usuario: string,
    schema: object,
  ): Promise<RespostaModelo> {
    const completion = await this.openai!.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: sistema },
        { role: 'user', content: usuario },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'pagina', strict: true, schema },
      },
    } as any);

    const texto = completion.choices[0]?.message?.content;
    if (!texto) {
      throw new ServiceUnavailableException('Resposta do modelo veio sem conteúdo.');
    }
    return JSON.parse(texto) as RespostaModelo;
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
