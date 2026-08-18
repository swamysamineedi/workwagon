export default function Button({
  children, variant = 'primary', size = '', loading = false,
  className = '', type = 'button', disabled, onClick, ...rest
}) {
  const cls = ['btn', `btn-${variant}`, size && `btn-${size}`, className]
    .filter(Boolean).join(' ');
  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading && <span className="spinner spinner-sm" />}
      {children}
    </button>
  );
}
