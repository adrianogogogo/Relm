/**
 * KineticStatCard — card de KPI com número massivo e número decorativo de fundo.
 * Estilo brutalist: bordas 2px, cantos 0px, hover com inversão.
 *
 * Props:
 *  - value: string | number (valor principal oversized)
 *  - label: string (rótulo uppercase)
 *  - bgNumber: string | number (número decorativo de fundo — opcional, default = value)
 *  - icon: componente React Icons (opcional)
 *  - className: classes extras
 */
export default function KineticStatCard({
  value,
  label,
  bgNumber,
  icon: Icon,
  className = '',
}) {
  const decorNumber = bgNumber ?? value;

  return (
    <div
      className={`kinetic-card kinetic-card-hover group cursor-pointer relative ${className}`}
    >
      {/* Número decorativo de fundo */}
      <span
        className="absolute -right-4 -top-4 font-kinetic text-[6rem] md:text-[8rem] font-bold leading-none select-none
                   text-kinetic-muted dark:text-kinetic-muted-dark
                   group-hover:text-white/10 dark:group-hover:text-black/10
                   transition-colors duration-300 pointer-events-none"
        aria-hidden="true"
      >
        {decorNumber}
      </span>

      {/* Conteúdo principal */}
      <div className="relative z-10 font-kinetic">
        {Icon && (
          <div className="mb-3 text-[#09090B] dark:text-[#DFE104] group-hover:text-black transition-colors duration-200">
            <Icon size={24} />
          </div>
        )}
        <p
          className="font-kinetic text-5xl md:text-7xl font-bold leading-none tracking-tighter
                     text-[#09090B] dark:text-[#FAFAFA]
                     group-hover:text-black
                     transition-colors duration-200"
        >
          {value}
        </p>
        <p
          className="mt-2 font-kinetic text-xs uppercase tracking-widest font-bold
                     text-slate-600 dark:text-zinc-400
                     group-hover:text-black
                     transition-colors duration-200"
        >
          {label}
        </p>
      </div>
    </div>
  );
}
