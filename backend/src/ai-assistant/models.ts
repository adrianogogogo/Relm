/**
 * Catálogo curado dos modelos oferecidos na tela de Configurações > IA.
 *
 * Por que curado e não lido da API: `GET /v1/models` devolve centenas de ids
 * (embeddings, áudio, moderação) sem nenhum campo que diga qual gera imagem ou
 * qual aceita structured output. Filtrar em runtime não é possível de forma
 * confiável, então a lista mora aqui e cresce por commit.
 *
 * Tamanho NÃO é configurável de propósito: hero de landing é horizontal, imagem
 * de e-mail precisa caber em 600px. É requisito do layout, não preferência — e
 * cada modelo aceita uma lista própria de tamanhos, então tirar isso da tela
 * também torna impossível salvar uma combinação que só falha na hora de gerar.
 */

export const TEXT_MODELS = ['gpt-4o-mini', 'gpt-4o'];
export const DEFAULT_TEXT_MODEL = 'gpt-4o-mini';

export type Destino = 'LANDING' | 'EMAIL';

type ImageModel = {
  /** Tamanho por destino — só valores que o próprio modelo aceita. */
  tamanho: Record<Destino, string>;
  /** null = o modelo não aceita o parâmetro `quality`; nem enviamos. */
  quality: { padrao: string; alta: string } | null;
};

// Sem dall-e: a API não serve mais nenhum `dall-e-*` — pedir devolve
// 400 "model does not exist", e como falha de imagem é não-fatal, a página saía
// sem imagem em silêncio. Catálogo errado aqui é invisível em produção; só
// entra modelo confirmado em `models.list()`.
export const IMAGE_MODELS: Record<string, ImageModel> = {
  'gpt-image-1': {
    tamanho: { LANDING: '1536x1024', EMAIL: '1024x1024' },
    quality: { padrao: 'medium', alta: 'high' },
  },
  // Mesmos parâmetros do irmão maior, mais barato. Opção de rascunho.
  'gpt-image-1-mini': {
    tamanho: { LANDING: '1536x1024', EMAIL: '1024x1024' },
    quality: { padrao: 'medium', alta: 'high' },
  },
};

export const DEFAULT_IMAGE_MODEL = 'gpt-image-1';
export const DEFAULT_IMAGE_QUALITY = 'padrao';
