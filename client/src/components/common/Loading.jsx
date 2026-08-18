export default function Loading({ text = 'Loading…' }) {
  return (
    <div className="loading-page">
      <span className="spinner spinner-lg" />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{text}</span>
    </div>
  );
}
