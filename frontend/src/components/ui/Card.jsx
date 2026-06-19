/**
 * Card — wrapper simples que aplica o estilo padrao de card do design system
 * (rounded-xl, shadow-card, borda sutil, suporte a dark mode).
 *
 * Props:
 *  - children: conteudo do card
 *  - className: classes extras para extender/sobrescrever (ex.: "p-0", "h-full")
 *  - as: elemento/componente raiz (default: "div")
 *  - ...rest: demais props repassadas ao elemento raiz (onClick, etc.)
 */
export default function Card({ children, className = '', as: Component = 'div', ...rest }) {
  return (
    <Component className={`card ${className}`} {...rest}>
      {children}
    </Component>
  );
}
