import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { vacancyService } from '../../services/vacancyService';
import { requestService } from '../../services/requestService';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';

const STATUS_VARIANTS = {
  open: 'success', paused: 'warning', closed: 'muted',
  filled: 'primary', expired: 'error', draft: 'muted',
};

export default function JobDetail() {
  const { id } = useParams();
  const [vacancy, setVacancy]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [requesting, setRequesting]   = useState(false);
  const [requestMsg, setRequestMsg]   = useState('');  // success/error feedback
  const [requestStatus, setRequestStatus] = useState(null); // existing request status

  // Load vacancy + check if worker already applied
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vacRes, reqRes] = await Promise.all([
          vacancyService.getById(id),
          requestService.getOutbox(),
        ]);
        const v = vacRes.data.data.vacancy;
        setVacancy(v);

        // Find if worker already has a request for this vacancy
        const existing = reqRes.data.data.requests.find(
          (r) => r.vacancy && r.vacancy._id === v._id
        );
        if (existing) setRequestStatus(existing.status);
      } catch {
        setError('Vacancy not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleExpressInterest = async () => {
    if (!vacancy?.shop?.user) {
      setRequestMsg('error:Unable to send request — shop information is missing.');
      return;
    }
    // Use shop.user._id if populated object, or shop.user if it's already a string
    const shopUserId = vacancy.shop.user?._id || vacancy.shop.user;

    setRequesting(true);
    setRequestMsg('');
    try {
      await requestService.create(
        shopUserId,
        vacancy._id,
        'I am interested in this role and would like to apply.'
      );
      setRequestStatus('pending');
      setRequestMsg('success:Request sent! The business can now review your profile.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send request.';
      setRequestMsg(`error:${msg}`);
    } finally {
      setRequesting(false);
    }
  };

  const handleCancel = async () => {
    // Find the request from outbox — we need its ID
    setRequesting(true);
    try {
      const res = await requestService.getOutbox();
      const existing = res.data.data.requests.find(
        (r) => r.vacancy && r.vacancy._id === vacancy._id
      );
      if (existing) {
        await requestService.cancel(existing._id);
        setRequestStatus(null);
        setRequestMsg('success:Request cancelled.');
      }
    } catch (err) {
      setRequestMsg(`error:${err.response?.data?.message || 'Failed to cancel.'}`);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !vacancy) return <ErrorState message={error} />;

  const {
    title, category, description, requiredSkills, employmentType,
    payRate, totalSlots, filledSlots, availableSlots, status, shop,
    location, startsAt, expiresAt, createdAt,
  } = vacancy;

  const available = availableSlots ?? Math.max(0, totalSlots - (filledSlots || 0));

  // Determine what action is available
  const canRequest  = status === 'open' && available > 0 && !requestStatus;
  const isBlocked   = ['paused', 'filled', 'closed', 'expired', 'draft'].includes(status)
    || available === 0;

  const blockedReason = () => {
    if (status === 'paused') return '⏸ This vacancy is currently paused.';
    if (status === 'filled' || available === 0) return '🔒 This vacancy is full — no slots available.';
    if (status === 'closed') return '🔒 This vacancy is closed.';
    if (status === 'expired') return '⏰ This vacancy has expired.';
    return null;
  };

  const [msgType, msgText] = requestMsg.includes(':')
    ? requestMsg.split(':')
    : ['info', requestMsg];

  return (
    <div className="page fade-in">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/worker/jobs" style={{ fontSize: '0.875rem', color: 'var(--primary-light)' }}>
          ← Back to Discover Jobs
        </Link>
      </div>

      {/* Feedback message */}
      {requestMsg && (
        <div
          className={`alert ${msgType === 'success' ? 'alert-success' : 'alert-error'}`}
          style={{ marginBottom: '1.25rem' }}
        >
          {msgType === 'success' ? '✅' : '⚠️'} {msgText}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr min(320px, 100%)', gap: '1.5rem', alignItems: 'start' }}>
        {/* ── Main content ─────────────────────────────────────────────── */}
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.375rem' }}>
                  {title}
                </h1>
                {shop?.businessName && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {shop.businessName}{' '}
                    {shop.verificationStatus === 'APPROVED' && <span className="badge badge-success">✓ Verified</span>}
                  </p>
                )}
              </div>
              <Badge variant={STATUS_VARIANTS[status] || 'muted'}>{status}</Badge>
            </div>

            <div className="tags-row" style={{ marginBottom: '1.25rem' }}>
              {category       && <span className="chip chip-primary">{category}</span>}
              {employmentType && <span className="chip">{employmentType}</span>}
              {location?.city && <span className="chip">📍 {location.city}{location.region ? `, ${location.region}` : ''}</span>}
              {payRate?.amount && (
                <span className="chip">
                  💰 {payRate.currency || 'AUD'} {payRate.amount}/{payRate.period || 'hr'}
                </span>
              )}
            </div>

            <hr className="divider" />

            <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem' }}>About this role</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {description}
            </p>

            {requiredSkills?.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem' }}>Required Skills</h3>
                <div className="tags-row">
                  {requiredSkills.map((s) => (
                    <span key={s} className="chip chip-primary">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {shop && (
            <div className="card" style={{ marginTop: 0 }}>
              <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.875rem' }}>About the Business</h3>
              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>
                {shop.businessName}
                {shop.verificationStatus === 'APPROVED' && <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>✓ Verified</span>}
              </div>
              {shop.industry  && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>{shop.industry}</div>}
              {shop.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.5rem' }}>{shop.description}</p>}
              {shop.location?.city && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  📍 {shop.location.city}{shop.location.region ? `, ${shop.location.region}` : ''}
                </div>
              )}
              {shop.phone   && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>📞 {shop.phone}</div>}
              {shop.website && (
                <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  <a href={shop.website} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)' }}>
                    🌐 {shop.website}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Slots card */}
          <div className="card">
            <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.875rem' }}>Availability</h3>
            <div style={{
              textAlign: 'center', padding: '1rem 0',
              background: available > 0 ? 'var(--success-bg)' : 'var(--error-bg)',
              borderRadius: 'var(--r)',
              border: `1px solid ${available > 0 ? 'var(--success-brd)' : 'var(--error-brd)'}`,
              marginBottom: '0.875rem',
            }}>
              <div style={{
                fontSize: '2.5rem', fontWeight: 900,
                color: available > 0 ? 'var(--success)' : 'var(--error)',
              }}>
                {available}
              </div>
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
                className={`slot-fill ${available === 0 ? 'full' : available <= 2 ? 'low' : 'open'}`}
                style={{ width: `${Math.round(((filledSlots || 0) / totalSlots) * 100)}%` }}
              />
            </div>

            {/* ── Action area ─────────────────────────────────────────── */}
            <div style={{ marginTop: '1.25rem' }}>
              {/* Already applied — show status */}
              {requestStatus === 'pending' && (
                <div>
                  <div className="alert alert-info" style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
                    ⏳ Request pending — waiting for the business to respond.
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    style={{ width: '100%' }}
                    loading={requesting}
                    onClick={handleCancel}
                  >
                    Cancel Request
                  </Button>
                </div>
              )}

              {requestStatus === 'accepted' && (
                <div className="alert alert-success" style={{ textAlign: 'center' }}>
                  🎉 Your request was accepted! Check your connections.
                </div>
              )}

              {requestStatus === 'rejected' && (
                <div className="alert alert-error" style={{ textAlign: 'center' }}>
                  ❌ Your request was not accepted this time.
                </div>
              )}

              {requestStatus === 'cancelled' && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  You cancelled your request for this vacancy.
                </div>
              )}

              {/* Blocked vacancy */}
              {!requestStatus && isBlocked && (
                <div style={{
                  padding: '0.875rem', borderRadius: 'var(--r)',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center',
                }}>
                  {blockedReason()}
                </div>
              )}

              {/* Can apply */}
              {canRequest && (
                <Button
                  variant="primary"
                  size="lg"
                  style={{ width: '100%' }}
                  onClick={handleExpressInterest}
                  loading={requesting}
                  disabled={requesting}
                >
                  {requesting ? 'Sending…' : 'Express Interest 🤝'}
                </Button>
              )}
            </div>
          </div>

          {shop && (
            <div className="card">
              <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.875rem' }}>About the Business</h3>
              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>
                {shop.businessName}
                {shop.verificationStatus === 'APPROVED' && <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>✓</span>}
              </div>
              {shop.industry && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{shop.industry}</div>}
              {shop.location?.city && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  📍 {shop.location.city}{shop.location.region ? `, ${shop.location.region}` : ''}
                </div>
              )}
              {shop.website && (
                <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  <a href={shop.website} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)' }}>
                    🌐 Website
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="card card-sm">
            {startsAt  && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Starts: {new Date(startsAt).toLocaleDateString()}</div>}
            {expiresAt && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Expires: {new Date(expiresAt).toLocaleDateString()}</div>}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Posted: {new Date(createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
