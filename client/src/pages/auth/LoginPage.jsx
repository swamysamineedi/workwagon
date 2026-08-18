import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const redirect = from || (user.role === 'worker' ? '/worker' : user.role === 'shop' ? '/shop' : '/admin');
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />

      {/* Brand panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">
          <div className="auth-brand-mark">W</div>
          <span className="auth-brand-name">Work Wagon</span>
        </div>
        <h2 className="auth-headline">
          Welcome<br />back to <span>Work Wagon</span>
        </h2>
        <p className="auth-tagline">
          Your employment network is waiting. Log in to access your dashboard,
          manage your profile, and discover new opportunities.
        </p>
        <div className="auth-flow">
          <div className="auth-flow-item">
            <div className="auth-flow-icon">🔍</div>
            <div className="auth-flow-text">
              <strong>Workers</strong> — Discover and apply to real job vacancies
            </div>
          </div>
          <div className="auth-flow-item">
            <div className="auth-flow-icon">🏢</div>
            <div className="auth-flow-text">
              <strong>Businesses</strong> — Post vacancies and find skilled workers
            </div>
          </div>
          <div className="auth-flow-item">
            <div className="auth-flow-icon">🤝</div>
            <div className="auth-flow-text">
              <strong>Both</strong> — Mutual connections mean the right fit every time
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-header">
          <h1 className="auth-form-title">Sign in</h1>
          <p className="auth-form-sub">Enter your credentials to access your account</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} id="login-form">
          <FormField
            id="login-email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
          />
          <FormField
            id="login-password"
            label="Password"
            type="password"
            placeholder="Your password"
            value={form.password}
            onChange={set('password')}
            required
            autoComplete="current-password"
          />
          <Button type="submit" variant="primary" size="lg" loading={loading} className="btn-full">
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <div className="auth-form-footer">
          <p>Don't have an account?{' '}
            <Link to="/register/worker">Join as a Worker</Link>
            {' · '}
            <Link to="/register/shop">Join as a Business</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
