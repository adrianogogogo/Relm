import Card from './Card';

/**
 * StatCard — card de KPI (§6.3 do design system).
 * Titulo pequeno, valor grande, subtitulo opcional e quadradinho de icone
 * com fundo na cor a ~15% de opacidade.
 *
 * Props:
 *  - title: string (obrigatorio) — rotulo do indicador (pt-BR)
 *  - value: string | number (obrigatorio) — valor grande
 *  - subtitle: string (opcional) — texto auxiliar abaixo do valor
 *  - icon: componente lucide-react (opcional) — ex.: Shield
 *  - color: string hex (default: '#1565C0') — cor do icone/valor
 *  - className: classes extras no card
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = '#1565C0',
  className = '',
}) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-3xl font-bold leading-tight" style={{ color }}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div
            className="stat-icon-box shrink-0 rounded-lg p-2.5"
            style={{ backgroundColor: `${color}26`, color }}
          >
            <Icon size={22} />
          </div>
        )}
      </div>
    </Card>
  );
}
