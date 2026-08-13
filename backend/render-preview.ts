/**
 * Prévia local das peças de campanha, sem banco e sem chamar a OpenAI.
 * Renderiza a landing e o e-mail com um conteúdo de exemplo e copia as fontes
 * para o lado, de modo que o arquivo abra por file:// com a tipografia certa.
 *
 * Existe para a decisão 12 da entrevista de design: screenshot em 375px e
 * 1280px antes de aprovar variante. Não faz parte do build — rode com
 * `npx ts-node render-preview.ts` e abra a pasta indicada no fim.
 */
import { mkdirSync, copyFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { renderLanding } from './src/ai-design/landing-renderer';
import { renderEmail } from './src/ai-design/email-renderer';
import { PaginaGerada } from './src/ai-design/blocks.schema';

const SAIDA = join(process.cwd(), '..', 'scratch', 'preview');
const FONTES = join(SAIDA, 'fonts');

const PAGINA: PaginaGerada = {
  titulo: 'Revisão de inverno',
  subtitulo: 'Sua bike pronta para encarar a chuva',
  paleta: { corPrimaria: '#1B4965', corFundo: '#FFFFFF', corTexto: '#0A1929' },
  email: {
    assuntos: ['Sua bike aguenta o inverno?'],
    preheader: 'Revisão completa com desconto até o fim do mês',
  },
  blocos: [
    {
      tipo: 'hero',
      titulo: 'O inverno não avisa. Sua bike, sim.',
      subtitulo: 'Revisão completa nas lojas parceiras, com desconto para o clube.',
      ctaTexto: 'Agendar revisão',
      ctaUrl: '/clube',
    },
    {
      tipo: 'texto',
      titulo: 'Por que revisar agora',
      corpo:
        'Chuva e frio castigam transmissão, freio e rolamento. Uma revisão antes da temporada custa menos que uma troca depois dela.',
    },
    {
      tipo: 'lista',
      titulo: 'O que entra na revisão',
      itens: [
        { titulo: 'Transmissão', descricao: 'Limpeza, lubrificação e ajuste de câmbio.' },
        { titulo: 'Freios', descricao: 'Conferência de pastilhas e sangria quando necessário.' },
        { titulo: 'Rodas', descricao: 'Alinhamento e verificação de rolamento.' },
      ],
    },
    {
      tipo: 'imagem',
      descricao: 'mecânica ajustando o câmbio traseiro numa bancada de oficina',
      legenda: 'Ajuste de câmbio: dez minutos na bancada, uma temporada sem barulho.',
    },
    {
      tipo: 'prova',
      citacao: 'Fiz a revisão em maio e passei o inverno inteiro sem parar na estrada.',
      autor: 'Exemplo de depoimento',
      papel: 'conteúdo de teste, não publicar',
      inventado: true,
    },
    {
      tipo: 'faq',
      titulo: 'Dúvidas',
      itens: [
        { pergunta: 'Quanto tempo leva?', resposta: 'Em média um dia útil na loja parceira.' },
        { pergunta: 'Preciso agendar?', resposta: 'Sim, pelo painel do clube ou direto na loja.' },
      ],
    },
    {
      tipo: 'cta',
      texto: 'Garanta sua vaga antes do pico da temporada.',
      ctaTexto: 'Agendar agora',
      ctaUrl: '/clube',
    },
  ],
};

const LOJA = { tradeName: 'Bike Tri', logoUrl: null };

// Usa uma imagem real de campanha anterior. Prévia sem imagem mente: mostra uma
// página que o gerador nunca produz de propósito.
function imagensReais(): string[] {
  const dir = join(process.cwd(), 'uploads', 'marketing');
  const pngs = readdirSync(dir)
    .filter((f) => f.endsWith('.png'))
    .slice(0, 2);
  return pngs.map((png, i) => {
    const nome = `img-${i}.png`;
    copyFileSync(join(dir, png), join(SAIDA, nome));
    return `./${nome}`;
  });
}

mkdirSync(FONTES, { recursive: true });
for (const [pacote, arquivo] of [
  ['archivo', 'archivo-latin-wght-normal.woff2'],
  ['newsreader', 'newsreader-latin-wght-normal.woff2'],
] as const) {
  copyFileSync(
    join(process.cwd(), 'node_modules', '@fontsource-variable', pacote, 'files', arquivo),
    join(FONTES, arquivo),
  );
}

// baseUrl '.' deixa o @font-face relativo ao arquivo — assim abre por file://
// sem servidor. Em produção o baseUrl é a URL pública e aponta para /fonts.
// Preenche as URLs como o backend faz depois da geração — o modelo nunca as
// devolve, então prévia que as deixa vazias mostra uma página que não existe.
const [heroi, doMeio] = imagensReais();
const COM_IMAGEM: PaginaGerada = {
  ...PAGINA,
  imagemUrl: heroi,
  blocos: PAGINA.blocos.map((b) => (b.tipo === 'imagem' ? { ...b, url: doMeio } : b)),
};

writeFileSync(join(SAIDA, 'landing.html'), renderLanding(COM_IMAGEM, '.', LOJA), 'utf8');
writeFileSync(join(SAIDA, 'email.html'), renderEmail(COM_IMAGEM, '.'), 'utf8');

console.log(`Previa gravada em ${SAIDA}`);
