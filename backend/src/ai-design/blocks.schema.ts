/**
 * Contrato único de blocos: a IA gera isto, a landing page renderiza isto e o
 * e-mail renderiza isto. Um schema, dois renderizadores.
 *
 * Por que blocos e não HTML: HTML livre em página pública é XSS e exigiria
 * sanitização; HTML de e-mail tem regra própria (tabela, CSS inline, nada de
 * flexbox) que o modelo erraria em silêncio. Com bloco fechado, o que o modelo
 * escolhe é conteúdo — a marcação é nossa.
 */

export type Paleta = {
  corPrimaria: string;
  corFundo: string;
  corTexto: string;
};

export type Bloco =
  | { tipo: 'hero'; titulo: string; subtitulo: string; ctaTexto: string; ctaUrl: string }
  | { tipo: 'texto'; titulo: string; corpo: string }
  | { tipo: 'lista'; titulo: string; itens: { titulo: string; descricao: string }[] }
  | { tipo: 'cta'; texto: string; ctaTexto: string; ctaUrl: string };

export type PaginaGerada = {
  titulo: string;
  subtitulo: string;
  paleta: Paleta;
  blocos: Bloco[];
};

// Sem bloco de imagem: o modelo não tem imagem para indicar e inventaria URL
// quebrada. Imagem entra depois, pela tela, quando a loja subir o arquivo.
const BLOCO_HERO = {
  type: 'object',
  properties: {
    tipo: { type: 'string', enum: ['hero'] },
    titulo: { type: 'string' },
    subtitulo: { type: 'string' },
    ctaTexto: { type: 'string' },
    ctaUrl: { type: 'string' },
  },
  required: ['tipo', 'titulo', 'subtitulo', 'ctaTexto', 'ctaUrl'],
  additionalProperties: false,
};

const BLOCO_TEXTO = {
  type: 'object',
  properties: {
    tipo: { type: 'string', enum: ['texto'] },
    titulo: { type: 'string' },
    corpo: { type: 'string' },
  },
  required: ['tipo', 'titulo', 'corpo'],
  additionalProperties: false,
};

const BLOCO_LISTA = {
  type: 'object',
  properties: {
    tipo: { type: 'string', enum: ['lista'] },
    titulo: { type: 'string' },
    itens: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          descricao: { type: 'string' },
        },
        required: ['titulo', 'descricao'],
        additionalProperties: false,
      },
    },
  },
  required: ['tipo', 'titulo', 'itens'],
  additionalProperties: false,
};

const BLOCO_CTA = {
  type: 'object',
  properties: {
    tipo: { type: 'string', enum: ['cta'] },
    texto: { type: 'string' },
    ctaTexto: { type: 'string' },
    ctaUrl: { type: 'string' },
  },
  required: ['tipo', 'texto', 'ctaTexto', 'ctaUrl'],
  additionalProperties: false,
};

/** JSON Schema do structured output — o modelo não consegue devolver outra forma. */
export const PAGINA_SCHEMA = {
  type: 'object',
  properties: {
    titulo: { type: 'string' },
    subtitulo: { type: 'string' },
    paleta: {
      type: 'object',
      properties: {
        corPrimaria: { type: 'string' },
        corFundo: { type: 'string' },
        corTexto: { type: 'string' },
      },
      required: ['corPrimaria', 'corFundo', 'corTexto'],
      additionalProperties: false,
    },
    blocos: {
      type: 'array',
      items: { anyOf: [BLOCO_HERO, BLOCO_TEXTO, BLOCO_LISTA, BLOCO_CTA] },
    },
  },
  required: ['titulo', 'subtitulo', 'paleta', 'blocos'],
  additionalProperties: false,
};

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * O structured output garante a FORMA, não o conteúdo. Cor entra em `style` e
 * URL entra em `href`, então os dois são validados aqui — é a fronteira entre
 * texto gerado por modelo e marcação renderizada no navegador do cliente.
 */
export function sanitizePagina(pagina: PaginaGerada): PaginaGerada {
  const cor = (valor: string, fallback: string) => (HEX.test(valor || '') ? valor : fallback);
  const url = (valor: string) => {
    // javascript:, data: e afins viram href inerte. Relativo é permitido para
    // apontar para as próprias telas do clube.
    if (!valor) return '#';
    if (valor.startsWith('/')) return valor;
    return /^https?:\/\//i.test(valor) ? valor : '#';
  };

  return {
    ...pagina,
    paleta: {
      corPrimaria: cor(pagina.paleta?.corPrimaria, '#2196F3'),
      corFundo: cor(pagina.paleta?.corFundo, '#FFFFFF'),
      corTexto: cor(pagina.paleta?.corTexto, '#0A1929'),
    },
    blocos: (pagina.blocos || []).map((bloco) =>
      'ctaUrl' in bloco ? { ...bloco, ctaUrl: url(bloco.ctaUrl) } : bloco,
    ),
  };
}
