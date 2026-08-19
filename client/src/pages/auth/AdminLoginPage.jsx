import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';

export default function AdminLoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

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
      
      if (user.role !== 'admin') {
        logout();
        setError('Access denied. This portal is for administrators only.');
        setLoading(false);
        return;
      }
      
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />

      {/* Brand panel (Admin variation) */}
      <div className="auth-brand-panel" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="auth-brand-logo">
          <div className="auth-brand-mark" style={{ backgroundColor: 'var(--primary-dark)' }}>W</div>
          <span className="auth-brand-name">Work Wagon</span>
        </div>
        <h2 className="auth-headline">
          Platform Management<br /><span>Admin Portal</span>
        </h2>
        <p className="auth-tagline">
          Secure area for platform administrators to manage users, moderate vacancies, and handle reports.
        </p>
      </div>

      {/* Form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-header">
          <h1 className="auth-form-title">Admin Login</h1>
          <p className="auth-form-sub">Enter your administrator credentials to access the portal</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} id="admin-login-form">
          <FormField
            id="admin-email"
            label="Admin Email"
            type="email"
            placeholder="admin@workwagon.local"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
          />
          <FormField
            id="admin-password"
            label="Password"
            type="password"
            placeholder="Your password"
            value={form.password}
            onChange={set('password')}
            required
            autoComplete="current-password"
          />
          <Button type="submit" variant="primary" size="lg" loading={loading} className="btn-full" style={{ backgroundColor: 'var(--primary-dark)' }}>
            {loading ? 'Authenticating…' : 'Login'}
          </Button>
        </form>

        <div className="auth-form-footer">
          <p>
            <Link to="/">← Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
