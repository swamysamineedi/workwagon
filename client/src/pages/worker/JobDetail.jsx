import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { vacancyService } from '../../services/vacancyService';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import { requestService } from '../../services/requestService';

const STATUS_VARIANTS = { open: 'success', paused: 'warning', closed: 'muted', filled: 'primary', expired: 'error' };

export default function JobDetail() {
  const { id } = useParams();
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    vacancyService.getById(id)
      .then((res) => setVacancy(res.data.data.vacancy))
      .catch(() => setError('Vacancy not found or unavailable.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleExpressInterest = async () => {
    setRequesting(true);
    try {
      await requestService.create(vacancy.shop.user, vacancy._id, 'I am interested in this role.');
      alert('Interest expressed successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to express interest');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !vacancy) return <ErrorState message={error} />;

  const { title, category, description, requiredSkills, employmentType,
    payRate, totalSlots, filledSlots, availableSlots, status, shop,
    location, startsAt, expiresAt, createdAt } = vacancy;

  const available = availableSlots ?? Math.max(0, totalSlots - (filledSlots || 0));

  return (
    <div className="page fade-in">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/worker/jobs" style={{ fontSize: '0.875rem', color: 'var(--primary-light)' }}>
          ← Back to Discover Jobs
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Main */}
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.375rem' }}>{title}</h1>
                {shop?.businessName && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {shop.businessName} {shop.isVerified && <span className="badge badge-success">✓ Verified</span>}
                  </p>
                )}
              </div>
              <Badge variant={STATUS_VARIANTS[status] || 'muted'}>{status}</Badge>
            </div>

            <div className="tags-row" style={{ marginBottom: '1.25rem' }}>
              {category      && <span className="chip chip-primary">{category}</span>}
              {employmentType && <span className="chip">{employmentType}</span>}
              {location?.city && <span className="chip">📍 {location.city}</span>}
              {payRate?.amount && (
                <span className="chip">💰 {payRate.currency} {payRate.amount}/{payRate.period}</span>
              )}
            </div>

            <hr className="divider" />

            <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem' }}>About this role</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{description}</p>

            {requiredSkills?.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem' }}>Required Skills</h3>
                <div className="tags-row">
                  {requiredSkills.map((s) => <span key={s} className="chip chip-primary">{s}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Slots card */}
          <div className="card">
            <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.875rem' }}>Availability</h3>
            <div style={{
              textAlign: 'center', padding: '1rem 0',
              background: available > 0 ? 'var(--success-bg)' : 'var(--error-bg)',
              borderRadius: 'var(--r)', border: `1px solid ${available > 0 ? 'var(--success-brd)' : 'var(--error-brd)'}`,
              marginBottom: '0.875rem',
            }}>
              <div style={{
                fontSize: '2.5rem', fontWeight: 900,
                color: available > 0 ? 'var(--success)' : 'var(--error)',
              }}>{available}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {available === 1 ? 'slot available' : 'slots available'}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
              <span>{filledSlots || 0} filled</span>
              <span>{totalSlots} total</span>
            </div>
            <div className="slot-bar">
              <div
                className={`slot-fill ${available === 0 ? 'full' : available <= 1 ? 'low' : 'open'}`}
                style={{ width: `${Math.round(((filledSlots || 0) / totalSlots) * 100)}%` }}
              />
            </div>

            {status === 'open' && available > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <Button 
                  variant="primary" 
                  size="lg" 
                  style={{ width: '100%' }} 
                  onClick={handleExpressInterest}
                  loading={requesting}
                >
                  {requesting ? 'Sending...' : 'Express Interest 🤝'}
                </Button>
              </div>
            )}
          </div>

          {/* Shop card */}
          {shop && (
            <div className="card">
              <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.875rem' }}>About the Business</h3>
              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>
                {shop.businessName}
                {shop.isVerified && <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>✓</span>}
              </div>
              {shop.industry && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{shop.industry}</div>}
              {shop.location?.city && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  📍 {shop.location.city}{shop.location.region ? `, ${shop.location.region}` : ''}
                </div>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="card card-sm">
            {startsAt && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Starts: {new Date(startsAt).toLocaleDateString()}</div>}
            {expiresAt && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Expires: {new Date(expiresAt).toLocaleDateString()}</div>}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Posted: {new Date(createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
