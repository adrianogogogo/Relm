/**
 * PageHeader — cabecalho padrao de pagina interna (§7.1 do design system).
 * Titulo (+ subtitulo opcional) a esquerda; acao opcional a direita.
 *
 * Props:
 *  - title: string (obrigatorio) — titulo da pagina
 *  - subtitle: string | node (opcional) — texto auxiliar abaixo do titulo
 *  - action: node (opcional) — botao/elemento alinhado a direita
 *  - className: classes extras no container
 */
export default function PageHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-6 ${className}`}>
      <div className="min-w-0">
        <h1 className="font-title text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
