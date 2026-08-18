import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function UnauthorizedPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚫</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.75rem' }}>
          Access Denied
        </h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem' }}>
          You don't have permission to access this page.
          This area may require a different account type.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/"><Button variant="primary">Go Home</Button></Link>
          <Link to="/login"><Button variant="secondary">Sign In</Button></Link>
        </div>
      </div>
    </div>
  );
}
