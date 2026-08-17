export default function Spinner({ size = 'md', className = '' }) {
  return <span className={`spinner spinner-${size} ${className}`} aria-label="Loading" />;
}

export function PageSpinner() {
  return (
    <div className="loading-page">
      <Spinner size="xl" />
    </div>
  );
}
