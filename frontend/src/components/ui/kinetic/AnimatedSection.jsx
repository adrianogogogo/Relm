import { motion, useReducedMotion } from 'framer-motion';

/**
 * AnimatedSection — wrapper que anima filhos com fade + scale ao entrar no viewport.
 * Respeita prefers-reduced-motion para acessibilidade.
 *
 * Props:
 *  - children: conteúdo a ser animado
 *  - delay: delay em segundos (default 0)
 *  - className: classes extras
 */
export default function AnimatedSection({ children, delay = 0, className = '' }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
