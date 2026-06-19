/**
 * Button — botao do design system (§6.1).
 * Variantes: contained (primario) | outlined (secundario) | text (terciario).
 * Cores: primary | secondary | error | success.
 * Raio 8px (rounded-lg), peso 600, sem caixa alta.
 *
 * Props:
 *  - variant: 'contained' | 'outlined' | 'text' (default: 'contained')
 *  - color: 'primary' | 'secondary' | 'error' | 'success' (default: 'primary')
 *  - icon: componente lucide-react (opcional) — renderizado a esquerda do texto
 *  - children: conteudo/rotulo (pt-BR)
 *  - className: classes extras
 *  - ...rest: type, onClick, disabled, etc.
 */
const COLOR_STYLES = {
  primary: {
    contained: 'bg-primary hover:bg-primary-600 text-white dark:bg-primary-400 dark:hover:bg-primary-300 dark:text-app-dark',
    outlined: 'border-2 border-primary text-primary hover:bg-primary hover:text-white dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-400 dark:hover:text-app-dark',
    text: 'text-primary hover:bg-primary/10 dark:text-primary-400 dark:hover:bg-primary-400/10',
  },
  secondary: {
    contained: 'bg-secondary hover:bg-secondary-600 text-white',
    outlined: 'border-2 border-secondary text-secondary hover:bg-secondary hover:text-white dark:border-secondary-300 dark:text-secondary-200',
    text: 'text-secondary hover:bg-secondary/10 dark:text-secondary-200',
  },
  error: {
    contained: 'bg-error hover:bg-error-600 text-white',
    outlined: 'border-2 border-error text-error hover:bg-error hover:text-white',
    text: 'text-error hover:bg-error/10',
  },
  success: {
    contained: 'bg-success hover:bg-success-600 text-white',
    outlined: 'border-2 border-success text-success hover:bg-success hover:text-white',
    text: 'text-success hover:bg-success/10',
  },
};

export default function Button({
  variant = 'contained',
  color = 'primary',
  icon: Icon,
  children,
  className = '',
  ...rest
}) {
  const variantClasses =
    (COLOR_STYLES[color] && COLOR_STYLES[color][variant]) ||
    COLOR_STYLES.primary.contained;

  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button className={`${base} ${variantClasses} ${className}`} {...rest}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
}
