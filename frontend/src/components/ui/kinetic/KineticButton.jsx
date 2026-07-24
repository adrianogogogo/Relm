/**
 * KineticButton — botão brutalist com uppercase, tracking tight, cantos 0px.
 * Variantes: primary (filled), outline (border only), ghost (text only).
 *
 * Props:
 *  - variant: 'primary' | 'outline' | 'ghost' (default 'primary')
 *  - size: 'sm' | 'md' | 'lg' (default 'md')
 *  - icon: componente React Icons (opcional)
 *  - children: conteúdo/rótulo
 *  - className: classes extras
 *  - ...rest: type, onClick, disabled, etc.
 */
const SIZE_CLASSES = {
  sm: 'h-10 px-4 text-xs',
  md: 'h-14 px-8 text-sm',
  lg: 'h-20 px-12 text-base',
};

const VARIANT_CLASSES = {
  primary: `bg-[#2196F3] text-white
            hover:scale-105 active:scale-95
            border-2 border-[#2196F3]`,
  outline: `bg-transparent text-[#0D2137] dark:text-[#FAFAFA]
            border-2 border-[#0D2137] dark:border-[#334155]
            hover:bg-[#2196F3] hover:text-white dark:hover:bg-[#2196F3] dark:hover:text-white
            hover:border-[#2196F3] dark:hover:border-[#2196F3]`,
  ghost: `bg-transparent text-[#0D2137] dark:text-[#FAFAFA]
          border-2 border-transparent
          hover:text-[#2196F3] dark:hover:text-[#2196F3]`,
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
    'inline-flex items-center justify-center gap-2 rounded-none font-kinetic font-bold uppercase tracking-tighter transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const variantCls = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  const sizeCls = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <button className={`${base} ${variantCls} ${sizeCls} ${className}`} {...rest}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
}
