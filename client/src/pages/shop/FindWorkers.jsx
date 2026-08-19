import { useState, useEffect, useCallback } from 'react';
import { workerService } from '../../services/workerService';
import { vacancyService } from '../../services/vacancyService';
import { requestService } from '../../services/requestService';
import Avatar from '../../components/common/Avatar';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';

const CATEGORIES = [
  'Hospitality', 'Retail', 'Logistics', 'Healthcare',
  'Construction', 'Administration', 'Technology', 'Other',
];

export default function FindWorkers() {
  const [workers, setWorkers] = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [filters, setFilters] = useState({
    skill: '', category: '', city: '', available: '', sort: 'completeness',
  });

  // Invite modal
  const [inviteWorker, setInviteWorker]       = useState(null);
  const [myVacancies, setMyVacancies]         = useState([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState('');
  const [inviting, setInviting]               = useState(false);
  const [inviteFeedback, setInviteFeedback]   = useState('');

  // Worker profile modal
  const [profileWorker, setProfileWorker] = useState(null);

  const setF = (k) => (e) => setFilters((p) => ({ ...p, [k]: e.target.value }));

  const load = useCallback((p = 1) => {
    setLoading(true);
    const params = { page: p, limit: 12 };
    if (filters.skill)     params.skill     = filters.skill;
    if (filters.category)  params.category  = filters.category;
    if (filters.city)      params.city      = filters.city;
    if (filters.available !== '') params.available = filters.available;
    if (filters.sort)      params.sort      = filters.sort;

    workerService.listWorkers(params)
      .then((res) => {
        setWorkers(res.data.data.workers || []);
        setTotal(res.data.data.total || 0);
        setPages(res.data.data.pages || 1);
        setPage(p);
      })
      .catch(() => setError('Failed to load workers.'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(1); }, [load]);

  const handleOpenInvite = async (worker) => {
    setInviteWorker(worker);
    setInviteFeedback('');
    setSelectedVacancyId('');
    try {
      const res = await vacancyService.getMyVacancies({ status: 'open' });
      const openVacancies = res.data.data.vacancies || [];
      setMyVacancies(openVacancies);
      if (openVacancies.length > 0) setSelectedVacancyId(openVacancies[0]._id);
    } catch {
      setMyVacancies([]);
    }
  };

  const handleSendInvite = async () => {
    if (!selectedVacancyId) {
      setInviteFeedback('error:Please select a vacancy to invite the worker to.');
      return;
    }
    // Fix: extract the User _id correctly — it may be a populated object or a raw ID string
    const workerUserId = inviteWorker.user?._id || inviteWorker.user;
    if (!workerUserId) {
      setInviteFeedback('error:Worker user information is missing. Please try again.');
      return;
    }

    setInviting(true);
    setInviteFeedback('');
    try {
      await requestService.create(
        workerUserId,
        selectedVacancyId,
        'We would like to invite you to apply for this position.'
      );
      setInviteFeedback('success:Invitation sent successfully!');
      // Auto-close modal after short delay
      setTimeout(() => setInviteWorker(null), 2000);
    } catch (err) {
      setInviteFeedback(`error:${err.response?.data?.message || 'Failed to send invitation.'}`);
    } finally {
      setInviting(false);
    }
  };

  const clearFilters = () => {
    setFilters({ skill: '', category: '', city: '', available: '', sort: 'completeness' });
  };

  const hasFilters = filters.skill || filters.category || filters.city || filters.available !== '';

  return (
    <div className="page fade-in">
      <div className="page-hero">
        <h2 className="page-hero-title">Find Workers 🔍</h2>
        <p className="page-hero-sub">
          {total} worker{total !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────── */}
      <div className="filter-bar" style={{ flexWrap: 'wrap' }}>
        <div className="search-input-wrap" style={{ flex: '1 1 160px', minWidth: 140 }}>
          <span className="search-icon">🛠</span>
          <input
            className="form-input"
            placeholder="Skill (e.g. barista)…"
            value={filters.skill}
            onChange={setF('skill')}
            style={{ paddingLeft: '2.2rem' }}
          />
        </div>
        <div className="search-input-wrap" style={{ flex: '1 1 140px', minWidth: 120 }}>
          <span className="search-icon">📍</span>
          <input
            className="form-input"
            placeholder="City…"
            value={filters.city}
            onChange={setF('city')}
            style={{ paddingLeft: '2.2rem' }}
          />
        </div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <select className="form-input form-select" value={filters.category} onChange={setF('category')}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <select className="form-input form-select" value={filters.available} onChange={setF('available')}>
            <option value="">All Availability</option>
            <option value="true">Available now</option>
            <option value="false">Not available</option>
          </select>
        </div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <select className="form-input form-select" value={filters.sort} onChange={setF('sort')}>
            <option value="completeness">Best Profile</option>
            <option value="newest">Newest</option>
            <option value="experience_high">Most Experienced</option>
            <option value="experience_low">Entry Level</option>
          </select>
        </div>
        {hasFilters && (
          <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear</button>
        )}
      </div>

      {/* ── Results ─────────────────────────────────────────────────── */}
      {loading ? (
        <Loading text="Loading workers…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(1)} />
      ) : workers.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No workers found"
          description={hasFilters ? 'No workers match your filters. Try adjusting them.' : 'No available workers right now.'}
          action={hasFilters ? <button className="btn btn-secondary" onClick={clearFilters}>Clear Filters</button> : null}
        />
      ) : (
        <>
          <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
            {workers.map((w) => {
              const name = `${w.firstName || ''} ${w.lastName || ''}`.trim() || 'Worker';
              return (
                <div key={w._id} className="profile-card">
                  <div className="profile-card-header">
                    <Avatar name={name} src={w.avatarUrl} size="md" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="profile-name truncate">{name}</div>
                      <div className="profile-headline truncate">
                        {w.jobCategories?.slice(0, 2).join(' · ') || 'Worker'}
                      </div>
                      {w.location?.city && (
                        <div className="profile-location">📍 {w.location.city}</div>
                      )}
                    </div>
                    <span className={`badge ${w.availability?.isAvailable ? 'badge-success' : 'badge-muted'}`}>
                      {w.availability?.isAvailable ? '🟢' : '🔴'}
                    </span>
                  </div>

                  <div className="profile-card-body">
                    {w.skills?.length > 0 && (
                      <div className="tags-row">
                        {w.skills.slice(0, 5).map((s) => (
                          <span key={s} className="chip chip-primary chip-sm">{s}</span>
                        ))}
                        {w.skills.length > 5 && (
                          <span className="chip chip-sm">+{w.skills.length - 5}</span>
                        )}
                      </div>
                    )}
                    {(w.experienceYears != null || w.availability?.preferredHours) && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {w.experienceYears != null && `${w.experienceYears} yr${w.experienceYears !== 1 ? 's' : ''} exp`}
                        {w.experienceYears != null && w.availability?.preferredHours && ' · '}
                        {w.availability?.preferredHours}
                      </div>
                    )}
                    {w.profileCompleteness > 0 && (
                      <div style={{ marginTop: '0.625rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                          <span>Profile</span>
                          <span>{w.profileCompleteness}%</span>
                        </div>
                        <div className="progress-bar-wrap" style={{ height: 4 }}>
                          <div className="progress-bar-fill" style={{ width: `${w.profileCompleteness}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="profile-card-footer" style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => setProfileWorker(w)}
                    >
                      View Profile
                    </button>
                    <Button
                      variant="primary"
                      size="sm"
                      style={{ flex: 1 }}
                      onClick={() => handleOpenInvite(w)}
                      disabled={!w.availability?.isAvailable}
                      title={!w.availability?.isAvailable ? 'Worker is not available' : undefined}
                    >
                      Invite
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => load(page - 1)}>← Prev</button>
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '0 0.75rem' }}>
                Page {page} of {pages}
              </span>
              <button className="btn btn-secondary btn-sm" disabled={page === pages} onClick={() => load(page + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ── Worker Profile Modal ─────────────────────────────────────── */}
      {profileWorker && (
        <div className="modal-backdrop visible" onClick={() => setProfileWorker(null)}>
          <div className="modal card" style={{ maxWidth: 520, maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Avatar name={`${profileWorker.firstName || ''} ${profileWorker.lastName || ''}`.trim()} size="xl" />
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text)' }}>
                    {profileWorker.firstName} {profileWorker.lastName}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                    <span className={`badge ${profileWorker.availability?.isAvailable ? 'badge-success' : 'badge-muted'}`}>
                      {profileWorker.availability?.isAvailable ? '🟢 Available' : '🔴 Not available'}
                    </span>
                    {profileWorker.availability?.preferredHours && (
                      <span className="badge badge-primary">{profileWorker.availability.preferredHours}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setProfileWorker(null)}
                style={{ fontSize: '1.2rem', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {profileWorker.location?.city && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                📍 {profileWorker.location.city}
                {profileWorker.location.region ? `, ${profileWorker.location.region}` : ''}
                {profileWorker.location.country ? `, ${profileWorker.location.country}` : ''}
              </div>
            )}

            {profileWorker.experienceYears != null && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                💼 {profileWorker.experienceYears} year{profileWorker.experienceYears !== 1 ? 's' : ''} of experience
              </div>
            )}

            {profileWorker.bio && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>About</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{profileWorker.bio}</p>
              </div>
            )}

            {profileWorker.skills?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Skills</div>
                <div className="tags-row">
                  {profileWorker.skills.map((s) => (
                    <span key={s} className="chip chip-primary chip-sm">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {profileWorker.jobCategories?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Job Categories</div>
                <div className="tags-row">
                  {profileWorker.jobCategories.map((c) => (
                    <span key={c} className="chip chip-sm">{c}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Button
                variant="primary"
                style={{ flex: 1 }}
                onClick={() => { setProfileWorker(null); handleOpenInvite(profileWorker); }}
                disabled={!profileWorker.availability?.isAvailable}
              >
                Invite to Vacancy
              </Button>
              <Button variant="secondary" onClick={() => setProfileWorker(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invite Modal ─────────────────────────────────────────────── */}
      {inviteWorker && (
        <div className="modal-backdrop visible" onClick={() => setInviteWorker(null)}>
          <div className="modal card" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>
                Invite {inviteWorker.firstName || 'Worker'}
              </h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setInviteWorker(null)}
                style={{ fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            {inviteFeedback && (
              <div className={`alert ${inviteFeedback.startsWith('success') ? 'alert-success' : 'alert-error'}`}
                style={{ marginBottom: '1rem' }}>
                {inviteFeedback.startsWith('success') ? '✅' : '⚠️'} {inviteFeedback.split(':')[1]}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Select an open vacancy</label>
              {myVacancies.length === 0 ? (
                <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>
                  You have no open vacancies. Create one first.
                </p>
              ) : (
                <select
                  className="form-input form-select"
                  value={selectedVacancyId}
                  onChange={(e) => setSelectedVacancyId(e.target.value)}
                >
                  {myVacancies.map((v) => {
                    const avail = Math.max(0, v.totalSlots - (v.filledSlots || 0));
                    return (
                      <option key={v._id} value={v._id}>
                        {v.title} — {avail} slot{avail !== 1 ? 's' : ''} available
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setInviteWorker(null)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleSendInvite}
                disabled={myVacancies.length === 0 || inviting}
                loading={inviting}
              >
                Send Invite
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
