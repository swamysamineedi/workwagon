export default function FormField({ label, error, hint, required, children, id }) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}{required && <span style={{ color: 'var(--error)', marginLeft: 3 }}>*</span>}
        </label>
      )}
      {children}
      {error && <p className="form-error">{error}</p>}
      {hint && !error && <p className="form-hint">{hint}</p>}
    </div>
  );
}
