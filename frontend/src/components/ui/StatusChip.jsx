/**
 * StatusChip — pilula de status/prioridade/marca (convencao §2.6 do design system).
 * Fundo na cor a ~12% de opacidade (hex + '20') e texto na cor cheia.
 *
 * Uso (variante semantica):  <StatusChip label="Resolvido" variant="success" />
 * Uso (cor custom em hex):   <StatusChip label="Premium" color="#9C27B0" />
 *
 * Props:
 *  - label: string (obrigatorio) — texto da pilula (pt-BR)
 *  - variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' (default: 'neutral')
 *  - color: string hex (opcional) — quando informado, tem prioridade sobre variant
 *  - className: classes extras
 */
const VARIANT_HEX = {
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  neutral: '#666666',
};

export default function StatusChip({ label, variant = 'neutral', color, className = '' }) {
  const hex = color || VARIANT_HEX[variant] || VARIANT_HEX.neutral;
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold leading-none ${className}`}
      style={{ backgroundColor: `${hex}20`, color: hex }}
    >
      {label}
    </span>
  );
}
