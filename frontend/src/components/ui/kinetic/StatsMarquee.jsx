import Marquee from 'react-fast-marquee';
import { useEffect, useState } from 'react';

/**
 * StatsMarquee — Visor de Telemetria Industrial Recuado (Level -1).
 * Faixa técnica em JetBrains Mono com ranhuras neumórficas afundadas e leds Safety Orange.
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
    <span className="mx-6 text-sm text-[#183757] font-bold select-none" aria-hidden="true">///</span>
  );

  const renderItem = (item, i) => (
    <span key={i} className="inline-flex items-center gap-3 mx-4">
      <span className="w-2 h-2 rounded-full bg-[#183757] shadow-[0_0_8px_rgba(24,55,87,0.8)]" />
      <span className="font-mono text-lg md:text-xl font-bold tracking-tight text-[#2d3436]">
        {item.value}
      </span>
      <span className="font-mono text-xs uppercase tracking-widest font-bold text-[#4a5568]">
        {item.label}
      </span>
      {separator}
    </span>
  );

  if (prefersReducedMotion) {
    return (
      <div
        className={`w-full py-3.5 px-6 bg-[#e0e5ec] text-[#2d3436] font-mono shadow-[inset_3px_3px_6px_#babecc,inset_-3px_-3px_6px_#ffffff] rounded-xl border border-white/40 overflow-hidden ${className}`}
      >
        <div className="flex flex-wrap items-center justify-center gap-6">
          {items.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#183757]" />
              <span className="font-mono text-base font-bold text-[#2d3436]">
                {item.value}
              </span>
              <span className="font-mono text-xs uppercase tracking-widest font-bold text-[#4a5568]">
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
      className={`w-full py-3.5 bg-[#e0e5ec] text-[#2d3436] font-mono shadow-[inset_3px_3px_6px_#babecc,inset_-3px_-3px_6px_#ffffff] rounded-xl border border-white/40 overflow-hidden ${className}`}
    >
      <Marquee speed={speed} gradient={false} autoFill>
        {items.map(renderItem)}
      </Marquee>
    </div>
  );
}
