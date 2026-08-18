import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';

export default function RegisterShopPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    businessName: '', email: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.businessName.trim()) e.businessName = 'Business name is required';
    if (!form.email.trim())        e.email        = 'Email is required';
    if (!form.password)            e.password     = 'Password is required';
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
        role: 'shop',
        businessName: form.businessName,
      });
      navigate('/shop', { replace: true });
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
          Build your <span>dream team</span><br />on Work Wagon
        </h2>
        <p className="auth-tagline">
          Post real vacancies, manage slots, and connect with skilled workers
          who are actively looking for opportunities in your industry.
        </p>
        <div className="auth-flow">
          <div className="auth-flow-item">
            <div className="auth-flow-icon">🏢</div>
            <div className="auth-flow-text"><strong>Step 1</strong> — Register your business</div>
          </div>
          <div className="auth-flow-item">
            <div className="auth-flow-icon">📋</div>
            <div className="auth-flow-text"><strong>Step 2</strong> — Post vacancies with slot management</div>
          </div>
          <div className="auth-flow-item">
            <div className="auth-flow-icon">🤝</div>
            <div className="auth-flow-text"><strong>Step 3</strong> — Connect with the right workers</div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-header">
          <h1 className="auth-form-title">Create business account</h1>
          <p className="auth-form-sub">Register your business and start finding great workers</p>
        </div>

        {serverError && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <span>⚠️</span> {serverError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} id="register-shop-form">
          <FormField
            id="shop-business-name"
            label="Business name"
            placeholder="e.g. The Brew House Café"
            value={form.businessName}
            onChange={set('businessName')}
            error={errors.businessName}
            required
          />
          <FormField
            id="shop-email"
            label="Business email"
            type="email"
            placeholder="hello@yourbusiness.com"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            required
            autoComplete="email"
          />
          <FormField
            id="shop-password"
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
            id="shop-confirm-password"
            label="Confirm password"
            type="password"
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
          />
          <Button type="submit" variant="accent" size="lg" loading={loading} className="btn-full">
            {loading ? 'Creating account…' : 'Create Business Account'}
          </Button>
        </form>

        <div className="auth-form-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
          <p style={{ marginTop: '0.5rem' }}>
            Looking for work? <Link to="/register/worker">Register as a Worker</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
