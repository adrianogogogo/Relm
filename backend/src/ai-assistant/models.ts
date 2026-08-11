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

export const TEXT_MODELS = [
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4o-2024-08-06',
  'gpt-4o-2024-11-20',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
  'o3-mini',
  'o1-mini',
  'o1',
];
export const DEFAULT_TEXT_MODEL = 'gpt-4o-mini';

export type Destino = 'LANDING' | 'EMAIL';

export type ImageModel = {
  /** Tamanho por destino — só valores que o próprio modelo aceita. */
  tamanho: Record<Destino, string>;
  /** null = o modelo não aceita o parâmetro `quality`; nem enviamos. */
  quality: { padrao: string; alta: string } | null;
};

export const IMAGE_MODELS: Record<string, ImageModel> = {
  'dall-e-3': {
    tamanho: { LANDING: '1024x1024', EMAIL: '1024x1024' },
    quality: { padrao: 'standard', alta: 'hd' },
  },
  'dall-e-2': {
    tamanho: { LANDING: '1024x1024', EMAIL: '1024x1024' },
    quality: null,
  },
  'gpt-image-1': {
    tamanho: { LANDING: '1536x1024', EMAIL: '1024x1024' },
    quality: { padrao: 'medium', alta: 'high' },
  },
  'gpt-image-1-mini': {
    tamanho: { LANDING: '1536x1024', EMAIL: '1024x1024' },
    quality: { padrao: 'medium', alta: 'high' },
  },
};

export const DEFAULT_IMAGE_MODEL = 'gpt-image-1';
export const DEFAULT_IMAGE_QUALITY = 'padrao';

/**
 * Retorna a configuração de tamanho e qualidade para qualquer modelo de imagem,
 * mesmo se for retornado dinamicamente da API OpenAI.
 */
export function getImageModelConfig(name: string): ImageModel {
  if (IMAGE_MODELS[name]) return IMAGE_MODELS[name];
  if (name && name.includes('dall-e-3')) {
    return { tamanho: { LANDING: '1024x1024', EMAIL: '1024x1024' }, quality: { padrao: 'standard', alta: 'hd' } };
  }
  return { tamanho: { LANDING: '1024x1024', EMAIL: '1024x1024' }, quality: null };
}
