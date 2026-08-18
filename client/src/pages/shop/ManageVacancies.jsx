import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { vacancyService } from '../../services/vacancyService';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

const STATUS_VARIANTS = { open: 'success', paused: 'warning', closed: 'muted', filled: 'primary', expired: 'error', draft: 'muted' };

export default function ManageVacancies() {
  const [vacancies, setVacancies] = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    vacancyService.getMyVacancies({ status: statusFilter || undefined })
      .then((res) => {
        setVacancies(res.data.data.vacancies || []);
        setTotal(res.data.data.total || 0);
      })
      .catch(() => setError('Failed to load vacancies.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id, newStatus) => {
    setActionLoading(id + newStatus);
    try {
      await vacancyService.changeStatus(id, newStatus);
      setVacancies((prev) => prev.map((v) => v._id === id ? { ...v, status: newStatus } : v));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading('');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading('delete');
    try {
      await vacancyService.delete(deleteTarget._id);
      setVacancies((prev) => prev.filter((v) => v._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete vacancy.');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="page fade-in">
      <div className="page-hero">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="page-hero-title">My Vacancies</h2>
            <p className="page-hero-sub">{total} total listing{total !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/shop/vacancies/new">
            <Button variant="primary">➕ Post a Vacancy</Button>
          </Link>
        </div>
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['', 'open', 'paused', 'closed', 'filled', 'expired'].map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {vacancies.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No vacancies yet"
          description="Post your first vacancy to start finding great workers."
          action={<Link to="/shop/vacancies/new"><Button variant="primary">Post a Vacancy</Button></Link>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {vacancies.map((v) => {
            const available = Math.max(0, (v.totalSlots || 0) - (v.filledSlots || 0));
            const pct = v.totalSlots ? Math.round(((v.filledSlots || 0) / v.totalSlots) * 100) : 0;
            const fillCls = pct >= 100 ? 'full' : pct >= 80 ? 'low' : pct >= 40 ? 'moderate' : 'open';

            return (
              <div key={v._id} className="card card-hover" style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem' }}>{v.title}</span>
                    <Badge variant={STATUS_VARIANTS[v.status] || 'muted'}>{v.status}</Badge>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
                    {v.category && <span className="chip chip-sm">{v.category}</span>}
                    {v.employmentType && <span className="chip chip-sm">{v.employmentType}</span>}
                    {v.location?.city && <span className="chip chip-sm">📍 {v.location.city}</span>}
                  </div>
                  <div className="slot-indicator">
                    <div className="slot-counts">
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: available > 0 ? 'var(--success)' : 'var(--error)' }}>{available}</strong> slot{available !== 1 ? 's' : ''} available
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.filledSlots || 0}/{v.totalSlots}</span>
                    </div>
                    <div className="slot-bar">
                      <div className={`slot-fill ${fillCls}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flexShrink: 0 }}>
                  <Link to={`/shop/vacancies/${v._id}/edit`}>
                    <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>✏️ Edit</button>
                  </Link>
                  {v.status === 'open' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={!!actionLoading}
                      onClick={() => handleStatus(v._id, 'paused')}
                    >⏸ Pause</button>
                  )}
                  {v.status === 'paused' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={!!actionLoading}
                      onClick={() => handleStatus(v._id, 'open')}
                    >▶️ Resume</button>
                  )}
                  {['open', 'paused', 'draft'].includes(v.status) && (
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={!!actionLoading}
                      onClick={() => handleStatus(v._id, 'closed')}
                    >🔒 Close</button>
                  )}
                  {(v.filledSlots || 0) === 0 && (
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={!!actionLoading}
                      onClick={() => setDeleteTarget(v)}
                    >🗑 Delete</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Vacancy"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={actionLoading === 'delete'} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
