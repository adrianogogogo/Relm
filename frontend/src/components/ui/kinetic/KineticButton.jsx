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
  primary: `bg-primary dark:bg-primary-400 text-white dark:text-kinetic-bg-dark
            hover:scale-105 active:scale-95
            border-2 border-primary dark:border-primary-400`,
  outline: `bg-transparent text-kinetic-fg dark:text-kinetic-fg-dark
            border-2 border-kinetic-border dark:border-kinetic-border-dark
            hover:bg-kinetic-fg hover:text-white dark:hover:bg-kinetic-fg-dark dark:hover:text-kinetic-bg-dark
            hover:border-kinetic-fg dark:hover:border-kinetic-fg-dark`,
  ghost: `bg-transparent text-kinetic-fg dark:text-kinetic-fg-dark
          border-2 border-transparent
          hover:text-primary dark:hover:text-primary-400`,
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
