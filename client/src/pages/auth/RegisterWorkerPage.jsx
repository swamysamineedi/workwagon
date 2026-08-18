import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';

export default function RegisterWorkerPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim())  e.lastName  = 'Last name is required';
    if (!form.email.trim())     e.email     = 'Email is required';
    if (!form.password)         e.password  = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        role: 'worker',
        firstName: form.firstName,
        lastName: form.lastName,
      });
      navigate('/worker', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />

      <div className="auth-brand-panel">
        <div className="auth-brand-logo">
          <div className="auth-brand-mark">W</div>
          <span className="auth-brand-name">Work Wagon</span>
        </div>
        <h2 className="auth-headline">
          Your next <span>opportunity</span><br />starts here
        </h2>
        <p className="auth-tagline">
          Create your worker profile in minutes. Showcase your skills,
          set your availability, and connect with businesses looking for
          someone exactly like you.
        </p>
        <div className="auth-flow">
          <div className="auth-flow-item">
            <div className="auth-flow-icon">✏️</div>
            <div className="auth-flow-text"><strong>Step 1</strong> — Create your account</div>
          </div>
          <div className="auth-flow-item">
            <div className="auth-flow-icon">👤</div>
            <div className="auth-flow-text"><strong>Step 2</strong> — Complete your profile with skills & availability</div>
          </div>
          <div className="auth-flow-item">
            <div className="auth-flow-icon">🔍</div>
            <div className="auth-flow-text"><strong>Step 3</strong> — Discover open vacancies near you</div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-header">
          <h1 className="auth-form-title">Create worker account</h1>
          <p className="auth-form-sub">Join as a worker and start discovering opportunities</p>
        </div>

        {serverError && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <span>⚠️</span> {serverError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} id="register-worker-form">
          <div className="grid-2" style={{ gap: '0.875rem' }}>
            <FormField
              id="worker-first-name"
              label="First name"
              placeholder="Jane"
              value={form.firstName}
              onChange={set('firstName')}
              error={errors.firstName}
              required
            />
            <FormField
              id="worker-last-name"
              label="Last name"
              placeholder="Smith"
              value={form.lastName}
              onChange={set('lastName')}
              error={errors.lastName}
              required
            />
          </div>
          <FormField
            id="worker-email"
            label="Email address"
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            required
            autoComplete="email"
          />
          <FormField
            id="worker-password"
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            required
            autoComplete="new-password"
          />
          <FormField
            id="worker-confirm-password"
            label="Confirm password"
            type="password"
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
          />
          <Button type="submit" variant="primary" size="lg" loading={loading} className="btn-full">
            {loading ? 'Creating account…' : 'Create Worker Account'}
          </Button>
        </form>

        <div className="auth-form-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
          <p style={{ marginTop: '0.5rem' }}>
            Hiring instead? <Link to="/register/shop">Register as a Business</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
