import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { shopService } from '../../services/shopService';
import { vacancyService } from '../../services/vacancyService';
import Avatar from '../../components/common/Avatar';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';

export default function ShopDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      shopService.getMyProfile(),
      vacancyService.getMyVacancies({ limit: 5 }),
    ])
      .then(([pRes, vRes]) => {
        setProfile(pRes.data.data.profile);
        setVacancies(vRes.data.data.vacancies || []);
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const name = profile?.businessName || user?.email?.split('@')[0] || 'Business';
  const completeness = profile?.profileCompleteness ?? 0;
  const openVacancies = vacancies.filter((v) => v.status === 'open');
  const totalSlots = vacancies.reduce((s, v) => s + (v.totalSlots || 0), 0);
  const filledSlots = vacancies.reduce((s, v) => s + (v.filledSlots || 0), 0);

  const STATUS_VARIANTS = { open: 'success', paused: 'warning', closed: 'muted', filled: 'primary', expired: 'error' };

  return (
    <div className="page fade-in">
      {/* Hero */}
      <div className="page-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--r)',
            background: 'var(--primary-glow)', border: '1px solid var(--primary-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
          }}>🏢</div>
          <div style={{ flex: 1 }}>
            <h2 className="page-hero-title">{name}</h2>
            <p className="page-hero-sub">
              {profile?.industry || 'Business'} · {profile?.location?.city || 'Location not set'}
              {profile?.verificationStatus === 'APPROVED' && <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>✓ Verified</span>}
            </p>
          </div>
          <Link to="/shop/profile">
            <button className="btn btn-secondary btn-sm">Edit Profile</button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 section">
        <div className="stat-card">
          <div className="stat-value">{vacancies.length}</div>
          <div className="stat-label">Total Vacancies</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{openVacancies.length}</div>
          <div className="stat-label">Active Vacancies</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{filledSlots}</div>
          <div className="stat-label">Slots Filled</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--primary-light)' }}>{Math.max(0, totalSlots - filledSlots)}</div>
          <div className="stat-label">Slots Available</div>
        </div>
      </div>

      {/* Profile completeness */}
      {completeness < 80 && (
        <div className="completeness-banner section">
          <div className="completeness-score">{completeness}%</div>
          <div className="completeness-info">
            <div className="completeness-label">Complete your business profile to attract more workers</div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${completeness}%` }} />
            </div>
          </div>
          <Link to="/shop/profile">
            <button className="btn btn-primary btn-sm">Complete Profile</button>
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Quick Actions</h3>
        </div>
        <div className="grid-3">
          <Link to="/shop/vacancies/new" className="quick-action">
            <div className="quick-action-icon">➕</div>
            <div className="quick-action-title">Post a Vacancy</div>
            <div className="quick-action-sub">Create a new job listing with slot management</div>
          </Link>
          <Link to="/shop/vacancies" className="quick-action">
            <div className="quick-action-icon">📋</div>
            <div className="quick-action-title">Manage Vacancies</div>
            <div className="quick-action-sub">View, edit, pause, or close your listings</div>
          </Link>
          <Link to="/shop/find-workers" className="quick-action">
            <div className="quick-action-icon">🔍</div>
            <div className="quick-action-title">Find Workers</div>
            <div className="quick-action-sub">Browse available workers by skill and location</div>
          </Link>
        </div>
      </div>

      {/* Recent vacancies */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Recent Vacancies</h3>
          <Link to="/shop/vacancies" style={{ fontSize: '0.8rem', color: 'var(--primary-light)' }}>View all →</Link>
        </div>
        {vacancies.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.875rem' }}>📋</div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No vacancies yet. Post your first job listing!</p>
            <Link to="/shop/vacancies/new">
              <button className="btn btn-primary">Post a Vacancy</button>
            </Link>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {vacancies.map((v, i) => {
              const available = Math.max(0, (v.totalSlots || 0) - (v.filledSlots || 0));
              return (
                <div key={v._id} style={{
                  padding: '1rem 1.25rem',
                  borderBottom: i < vacancies.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.2rem' }}>{v.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {v.category} · {available} slot{available !== 1 ? 's' : ''} available of {v.totalSlots}
                    </div>
                  </div>
                  <span className={`badge badge-${STATUS_VARIANTS[v.status] || 'muted'}`}>{v.status}</span>
                  <Link to={`/shop/vacancies/${v._id}/edit`}>
                    <button className="btn btn-ghost btn-sm">Edit</button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
