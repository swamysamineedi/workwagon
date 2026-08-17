export default function Badge({ children, variant = 'muted', className = '' }) {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>;
}
