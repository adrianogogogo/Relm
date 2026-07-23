/**
 * NoiseTexture — filtro SVG feTurbulence que adiciona textura sutil de poster/print
 * sobre o fundo da página. Completamente decorativo, sem impacto em interatividade.
 *
 * Light mode: opacity 0.02 (mais sutil)
 * Dark mode: opacity 0.04 (ligeiramente mais visível)
 */
export default function NoiseTexture() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay dark:opacity-[0.04]"
      aria-hidden="true"
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <title>Textura decorativa de fundo</title>
        <filter id="kinetic-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#kinetic-noise)" />
      </svg>
    </div>
  );
}
