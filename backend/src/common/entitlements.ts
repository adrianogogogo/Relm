import { TierLevel, ServiceType } from '@prisma/client';

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

/**
 * Cota anual de serviços de oficina por tipo, por tier (Wave 6).
 * FONTE ÚNICA — o workshop.service conta os pedidos do ano civil e compara aqui.
 * 0 = tipo não incluso no tier (bloqueado). Deck: Care = 1 revisão básica/ano;
 * Plus = várias revisões + lavagem + busca/entrega + fitting anual.
 * DIAGNOSTIC não tem cota (não faz parte do pacote incluso do deck) e é gateado
 * separadamente por completeRevision.
 */
export type WorkshopServiceType =
  | 'REVISION_BASIC'
  | 'REVISION_COMPLETE'
  | 'LAVAGEM_LUBRIFICACAO'
  | 'BUSCA_ENTREGA'
  | 'BIKE_FITTING';

export type ServiceAllowance = Record<WorkshopServiceType, number>;

export interface TierEntitlements {
  pointsMultiplier: number;
  concierge: boolean;
  completeRevision: boolean;
  delivery: boolean;
  prioritySlots: boolean;
  freeBasicRevisionsPerYear: number | null; // derivado da cota abaixo (compat frontend); null = ilimitado
  serviceAllowancePerYear: ServiceAllowance; // Wave 6 — cota anual por tipo
  renewalBonusPoints: number; // knob de negócio — calibrar
  // Pontos que renovam todo mês e NÃO acumulam (uso-ou-perde). Não há linha de
  // concessão no ledger: o saldo é DERIVADO (esta cota menos o consumido no mês
  // corrente), mesmo padrão do serviceAllowancePerYear acima.
  monthlyPoints: number;
}

export const ENTITLEMENTS: Record<TierLevel, TierEntitlements> = {
  CARE: {
    pointsMultiplier: 1,
    concierge: false,
    completeRevision: false,
    delivery: false,
    prioritySlots: false,
    freeBasicRevisionsPerYear: 1,
    serviceAllowancePerYear: {
      REVISION_BASIC: 1,
      REVISION_COMPLETE: 0,
      LAVAGEM_LUBRIFICACAO: 0,
      BUSCA_ENTREGA: 0,
      BIKE_FITTING: 0,
    },
    renewalBonusPoints: 0,
    monthlyPoints: 0, // saldo mensal é benefício exclusivo do Plus
  },
  PLUS: {
    pointsMultiplier: 2,
    concierge: true,
    completeRevision: true,
    delivery: true,
    prioritySlots: true,
    freeBasicRevisionsPerYear: null,
    serviceAllowancePerYear: {
      REVISION_BASIC: 2,
      REVISION_COMPLETE: 2,
      LAVAGEM_LUBRIFICACAO: 4,
      BUSCA_ENTREGA: 4,
      BIKE_FITTING: 1,
    },
    renewalBonusPoints: 500, // ponytail: valor ilustrativo, calibrar na estruturação
    // ponytail: 1000 pts ≈ R$50 a point_value_brl=0,05 — cobre ~1 lavagem/mês,
    // que foi o exemplo da reunião. Valor ilustrativo: o Adriano calibra pela
    // tela de configurações do clube (plus_monthly_points), sem deploy.
    monthlyPoints: 1000,
  },
};

/** Tipos de serviço que participam da cota anual (Wave 6). DIAGNOSTIC fora. */
export const ALLOWANCE_SERVICE_TYPES: WorkshopServiceType[] = [
  'REVISION_BASIC',
  'REVISION_COMPLETE',
  'LAVAGEM_LUBRIFICACAO',
  'BUSCA_ENTREGA',
  'BIKE_FITTING',
];

/** Rótulos PT-BR dos tipos de serviço (usados em mensagens do backend). */
export const SERVICE_TYPE_LABELS: Record<string, string> = {
  REVISION_BASIC: 'Revisão básica',
  REVISION_COMPLETE: 'Revisão completa',
  DIAGNOSTIC: 'Diagnóstico técnico',
  LAVAGEM_LUBRIFICACAO: 'Lavagem e lubrificação',
  BUSCA_ENTREGA: 'Busca e entrega',
  BIKE_FITTING: 'Bike fitting',
};

/** True se o tipo é gateado pela cota anual da matriz (Wave 6). */
export function isAllowanceType(type: ServiceType): type is ServiceType & WorkshopServiceType {
  return (ALLOWANCE_SERVICE_TYPES as string[]).includes(type as string);
}

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
