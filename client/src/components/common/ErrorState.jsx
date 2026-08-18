import Button from './Button';

export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="empty-state fade-in">
      <div className="empty-state-icon">⚠️</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="btn" style={{ marginTop: '1rem' }}>
          Try again
        </Button>
      )}
    </div>
  );
}
