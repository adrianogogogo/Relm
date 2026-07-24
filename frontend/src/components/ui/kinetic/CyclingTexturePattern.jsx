import React from 'react';

/**
 * CyclingTexturePattern — Padronagem de Fundo Neumórfica em Baixo Relevo.
 * Elementos minimalistas de ciclismo (bicicletas, capacetes, rodas, engrenagens, elos de corrente, pedivelas)
 * gravados sutilmente no cinza #e0e5ec com relevo de luz e sombra a 45°.
 */
export default function CyclingTexturePattern({ className = '' }) {
  return (
    <div
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-[0.08] select-none ${className}`}
      aria-hidden="true"
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="cycling-neumorphic-pattern"
            width="280"
            height="280"
            patternUnits="userSpaceOnUse"
          >
            {/* Sombras neumórficas emparelhadas (offset 1.5px luz #fff, offset -1.5px sombra #8a9bb0) */}
            
            {/* 1. BICICLETA MINIMALISTA (X: 20, Y: 20) */}
            <g transform="translate(20, 20)">
              {/* Sombra de relevo */}
              <g fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(1.5, -1.5)">
                <circle cx="16" cy="32" r="12" />
                <circle cx="56" cy="32" r="12" />
                <path d="M16 32 L32 32 L44 14 L24 14 Z" />
                <path d="M32 32 L26 10 M22 10 H30" />
                <path d="M44 14 L56 32" />
                <path d="M44 14 L42 8 M38 8 H46" />
              </g>
              {/* Linha principal */}
              <g fill="none" stroke="#2d3436" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="16" cy="32" r="12" />
                <circle cx="56" cy="32" r="12" />
                <path d="M16 32 L32 32 L44 14 L24 14 Z" />
                <path d="M32 32 L26 10 M22 10 H30" />
                <path d="M44 14 L56 32" />
                <path d="M44 14 L42 8 M38 8 H46" />
              </g>
            </g>

            {/* 2. CAPACETE DE CICLISMO (X: 160, Y: 30) */}
            <g transform="translate(160, 30)">
              <g fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" transform="translate(1.5, -1.5)">
                <path d="M6 30 C 6 12, 22 4, 42 4 C 54 4, 62 12, 66 22 L 70 30 H 6 Z" />
                <path d="M18 12 L 26 26 M 34 8 L 40 26 M 50 10 L 52 26" />
              </g>
              <g fill="none" stroke="#2d3436" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 30 C 6 12, 22 4, 42 4 C 54 4, 62 12, 66 22 L 70 30 H 6 Z" />
                <path d="M18 12 L 26 26 M 34 8 L 40 26 M 50 10 L 52 26" />
              </g>
            </g>

            {/* 3. RODA E CATRACA COM RAIOS (X: 30, Y: 150) */}
            <g transform="translate(30, 150)">
              <g fill="none" stroke="#ffffff" strokeWidth="2.5" transform="translate(1.5, -1.5)">
                <circle cx="28" cy="28" r="24" />
                <circle cx="28" cy="28" r="6" />
                <path d="M28 4 V52 M4 28 H52 M11 11 L45 45 M11 45 L45 11" strokeDasharray="3 3" />
              </g>
              <g fill="none" stroke="#2d3436" strokeWidth="2.5">
                <circle cx="28" cy="28" r="24" />
                <circle cx="28" cy="28" r="6" />
                <path d="M28 4 V52 M4 28 H52 M11 11 L45 45 M11 45 L45 11" strokeDasharray="3 3" />
              </g>
            </g>

            {/* 4. COROA DE CICLISMO / CHAINRING (X: 170, Y: 140) */}
            <g transform="translate(170, 140)">
              <g fill="none" stroke="#ffffff" strokeWidth="2.5" transform="translate(1.5, -1.5)">
                <circle cx="30" cy="30" r="22" strokeDasharray="6 3" />
                <circle cx="30" cy="30" r="10" />
                <path d="M30 8 L30 52 M8 30 L52 30" />
              </g>
              <g fill="none" stroke="#2d3436" strokeWidth="2.5">
                <circle cx="30" cy="30" r="22" strokeDasharray="6 3" />
                <circle cx="30" cy="30" r="10" />
                <path d="M30 8 L30 52 M8 30 L52 30" />
              </g>
            </g>

            {/* 5. ELOS DE CORRENTE / CHAIN LINKS (X: 110, Y: 100) */}
            <g transform="translate(110, 100)">
              <g fill="none" stroke="#ffffff" strokeWidth="2.5" transform="translate(1.5, -1.5)">
                <rect x="4" y="10" width="22" height="14" rx="7" />
                <rect x="20" y="10" width="22" height="14" rx="7" />
                <circle cx="11" cy="17" r="3" />
                <circle cx="27" cy="17" r="3" />
              </g>
              <g fill="none" stroke="#2d3436" strokeWidth="2.5">
                <rect x="4" y="10" width="22" height="14" rx="7" />
                <rect x="20" y="10" width="22" height="14" rx="7" />
                <circle cx="11" cy="17" r="3" />
                <circle cx="27" cy="17" r="3" />
              </g>
            </g>

            {/* 6. CARAMANHOLA / SQUEEZE DE CICLISMO (X: 100, Y: 220) */}
            <g transform="translate(100, 220)">
              <g fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(1.5, -1.5)">
                <rect x="8" y="12" width="24" height="32" rx="4" />
                <path d="M14 6 H 26 V 12 H 14 Z" />
                <path d="M18 2 V 6" />
                <path d="M8 20 H 32" />
              </g>
              <g fill="none" stroke="#2d3436" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="8" y="12" width="24" height="32" rx="4" />
                <path d="M14 6 H 26 V 12 H 14 Z" />
                <path d="M18 2 V 6" />
                <path d="M8 20 H 32" />
              </g>
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cycling-neumorphic-pattern)" />
      </svg>
    </div>
  );
}
