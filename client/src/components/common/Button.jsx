export default function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, className = '', type = 'button', ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`btn btn-${variant} btn-${size} ${className}`}
      {...props}
    >
      {loading && <span className={`spinner spinner-sm`} style={{ marginRight: children ? '0.25rem' : 0 }} />}
      {children}
    </button>
  );
}
