import { useState, useEffect, useCallback } from 'react';
import { vacancyService } from '../../services/vacancyService';
import VacancyCard from '../../components/vacancy/VacancyCard';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

const CATEGORIES = [
  'Hospitality', 'Retail', 'Logistics', 'Healthcare',
  'Construction', 'Administration', 'Technology', 'Other',
];
const EMP_TYPES = ['full-time', 'part-time', 'casual', 'contract'];

export default function DiscoverJobs() {
  const [vacancies, setVacancies] = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const [filters, setFilters] = useState({
    search: '', category: '', employmentType: '',
    city: '', minPay: '', sort: 'newest',
  });

  const setF = (k) => (e) => setFilters((p) => ({ ...p, [k]: e.target.value }));

  const load = useCallback((p = 1) => {
    setLoading(true);
    const params = { page: p, limit: 12 };
    if (filters.search)         params.search         = filters.search;
    if (filters.category)       params.category       = filters.category;
    if (filters.employmentType) params.employmentType = filters.employmentType;
    if (filters.city)           params.city           = filters.city;
    if (filters.minPay)         params.minPay         = filters.minPay;
    if (filters.sort)           params.sort           = filters.sort;

    vacancyService.browse(params)
      .then((res) => {
        setVacancies(res.data.data.vacancies || []);
        setTotal(res.data.data.total || 0);
        setPages(res.data.data.pages || 1);
        setPage(p);
      })
      .catch(() => setError('Failed to load vacancies.'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(1); }, [load]);

  const clearFilters = () => {
    setFilters({ search: '', category: '', employmentType: '', city: '', minPay: '', sort: 'newest' });
  };

  const hasActiveFilters = filters.search || filters.category || filters.employmentType
    || filters.city || filters.minPay;

  return (
    <div className="page fade-in">
      <div className="page-hero">
        <h2 className="page-hero-title">Discover Jobs 🔍</h2>
        <p className="page-hero-sub">
          Browse {total} open {total === 1 ? 'vacancy' : 'vacancies'}
        </p>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────── */}
      <div className="filter-bar" style={{ flexWrap: 'wrap' }}>
        {/* Search */}
        <div className="search-input-wrap" style={{ flex: '1 1 200px', minWidth: 180 }}>
          <span className="search-icon">🔍</span>
          <input
            className="form-input"
            placeholder="Search job title…"
            value={filters.search}
            onChange={setF('search')}
            style={{ paddingLeft: '2.2rem' }}
          />
        </div>

        {/* City */}
        <div className="search-input-wrap" style={{ flex: '1 1 160px', minWidth: 140 }}>
          <span className="search-icon">📍</span>
          <input
            className="form-input"
            placeholder="City / Location…"
            value={filters.city}
            onChange={setF('city')}
            style={{ paddingLeft: '2.2rem' }}
          />
        </div>

        {/* Category */}
        <div className="form-group" style={{ minWidth: 160 }}>
          <select className="form-input form-select" value={filters.category} onChange={setF('category')}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Employment type */}
        <div className="form-group" style={{ minWidth: 140 }}>
          <select className="form-input form-select" value={filters.employmentType} onChange={setF('employmentType')}>
            <option value="">All Types</option>
            {EMP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Min pay */}
        <div className="form-group" style={{ minWidth: 130 }}>
          <input
            className="form-input"
            type="number"
            placeholder="Min pay ($/hr)…"
            value={filters.minPay}
            onChange={setF('minPay')}
            min="0"
          />
        </div>

        {/* Sort */}
        <div className="form-group" style={{ minWidth: 140 }}>
          <select className="form-input form-select" value={filters.sort} onChange={setF('sort')}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="pay_high">Highest Pay</option>
            <option value="pay_low">Lowest Pay</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <Loading text="Loading vacancies…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(1)} />
      ) : vacancies.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No vacancies found"
          description={
            hasActiveFilters
              ? 'No vacancies match your filters. Try adjusting or clearing them.'
              : 'No open vacancies right now. Check back soon!'
          }
          action={
            hasActiveFilters
              ? <button className="btn btn-secondary" onClick={clearFilters}>Clear Filters</button>
              : null
          }
        />
      ) : (
        <>
          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            {vacancies.map((v) => <VacancyCard key={v._id} vacancy={v} />)}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page === 1}
                onClick={() => load(page - 1)}
              >← Prev</button>
              <span style={{
                display: 'flex', alignItems: 'center',
                color: 'var(--text-muted)', fontSize: '0.875rem', padding: '0 0.75rem',
              }}>
                Page {page} of {pages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page === pages}
                onClick={() => load(page + 1)}
              >Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
