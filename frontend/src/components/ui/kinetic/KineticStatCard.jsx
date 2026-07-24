/**
 * KineticStatCard — Painel de Métricas Neumórfico 3D.
 * Números em JetBrains Mono, LED de status com iluminação glow e elevação tátil.
 *
 * Props:
 *  - value: string | number (valor principal monospaçado)
 *  - label: string (rótulo técnico uppercase)
 *  - bgNumber: string | number (número decorativo de fundo)
 *  - icon: componente React Icons (opcional)
 *  - ledColor: 'red' (Safety Orange) | 'green' (default 'red')
 *  - className: classes extras
 */
export default function KineticStatCard({
  value,
  label,
  bgNumber,
  icon: Icon,
  ledColor = 'red',
  className = '',
}) {
  const decorNumber = bgNumber ?? value;

  return (
    <div
      className={`relative bg-[#e0e5ec] rounded-2xl p-6 border border-white/60 shadow-[8px_8px_16px_#babecc,-8px_-8px_16px_#ffffff] transition-all duration-300 hover:-translate-y-1 hover:shadow-[12px_12px_24px_#babecc,-12px_-12px_24px_#ffffff] overflow-hidden group cursor-pointer ${className}`}
    >
      {/* LED Status Indicator no canto superior direito */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
        <span
          className={`w-2.5 h-2.5 rounded-full animate-pulse ${
            ledColor === 'green'
              ? 'bg-[#22c55e] shadow-[0_0_10px_2px_rgba(34,197,94,0.8)]'
              : 'bg-[#183757] shadow-[0_0_10px_2px_rgba(24,55,87,0.8)]'
          }`}
        />
      </div>

      {/* Número decorativo de fundo */}
      <span
        className="absolute -right-4 -bottom-4 font-mono text-[6rem] md:text-[7rem] font-bold leading-none select-none text-[#d1d9e6]/50 group-hover:text-[#183757]/10 transition-colors duration-300 pointer-events-none"
        aria-hidden="true"
      >
        {decorNumber}
      </span>

      {/* Conteúdo principal */}
      <div className="relative z-10">
        {Icon && (
          <div className="mb-3 text-[#183757] p-2.5 w-11 h-11 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#babecc,inset_-2px_-2px_5px_#ffffff] flex items-center justify-center">
            <Icon size={22} />
          </div>
        )}
        <p className="font-mono text-4xl md:text-5xl font-bold leading-none tracking-tight text-[#2d3436]">
          {value}
        </p>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest font-bold text-[#4a5568]">
          {label}
        </p>
      </div>
    </div>
  );
}
