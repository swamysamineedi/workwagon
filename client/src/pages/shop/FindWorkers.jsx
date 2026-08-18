import { useState, useEffect, useCallback } from 'react';
import { workerService } from '../../services/workerService';
import Avatar from '../../components/common/Avatar';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

export default function FindWorkers() {
  const [workers, setWorkers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [filters, setFilters] = useState({ skill: '', city: '', available: '' });

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
                  <div className="profile-card-footer">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flex: 1 }}>
                      🤝 Requests coming next phase
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {w.profileCompleteness}% complete
                    </span>
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
    </div>
  );
}
