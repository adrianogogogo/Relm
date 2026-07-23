import Marquee from 'react-fast-marquee';
import { useEffect, useState } from 'react';

/**
 * StatsMarquee — faixa animada infinita com estatísticas do perfil.
 * Usa react-fast-marquee para scroll GPU-accelerated.
 * Respeita prefers-reduced-motion (exibe grid estático como fallback).
 *
 * Props:
 *  - items: Array<{ value: string|number, label: string }>
 *  - speed: number (default 60)
 *  - className: classes extras no container
 */
export default function StatsMarquee({ items = [], speed = 60, className = '' }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!items.length) return null;

  const separator = (
    <span className="mx-6 text-2xl opacity-40 select-none" aria-hidden="true">◆</span>
  );

  const renderItem = (item, i) => (
    <span key={i} className="inline-flex items-baseline gap-3 mx-4">
      <span className="font-kinetic text-2xl md:text-3xl font-bold tracking-tighter">
        {item.value}
      </span>
      <span className="font-kinetic text-xs md:text-sm uppercase tracking-widest font-medium opacity-80">
        {item.label}
      </span>
      {separator}
    </span>
  );

  // Fallback estático para prefers-reduced-motion
  if (prefersReducedMotion) {
    return (
      <div
        className={`w-full py-4 px-6 bg-[#DFE104] text-black overflow-hidden font-kinetic ${className}`}
      >
        <div className="flex flex-wrap items-center justify-center gap-4">
          {items.map((item, i) => (
            <span key={i} className="inline-flex items-baseline gap-2">
              <span className="font-kinetic text-xl font-bold tracking-tighter">
                {item.value}
              </span>
              <span className="font-kinetic text-xs uppercase tracking-widest font-medium opacity-80">
                {item.label}
              </span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full py-4 bg-[#DFE104] text-black overflow-hidden font-kinetic ${className}`}
    >
      <Marquee speed={speed} gradient={false} autoFill>
        {items.map(renderItem)}
      </Marquee>
    </div>
  );
}
