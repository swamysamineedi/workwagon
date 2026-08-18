import { useState, useEffect, useCallback } from 'react';
import { workerService } from '../../services/workerService';
import Avatar from '../../components/common/Avatar';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { requestService } from '../../services/requestService';
import { vacancyService } from '../../services/vacancyService';

export default function FindWorkers() {
  const [workers, setWorkers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [filters, setFilters] = useState({ skill: '', city: '', available: '' });

  // Invite Modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [myVacancies, setMyVacancies] = useState([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState('');
  const [inviting, setInviting] = useState(false);

  const setF = (k) => (e) => setFilters((p) => ({ ...p, [k]: e.target.value }));

  const load = useCallback((p = 1) => {
    setLoading(true);
    workerService.listWorkers({ ...filters, page: p, limit: 12 })
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
    setSelectedWorker(worker);
    setInviteModalOpen(true);
    try {
      const res = await vacancyService.getMyVacancies({ status: 'open' });
      setMyVacancies(res.data.data.vacancies || []);
      if (res.data.data.vacancies?.length > 0) {
        setSelectedVacancyId(res.data.data.vacancies[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendInvite = async () => {
    if (!selectedVacancyId) return alert('Please select a vacancy');
    setInviting(true);
    try {
      await requestService.create(selectedWorker.user, selectedVacancyId, 'We would like to invite you to apply for this position.');
      alert('Invite sent successfully!');
      setInviteModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="page fade-in">
      <div className="page-hero">
        <h2 className="page-hero-title">Find Workers 🔍</h2>
        <p className="page-hero-sub">{total} worker{total !== 1 ? 's' : ''} available</p>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap" style={{ flex: 1, minWidth: 180 }}>
          <span className="search-icon">🛠</span>
          <input className="form-input" placeholder="Skill (e.g. barista)…" value={filters.skill} onChange={setF('skill')} style={{ paddingLeft: '2.2rem' }} />
        </div>
        <div className="search-input-wrap" style={{ flex: 1, minWidth: 160 }}>
          <span className="search-icon">📍</span>
          <input className="form-input" placeholder="City…" value={filters.city} onChange={setF('city')} style={{ paddingLeft: '2.2rem' }} />
        </div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <select className="form-input form-select" value={filters.available} onChange={setF('available')}>
            <option value="">All Availability</option>
            <option value="true">Available now</option>
            <option value="false">Not available</option>
          </select>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ skill: '', city: '', available: '' })}>Clear</button>
      </div>

      {loading ? <Loading text="Loading workers…" /> : error ? <ErrorState message={error} onRetry={() => load(1)} /> : workers.length === 0 ? (
        <EmptyState icon="👥" title="No workers found" description="Try adjusting your filters." />
      ) : (
        <>
          <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
            {workers.map((w) => {
              const name = `${w.firstName} ${w.lastName}`.trim();
              return (
                <div key={w._id} className="profile-card">
                  <div className="profile-card-header">
                    <Avatar name={name} src={w.avatarUrl} size="md" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="profile-name truncate">{name}</div>
                      <div className="profile-headline truncate">
                        {w.jobCategories?.slice(0, 2).join(' · ') || 'Worker'}
                      </div>
                      {w.location?.city && <div className="profile-location">📍 {w.location.city}</div>}
                    </div>
                    <span className={`badge ${w.availability?.isAvailable ? 'badge-success' : 'badge-muted'}`}>
                      {w.availability?.isAvailable ? '🟢' : '🔴'}
                    </span>
                  </div>
                  <div className="profile-card-body">
                    {w.skills?.length > 0 && (
                      <div className="tags-row">
                        {w.skills.slice(0, 5).map((s) => <span key={s} className="chip chip-primary chip-sm">{s}</span>)}
                        {w.skills.length > 5 && <span className="chip chip-sm">+{w.skills.length - 5}</span>}
                      </div>
                    )}
                    {w.experienceYears != null && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {w.experienceYears} yr{w.experienceYears !== 1 ? 's' : ''} experience · {w.availability?.preferredHours || 'flexible'}
                      </div>
                    )}
                  </div>
                  <div className="profile-card-footer" style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                    <Button variant="primary" size="sm" style={{ width: '100%' }} onClick={() => handleOpenInvite(w)}>
                      Invite to Vacancy
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

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="modal-backdrop visible">
          <div className="modal card" style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: '1rem' }}>Invite {selectedWorker?.firstName}</h3>
            <div className="form-group">
              <label className="form-label">Select Vacancy</label>
              {myVacancies.length === 0 ? (
                <p style={{ color: 'var(--error)' }}>You have no open vacancies to invite to.</p>
              ) : (
                <select className="form-input form-select" value={selectedVacancyId} onChange={e => setSelectedVacancyId(e.target.value)}>
                  {myVacancies.map(v => (
                    <option key={v._id} value={v._id}>{v.title}</option>
                  ))}
                </select>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setInviteModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSendInvite} disabled={myVacancies.length === 0} loading={inviting}>
                Send Invite
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
