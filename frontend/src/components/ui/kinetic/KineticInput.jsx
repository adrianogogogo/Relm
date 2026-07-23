/**
 * KineticInput — input brutalist com border-bottom-2 only, texto oversized,
 * font Space Grotesk. Label integrado acima em uppercase tracking-widest.
 *
 * Props:
 *  - label: string (rótulo acima do input)
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
        <label className="kinetic-label">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <input
        className={`kinetic-input ${inputClassName}`}
        required={required}
        {...rest}
      />
    </div>
  );
}
