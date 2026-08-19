import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

export default function VacancyModeration() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modFilter, setModFilter] = useState('PENDING'); // Or '' for all

  useEffect(() => {
    fetchVacancies();
  }, [statusFilter, modFilter]);

  const fetchVacancies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/vacancies', {
        params: { status: statusFilter, moderation: modFilter },
      });
      setVacancies(res.data.data.vacancies);
    } catch (err) {
      toast.error('Failed to fetch vacancies.');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (id, status) => {
    const reason = status === 'REJECTED' || status === 'REMOVED' 
      ? window.prompt('Reason for moderation action (optional):') 
      : '';
      
    if ((status === 'REJECTED' || status === 'REMOVED') && reason === null) return;

    try {
      await api.patch(`/api/admin/vacancies/${id}/moderation`, { status, reason });
      toast.success(`Vacancy ${status.toLowerCase()} successfully`);
      fetchVacancies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to moderate vacancy');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Vacancy Moderation</h2>
          <p className="page-subtitle">Review and manage platform vacancies.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Job Statuses</option>
          <option value="open">Open</option>
          <option value="filled">Filled</option>
          <option value="closed">Closed</option>
        </select>
        
        <select
          className="input"
          value={modFilter}
          onChange={(e) => setModFilter(e.target.value)}
        >
          <option value="">All Moderation Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="REMOVED">Removed</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : vacancies.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No vacancies found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                <th style={{ padding: '1rem' }}>Vacancy Details</th>
                <th style={{ padding: '1rem' }}>Business</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Moderation</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vacancies.map((vacancy) => (
                <tr key={vacancy._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 500 }}>{vacancy.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {vacancy.category} · {vacancy.location?.city || 'Remote'}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {vacancy.shop?.businessName || 'Unknown Shop'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge badge-outline">
                      {vacancy.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${vacancy.moderationStatus === 'APPROVED' ? 'badge-success' : vacancy.moderationStatus === 'REJECTED' || vacancy.moderationStatus === 'REMOVED' ? 'badge-danger' : 'badge-warning'}`}>
                      {vacancy.moderationStatus}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    {vacancy.moderationStatus !== 'APPROVED' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleModerate(vacancy._id, 'APPROVED')}
                      >
                        Approve
                      </button>
                    )}
                    {vacancy.moderationStatus !== 'REJECTED' && vacancy.moderationStatus !== 'REMOVED' && (
                      <button
                        className="btn btn-sm btn-outline"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                        onClick={() => handleModerate(vacancy._id, 'REJECTED')}
                      >
                        Reject
                      </button>
                    )}
                    {vacancy.status !== 'closed' && vacancy.moderationStatus !== 'REMOVED' && (
                      <button
                        className="btn btn-sm btn-outline"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                        onClick={() => handleModerate(vacancy._id, 'REMOVED')}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
