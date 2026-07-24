/**
 * KineticCard — Card Neumórfico Industrial 3D (§3 Industrial Realism).
 * Placa metálica/plástica de chassis elevado com parafusos radiais nos cantos e aletas de ventilação.
 *
 * Props:
 *  - children: conteúdo do card
 *  - hoverable: se true, aplica elevação tátil ao hover (default true)
 *  - screws: boolean (exibe parafusos radiais nos cantos, default true)
 *  - vents: boolean (exibe aletas de ventilação no canto superior direito, default true)
 *  - className: classes extras
 *  - as: elemento/componente raiz (default "div")
 *  - ...rest: demais props
 */
export default function KineticCard({
  children,
  hoverable = true,
  screws = true,
  vents = true,
  className = '',
  as: Component = 'div',
  ...rest
}) {
  const hoverClasses = hoverable
    ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-[12px_12px_24px_#babecc,-12px_-12px_24px_#ffffff] dark:hover:shadow-[12px_12px_24px_#12161b,-12px_-12px_24px_#262c35]'
    : '';

  return (
    <Component
      className={`relative bg-[#e0e5ec] dark:bg-[#1c2128] rounded-2xl p-6 md:p-8 border border-white/60 dark:border-white/10 shadow-[8px_8px_16px_#babecc,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#12161b,-8px_-8px_16px_#262c35] text-[#2d3436] dark:text-[#f0f2f5] ${hoverClasses} ${className}`}
      {...rest}
    >
      {/* Parafusos radiais nos 4 cantos */}
      {screws && (
        <>
          <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-[#d1d9e6] dark:bg-[#12161b] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3),1px_1px_1px_#fff] dark:shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] pointer-events-none" />
          <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#d1d9e6] dark:bg-[#12161b] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3),1px_1px_1px_#fff] dark:shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-2.5 h-2.5 rounded-full bg-[#d1d9e6] dark:bg-[#12161b] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3),1px_1px_1px_#fff] dark:shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full bg-[#d1d9e6] dark:bg-[#12161b] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3),1px_1px_1px_#fff] dark:shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] pointer-events-none" />
        </>
      )}

      {/* Aletas de ventilação mecânicas no canto superior direito */}
      {vents && (
        <div className="absolute top-4 right-8 flex gap-1 pointer-events-none opacity-60">
          <div className="h-4 w-1 rounded-full bg-[#d1d9e6] dark:bg-[#12161b] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.25)]" />
          <div className="h-4 w-1 rounded-full bg-[#d1d9e6] dark:bg-[#12161b] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.25)]" />
          <div className="h-4 w-1 rounded-full bg-[#d1d9e6] dark:bg-[#12161b] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.25)]" />
        </div>
      )}

      {children}
    </Component>
  );
}
