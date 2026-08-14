import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { readdirSync } from 'fs';
import { join } from 'path';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import {
  Bloco,
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
  getImageModelConfig,
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

/**
 * Acervo de fotos reais de ciclismo, alimentado pela equipe. É a rede de
 * segurança para quando a geração falha — sem ela, "toda peça tem imagem" seria
 * promessa dependente de uma API de terceiro estar de pé.
 */
const ACERVO_DIR = join(IMAGE_DIR, 'acervo');

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
   * Consulta dinamicamente a API da OpenAI para trazer todos os modelos
   * de texto e imagem disponíveis na conta.
   */
  async getConfig() {
    const rows = await this.prisma.clubSettings.findMany({
      where: { key: { in: [KEY_TEXT, KEY_IMAGE, KEY_QUALITY, KEY_TOM_LANDING, KEY_TOM_EMAIL] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    let availableTextModels = [...TEXT_MODELS];
    let availableImageModels = Object.keys(IMAGE_MODELS);

    if (this.openai) {
      try {
        const resList = await this.openai.models.list();
        const apiIds = resList.data.map((m) => m.id);

        const dynamicText = apiIds.filter(
          (id) =>
            /^(gpt-|o1|o3|chatgpt)/.test(id) &&
            !id.includes('realtime') &&
            !id.includes('audio') &&
            !id.includes('transcribe') &&
            !id.includes('moderation') &&
            !id.includes('embedding') &&
            !id.includes('instruct') &&
            !id.includes('tts') &&
            !id.includes('whisper'),
        );
        const dynamicImage = apiIds.filter((id) => /^(dall-e|gpt-image)/.test(id));

        if (dynamicText.length > 0) {
          availableTextModels = Array.from(new Set([...dynamicText, ...availableTextModels])).sort();
        }
        if (dynamicImage.length > 0) {
          availableImageModels = Array.from(new Set([...dynamicImage, ...availableImageModels])).sort();
        }
      } catch (err: any) {
        this.logger.warn(`Não foi possível listar modelos dinâmicos da OpenAI: ${err.message}`);
      }
    }

    const textModel =
      map[KEY_TEXT] && availableTextModels.includes(map[KEY_TEXT])
        ? map[KEY_TEXT]
        : DEFAULT_TEXT_MODEL;
    const imageModel =
      map[KEY_IMAGE] && availableImageModels.includes(map[KEY_IMAGE])
        ? map[KEY_IMAGE]
        : DEFAULT_IMAGE_MODEL;

    return {
      textModel,
      imageModel,
      imageQuality: map[KEY_QUALITY] === 'alta' ? 'alta' : DEFAULT_IMAGE_QUALITY,
      tomLanding: map[KEY_TOM_LANDING] || '',
      tomEmail: map[KEY_TOM_EMAIL] || '',
      textModels: availableTextModels,
      imageModels: availableImageModels,
    };
  }

  /**
   * Atualiza as configurações de IA no banco de dados.
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
    const configAtual = await this.getConfig();
    const pares: [string, string][] = [];
    if (dto.textModel && configAtual.textModels.includes(dto.textModel.trim())) {
      pares.push([KEY_TEXT, dto.textModel.trim()]);
    }
    if (dto.imageModel && configAtual.imageModels.includes(dto.imageModel.trim())) {
      pares.push([KEY_IMAGE, dto.imageModel.trim()]);
    }
    if (dto.imageQuality === 'alta' || dto.imageQuality === 'padrao') {
      pares.push([KEY_QUALITY, dto.imageQuality]);
    }

    const anterior = configAtual;
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
    await this.preencherImagens(tema, pagina, destino, cfg);
    return pagina;
  }

  /**
   * Toda peça sai com imagem de ciclismo ligada ao tema — o herói e os blocos de
   * imagem que o modelo posicionou. Em paralelo porque são chamadas
   * independentes: em série, três imagens triplicariam a espera da tela.
   *
   * Quando a geração falha, cai no acervo em vez de sair sem imagem. Se o acervo
   * também estiver vazio, isso vira ERRO no log — antes era um warn que ninguém
   * lia, e a peça seguia para o cliente sem ninguém saber.
   */
  private async preencherImagens(
    tema: string,
    pagina: PaginaGerada,
    destino: Destino,
    cfg: { imageModel: string; imageQuality: string },
  ): Promise<void> {
    const blocosImagem = pagina.blocos.filter(
      (b): b is Extract<Bloco, { tipo: 'imagem' }> => b.tipo === 'imagem',
    );

    const [heroi, ...doMeio] = await Promise.all([
      this.gerarImagem(tema, `${pagina.subtitulo}. Cena de abertura, plano aberto.`, destino, cfg),
      ...blocosImagem.map((b) => this.gerarImagem(tema, b.descricao, destino, cfg)),
    ]);

    pagina.imagemUrl = heroi || this.doAcervo();
    blocosImagem.forEach((bloco, i) => {
      bloco.url = doMeio[i] || this.doAcervo();
    });

    if (!pagina.imagemUrl) {
      this.logger.error(
        `Peça "${tema}" sai SEM imagem: geração falhou e o acervo em ${ACERVO_DIR} está vazio.`,
      );
    }
  }

  /**
   * Rede de segurança para quando a geração falha. A equipe alimenta a pasta com
   * fotos reais de ciclismo; a escolha aqui é aleatória de propósito — casar
   * foto com tema exigiria tags, e tag que ninguém preenche mente mais do que
   * ajuda. Pasta vazia devolve undefined e quem chamou registra o erro.
   */
  private doAcervo(): string | undefined {
    try {
      const arquivos = readdirSync(ACERVO_DIR).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
      if (!arquivos.length) return undefined;
      return `/uploads/marketing/acervo/${arquivos[Math.floor(Math.random() * arquivos.length)]}`;
    } catch {
      return undefined;
    }
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
    cena: string,
    destino: Destino,
    cfg: { imageModel: string; imageQuality: string },
  ): Promise<string | undefined> {
    const modelo = getImageModelConfig(cfg.imageModel);

    // Ciclismo é fixo no prompt, não sugestão: é a única categoria de imagem que
    // faz sentido numa peça da Relm, e deixar isso a cargo do tema já rendeu
    // foto genérica de banco de imagem.
    const prompt = `Fotografia realista de alta qualidade sobre ciclismo para a campanha "${tema}". ${cena} Luz natural, sem texto na imagem, sem logotipo.`;

    const chamar = (webp: boolean) =>
      this.openai!.images.generate({
        model: cfg.imageModel,
        prompt,
        n: 1,
        size: modelo.tamanho[destino] || '1024x1024',
        ...(modelo.quality ? { quality: modelo.quality[cfg.imageQuality] } : {}),
        // Quem sabe comprimir é a própria API — pedir WebP aqui evita instalar
        // um processador de imagem para fazer o que um parâmetro já faz.
        ...(webp ? { output_format: 'webp', output_compression: 80 } : {}),
      } as any);

    let webp = !!modelo.webp;
    let resposta;
    try {
      resposta = await chamar(webp);
    } catch (err: any) {
      // WebP é otimização de peso — não pode custar a imagem. A OpenAI declara
      // output_format só para gpt-image-1, e a lista de modelos vem da API em
      // tempo de execução: acertar quem aceita o quê não é coisa que este código
      // consiga garantir. Então tenta sem, uma vez, antes de desistir.
      if (!webp) {
        this.logger.error(`Imagem NÃO gerada para "${tema}": ${err.message}`);
        return undefined;
      }
      this.logger.warn(`Modelo recusou WebP, repetindo em PNG: ${err.message}`);
      webp = false;
      try {
        resposta = await chamar(false);
      } catch (erroFinal: any) {
        this.logger.error(`Imagem NÃO gerada para "${tema}": ${erroFinal.message}`);
        return undefined;
      }
    }

    try {
      const item = resposta.data?.[0];
      if (!item) return undefined;

      // Uns modelos devolvem base64, outros URL. Os dois acabam no mesmo lugar.
      const bytes = item.b64_json
        ? Buffer.from(item.b64_json, 'base64')
        : Buffer.from(await (await fetch(item.url!)).arrayBuffer());

      const nome = `${randomUUID()}.${webp ? 'webp' : 'png'}`;
      await mkdir(IMAGE_DIR, { recursive: true });
      await writeFile(join(IMAGE_DIR, nome), bytes);
      return `/uploads/marketing/${nome}`;
    } catch (err: any) {
      this.logger.error(`Imagem gerada mas não gravada para "${tema}": ${err.message}`);
      return undefined;
    }
  }
}
