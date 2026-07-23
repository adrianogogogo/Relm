/**
 * KineticCard — card brutalist com bordas sharp 2px, cantos 0px, sem shadow.
 * Suporta hover dramático com inversão total de cores.
 *
 * Props:
 *  - children: conteúdo do card
 *  - hoverable: se true, aplica inversão de cor no hover (default false)
 *  - className: classes extras
 *  - as: elemento/componente raiz (default "div")
 *  - ...rest: demais props
 */
export default function KineticCard({
  children,
  hoverable = false,
  className = '',
  as: Component = 'div',
  ...rest
}) {
  const hoverClasses = hoverable
    ? 'group kinetic-card-hover cursor-pointer'
    : '';

  return (
    <Component
      className={`kinetic-card ${hoverClasses} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}
