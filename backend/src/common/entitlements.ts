import { TierLevel } from '@prisma/client';

// Ordem dos tiers (crescente). Usado por tierAtLeast para comparação.
const TIER_ORDER: Record<TierLevel, number> = {
  CARE: 0,
  PLUS: 1,
};

/**
 * Retorna true se customerTier >= requiredTier.
 * Fonte única de comparação de tiers — não usar === 'PLUS' solto no código.
 */
export function tierAtLeast(customerTier: TierLevel, requiredTier: TierLevel): boolean {
  return TIER_ORDER[customerTier] >= TIER_ORDER[requiredTier];
}

/**
 * Fonte ÚNICA de verdade dos direitos por tier. Alimenta os dois lados:
 * - Enforcement: os services leem ENTITLEMENTS[tier].<knob> (nunca `=== PLUS` solto).
 * - Informar: TIER_COMPARISON gera a tabela comparativa pública.
 * ponytail: const em código, não tabela no banco. Vira DB só se um não-dev
 * precisar editar ao vivo.
 */

export interface TierEntitlements {
  pointsMultiplier: number;
  concierge: boolean;
  completeRevision: boolean;
  delivery: boolean;
  prioritySlots: boolean;
  freeBasicRevisionsPerYear: number | null; // null = ilimitado
  renewalBonusPoints: number; // knob de negócio — calibrar
}

export const ENTITLEMENTS: Record<TierLevel, TierEntitlements> = {
  CARE: {
    pointsMultiplier: 1,
    concierge: false,
    completeRevision: false,
    delivery: false,
    prioritySlots: false,
    freeBasicRevisionsPerYear: 1,
    renewalBonusPoints: 0,
  },
  PLUS: {
    pointsMultiplier: 2,
    concierge: true,
    completeRevision: true,
    delivery: true,
    prioritySlots: true,
    freeBasicRevisionsPerYear: null,
    renewalBonusPoints: 500, // ponytail: valor ilustrativo, calibrar na estruturação
  },
};

// 'system' = este sistema barra/libera. 'external' = ERP/seguradora/pagamento
// executa; aqui só registramos o direito. 'display' = informativo (ainda não gateado).
export type Enforcement = 'system' | 'external' | 'display';

export interface ComparisonRow {
  label: string;
  care: string;
  plus: string;
  enforcement: Enforcement;
}

export const TIER_COMPARISON: ComparisonRow[] = [
  { label: 'Elegibilidade', care: 'Clientes atuais (automático)', plus: 'Compradores de bike (1º ano) + upgrade', enforcement: 'system' },
  { label: 'Custo', care: 'Gratuito', plus: 'Anuidade < seguro avulso', enforcement: 'external' },
  { label: 'Seguro da bike (1 ano)', care: '—', plus: 'Incluso', enforcement: 'external' },
  { label: 'Desconto em produtos', care: 'Preço de membro', plus: 'Preço de membro ampliado', enforcement: 'external' },
  { label: 'RELM Pontos', care: '1x', plus: '2x', enforcement: 'system' },
  { label: 'Revisões inclusas / ano', care: '1 básica', plus: 'Várias + busca e entrega', enforcement: 'system' },
  { label: 'Eventos e pedais', care: 'Preço de membro', plus: 'Acesso prioritário / gratuito', enforcement: 'display' },
  { label: 'Pré-venda de exclusivos', care: 'Antecipada', plus: 'Antecipada + preço exclusivo', enforcement: 'display' },
  { label: 'Concierge WhatsApp', care: '—', plus: 'Incluso', enforcement: 'system' },
  { label: 'Bônus de renovação', care: '—', plus: 'Pontos extras', enforcement: 'system' },
];
