export default function FormField({
  label, id, type = 'text', error, hint, className = '',
  required, options, rows, placeholder, ...rest
}) {
  const inputCls = ['form-input', error && 'error', className].filter(Boolean).join(' ');

  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}{required && <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          id={id}
          className={`${inputCls} form-textarea`}
          rows={rows || 4}
          placeholder={placeholder}
          {...rest}
        />
      ) : type === 'select' ? (
        <select id={id} className={`${inputCls} form-select`} {...rest}>
          {placeholder && <option value="">{placeholder}</option>}
          {options?.map((o) => (
            typeof o === 'string'
              ? <option key={o} value={o}>{o}</option>
              : <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          className={inputCls}
          placeholder={placeholder}
          {...rest}
        />
      )}

      {error && <p className="form-error">{error}</p>}
      {hint && !error && <p className="form-hint">{hint}</p>}
    </div>
  );
}
