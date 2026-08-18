import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { workerService } from '../../services/workerService';
import { vacancyService } from '../../services/vacancyService';
import Avatar from '../../components/common/Avatar';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import VacancyCard from '../../components/vacancy/VacancyCard';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      workerService.getMyProfile(),
      vacancyService.browse({ limit: 6 }),
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

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : user?.email?.split('@')[0] || 'Worker';

  const completeness = profile?.profileCompleteness ?? 0;
  const isAvailable = profile?.availability?.isAvailable ?? true;

  return (
    <div className="page fade-in">
      {/* Welcome hero */}
      <div className="page-hero" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Avatar name={displayName} src={profile?.avatarUrl} size="lg" />
          <div style={{ flex: 1 }}>
            <h2 className="page-hero-title">Welcome back, {profile?.firstName || displayName}! 👋</h2>
            <p className="page-hero-sub">{user?.email}</p>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className={`badge ${isAvailable ? 'badge-success' : 'badge-muted'}`}>
                {isAvailable ? '🟢 Available for work' : '🔴 Not available'}
              </span>
              {profile?.availability?.preferredHours && (
                <span className="badge badge-primary">{profile.availability.preferredHours}</span>
              )}
            </div>
          </div>
          <Link to="/worker/profile">
            <button className="btn btn-secondary btn-sm">Edit Profile</button>
          </Link>
        </div>
      </div>

      {/* Profile completeness */}
      {completeness < 80 && (
        <div className="completeness-banner" style={{ marginBottom: '1.75rem' }}>
          <div className="completeness-score">{completeness}%</div>
          <div className="completeness-info">
            <div className="completeness-label">Profile completeness — employers see complete profiles first</div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${completeness}%` }} />
            </div>
          </div>
          <Link to="/worker/profile">
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
          <Link to="/worker/jobs" className="quick-action">
            <div className="quick-action-icon">🔍</div>
            <div className="quick-action-title">Discover Jobs</div>
            <div className="quick-action-sub">Browse open vacancies that match your skills</div>
          </Link>
          <Link to="/worker/profile" className="quick-action">
            <div className="quick-action-icon">✏️</div>
            <div className="quick-action-title">Update Profile</div>
            <div className="quick-action-sub">Keep your skills and availability current</div>
          </Link>
          <div
            className="quick-action"
            style={{ opacity: 0.6, cursor: 'default' }}
            title="Coming in next phase"
          >
            <div className="quick-action-icon">🤝</div>
            <div className="quick-action-title">Connections</div>
            <div className="quick-action-sub">View and manage your work connections</div>
          </div>
        </div>
      </div>

      {/* Profile snapshot */}
      {profile && (
        <div className="section">
          <div className="section-header">
            <h3 className="section-title">Your Profile Snapshot</h3>
            <Link to="/worker/profile" style={{ fontSize: '0.8rem', color: 'var(--primary-light)' }}>
              Edit →
            </Link>
          </div>
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div>
                <div className="section-sub" style={{ marginBottom: '0.5rem' }}>Skills</div>
                {profile.skills?.length > 0 ? (
                  <div className="tags-row">
                    {profile.skills.slice(0, 6).map((s) => (
                      <span key={s} className="chip chip-primary chip-sm">{s}</span>
                    ))}
                    {profile.skills.length > 6 && (
                      <span className="chip chip-sm">+{profile.skills.length - 6} more</span>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No skills added yet</span>
                )}
              </div>
              <div>
                <div className="section-sub" style={{ marginBottom: '0.5rem' }}>Job Categories</div>
                {profile.jobCategories?.length > 0 ? (
                  <div className="tags-row">
                    {profile.jobCategories.map((c) => (
                      <span key={c} className="chip chip-sm">{c}</span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No categories added</span>
                )}
              </div>
              <div>
                <div className="section-sub" style={{ marginBottom: '0.5rem' }}>Location</div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {profile.location?.city
                    ? `${profile.location.city}${profile.location.region ? `, ${profile.location.region}` : ''}`
                    : 'Not specified'}
                </span>
              </div>
              <div>
                <div className="section-sub" style={{ marginBottom: '0.5rem' }}>Experience</div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {profile.experienceYears != null ? `${profile.experienceYears} year${profile.experienceYears !== 1 ? 's' : ''}` : 'Not specified'}
                </span>
              </div>
            </div>
            {profile.bio && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                <div className="section-sub" style={{ marginBottom: '0.375rem' }}>About</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{profile.bio}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent vacancies */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Open Opportunities</h3>
          <Link to="/worker/jobs" style={{ fontSize: '0.8rem', color: 'var(--primary-light)' }}>
            View all →
          </Link>
        </div>
        {vacancies.length > 0 ? (
          <div className="grid-2">
            {vacancies.map((v) => <VacancyCard key={v._id} vacancy={v} />)}
          </div>
        ) : (
          <div className="card">
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              No vacancies found. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
