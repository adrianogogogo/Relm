import { motion, useReducedMotion } from 'framer-motion';

/**
 * KineticPageHeader — header de perfil oversized com tipografia agressiva.
 * Nome do usuário/loja em escala grande, avatar com iniciais, subtítulo muted.
 *
 * Props:
 *  - name: string (nome principal oversized)
 *  - subtitle: string (email, cargo, etc.)
 *  - badge: string (ex: "Cliente desde 2024")
 *  - initial: string (letra para o avatar — derivada de name se omitida)
 *  - className: classes extras
 */
export default function KineticPageHeader({
  name,
  subtitle,
  badge,
  initial,
  className = '',
}) {
  const shouldReduceMotion = useReducedMotion();
  const avatarLetter = initial || name?.charAt(0)?.toUpperCase() || '?';

  const containerVariants = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
      };

  const nameVariants = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, x: -30 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] },
      };

  const MotionOrDiv = shouldReduceMotion ? 'div' : motion.div;

  return (
    <MotionOrDiv
      className={`flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-8 ${className}`}
      {...containerVariants}
    >
      {/* Avatar oversized */}
      <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 border-2 border-kinetic-border dark:border-kinetic-border-dark bg-primary/10 dark:bg-primary-400/15 flex items-center justify-center font-kinetic text-3xl md:text-4xl font-bold text-primary dark:text-primary-400 uppercase">
        {avatarLetter}
      </div>

      {/* Bloco de texto */}
      <div className="min-w-0 flex-1">
        <MotionOrDiv {...nameVariants}>
          <h1 className="font-kinetic text-4xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tighter leading-none text-kinetic-fg dark:text-kinetic-fg-dark">
            {name}
          </h1>
        </MotionOrDiv>

        {subtitle && (
          <p className="mt-2 font-kinetic text-lg md:text-xl text-kinetic-fg-muted dark:text-kinetic-fg-muted-dark tracking-tight">
            {subtitle}
          </p>
        )}

        {badge && (
          <span className="inline-block mt-3 px-4 py-1.5 border-2 border-kinetic-border dark:border-kinetic-border-dark font-kinetic text-xs uppercase tracking-widest font-medium text-kinetic-fg-muted dark:text-kinetic-fg-muted-dark">
            {badge}
          </span>
        )}
      </div>
    </MotionOrDiv>
  );
}
