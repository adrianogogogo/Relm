/**
 * Gera UMA landing de verdade contra a API — mesmo prompt, mesmo schema e mesma
 * geração de imagem que a plataforma usa — e grava o HTML para abrir no
 * navegador. Existe para responder "a peça sai mesmo com imagem?" com um
 * arquivo, e não com uma opinião.
 *
 * Não sobe o Nest e não toca o banco: os números do clube entram como valores de
 * exemplo. O que ele prova é a cadeia texto -> schema -> imagem -> render.
 *
 * Uso: npx ts-node gerar-landing-teste.ts "tema da campanha"
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import {
  PaginaGerada,
  RespostaModelo,
  paginaDeResposta,
  sanitizePagina,
  schemaDe,
} from './src/ai-design/blocks.schema';
import { montarSistema } from './src/ai-assistant/campanha-prompts';
import { renderLanding } from './src/ai-design/landing-renderer';
import { renderEmail } from './src/ai-design/email-renderer';
import {
  DEFAULT_IMAGE_MODEL,
  DEFAULT_TEXT_MODEL,
  getImageModelConfig,
} from './src/ai-assistant/models';

const TEMA = process.argv[2] || 'revisão de inverno para quem pedala na chuva';
const SAIDA = join(process.cwd(), '..', 'scratch', 'preview-real');

// Valores de exemplo. Na plataforma vêm do ClubSettings — aqui só alimentam o
// prompt para que o modelo não invente número.
const FATOS = {
  plusAnnualFee: 299,
  pointValueBrl: 0.05,
  referralBonusPoints: 500,
  birthdayBonusPoints: 200,
  eventParticipationPoints: 100,
  careQuotaAnnualRevisions: 1,
  plusPointsMultiplier: 2,
  plusMonthlyPoints: 1000,
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function gerarImagem(cena: string, i: number): Promise<string | undefined> {
  const modelo = getImageModelConfig(DEFAULT_IMAGE_MODEL);
  const prompt = `Fotografia realista de alta qualidade sobre ciclismo para a campanha "${TEMA}". ${cena} Luz natural, sem texto na imagem, sem logotipo.`;

  const chamar = (webp: boolean) =>
    openai.images.generate({
      model: DEFAULT_IMAGE_MODEL,
      prompt,
      n: 1,
      size: modelo.tamanho.LANDING,
      ...(modelo.quality ? { quality: modelo.quality.padrao } : {}),
      ...(webp ? { output_format: 'webp', output_compression: 80 } : {}),
    } as any);

  let webp = !!modelo.webp;
  let resposta;
  try {
    resposta = await chamar(webp);
  } catch (err: any) {
    if (!webp) {
      console.error(`  imagem ${i}: FALHOU - ${err.message}`);
      return undefined;
    }
    console.warn(`  imagem ${i}: modelo recusou WebP (${err.message}), repetindo em PNG`);
    webp = false;
    try {
      resposta = await chamar(false);
    } catch (e: any) {
      console.error(`  imagem ${i}: FALHOU - ${e.message}`);
      return undefined;
    }
  }

  const item = resposta.data?.[0];
  if (!item) return undefined;
  const bytes = item.b64_json
    ? Buffer.from(item.b64_json, 'base64')
    : Buffer.from(await (await fetch(item.url!)).arrayBuffer());

  const nome = `${randomUUID()}.${webp ? 'webp' : 'png'}`;
  writeFileSync(join(SAIDA, nome), bytes);
  console.log(`  imagem ${i}: ${nome} (${Math.round(bytes.length / 1024)} KB)`);
  return `./${nome}`;
}

async function main() {
  mkdirSync(SAIDA, { recursive: true });
  console.log(`Tema: "${TEMA}"\n1) texto...`);

  const completion = await openai.chat.completions.create({
    model: DEFAULT_TEXT_MODEL,
    messages: [
      { role: 'system', content: montarSistema('LANDING', FATOS) },
      { role: 'user', content: TEMA },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'pagina', strict: true, schema: schemaDe(false, false) },
    },
  } as any);

  const bruta = JSON.parse(completion.choices[0].message.content!) as RespostaModelo;
  console.log(`   campo "imagem" veio? ${bruta.imagem ? 'SIM' : 'NAO'}`);
  if (bruta.imagem) console.log(`   cena pedida: ${bruta.imagem.descricao}`);

  const pagina: PaginaGerada = sanitizePagina(paginaDeResposta(bruta));
  console.log(`   blocos: ${pagina.blocos.map((b) => b.tipo).join(' -> ')}\n2) imagens...`);

  const blocosImagem = pagina.blocos.filter((b) => b.tipo === 'imagem') as any[];
  const [heroi, ...doMeio] = await Promise.all([
    gerarImagem(`${pagina.subtitulo}. Cena de abertura, plano aberto.`, 0),
    ...blocosImagem.map((b, i) => gerarImagem(b.descricao, i + 1)),
  ]);

  pagina.imagemUrl = heroi;
  blocosImagem.forEach((b, i) => {
    b.url = doMeio[i];
  });

  // As fontes moram ao lado para o arquivo abrir por file:// com a tipografia
  // certa, igual ao render-preview.
  const fontes = join(SAIDA, 'fonts');
  mkdirSync(fontes, { recursive: true });
  for (const [pacote, arquivo] of [
    ['archivo', 'archivo-latin-wght-normal.woff2'],
    ['newsreader', 'newsreader-latin-wght-normal.woff2'],
  ] as const) {
    const origem = join(
      process.cwd(),
      'node_modules',
      '@fontsource-variable',
      pacote,
      'files',
      arquivo,
    );
    if (existsSync(origem)) copyFileSync(origem, join(fontes, arquivo));
  }

  writeFileSync(
    join(SAIDA, 'landing.html'),
    renderLanding(pagina, '.', { tradeName: 'Bike Tri', logoUrl: null }),
    'utf8',
  );
  writeFileSync(join(SAIDA, 'email.html'), renderEmail(pagina, '.'), 'utf8');

  const semImagem = !pagina.imagemUrl || blocosImagem.some((b) => !b.url);
  console.log(`\n${semImagem ? 'ATENCAO: alguma imagem faltou.' : 'Todas as imagens entraram.'}`);
  console.log(`Abra: ${join(SAIDA, 'landing.html')}`);
}

main().catch((e) => {
  console.error(`FALHOU: ${e.message}`);
  process.exit(1);
});
