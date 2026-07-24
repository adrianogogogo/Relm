/**
 * KineticInput — Poço Recuado Level -1 (Data Slot §3).
 * Sombra interna afundada (inset), fonte monospaçada JetBrains Mono e brilho de foco Azul Relm (#183757).
 *
 * Props:
 *  - label: string (rótulo técnico acima do input)
 *  - className: classes extras no wrapper
 *  - inputClassName: classes extras no <input>
 *  - required: boolean (mostra * no label)
 *  - ...rest: type, value, onChange, placeholder, etc.
 */
export default function KineticInput({
  label,
  className = '',
  inputClassName = '',
  required = false,
  ...rest
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block font-mono text-xs font-bold uppercase tracking-widest text-[#4a5568] mb-2">
          {label}
          {required && <span className="text-[#183757] ml-1">*</span>}
        </label>
      )}
      <input
        className={`w-full h-12 px-4 bg-[#e0e5ec] text-[#2d3436] font-mono text-sm font-medium rounded-xl border-none
                   shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff]
                   placeholder:text-[#a3b1c6]
                   focus:outline-none focus:shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff,0_0_0_2px_#183757]
                   transition-all duration-200 ${inputClassName}`}
        required={required}
        {...rest}
      />
    </div>
  );
}
