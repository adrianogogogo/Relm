/**
 * KineticButton — Botão Físico 3D (Physical Key §3).
 * Triggers táteis com elevação neumórfica, afundamento tátil ao clicar (active:translate-y-[2px])
 * e cor de acionamento Safety Orange (#ff4757).
 *
 * Props:
 *  - variant: 'primary' (Safety Orange) | 'outline' (Chassis) | 'ghost'
 *  - size: 'sm' | 'md' | 'lg' (default 'md')
 *  - icon: componente React Icons (opcional)
 *  - children: conteúdo/rótulo
 *  - className: classes extras
 *  - ...rest: type, onClick, disabled, etc.
 */
const SIZE_CLASSES = {
  sm: 'h-10 px-4 text-xs',
  md: 'h-12 px-6 text-sm',
  lg: 'h-16 px-10 text-base',
};

const VARIANT_CLASSES = {
  primary: `bg-[#ff4757] text-white font-bold
            shadow-[4px_4px_10px_rgba(166,50,60,0.35),-2px_-2px_6px_rgba(255,255,255,0.6)]
            hover:bg-[#ff6b81] hover:-translate-y-0.5
            active:translate-y-[2px] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.25),inset_-4px_-4px_8px_rgba(255,255,255,0.5)]
            border border-white/20`,
  outline: `bg-[#e0e5ec] text-[#2d3436] font-bold
            shadow-[4px_4px_8px_#babecc,-4px_-4px_8px_#ffffff]
            hover:text-[#ff4757] hover:shadow-[6px_6px_12px_#babecc,-6px_-6px_12px_#ffffff]
            active:translate-y-[2px] active:shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff]
            border border-white/50`,
  ghost: `bg-transparent text-[#2d3436] font-bold
          hover:bg-[#d1d9e6]/50 hover:text-[#ff4757]
          active:translate-y-[2px]`,
};

export default function KineticButton({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  className = '',
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-sans uppercase tracking-wider transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const variantCls = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  const sizeCls = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <button className={`${base} ${variantCls} ${sizeCls} ${className}`} {...rest}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
}
