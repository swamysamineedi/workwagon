import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import Avatar from '../../components/common/Avatar';

export default function UsersManagement() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async (searchQuery = '') => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/workers', { params: { search: searchQuery } });
      setWorkers(res.data.data.workers);
    } catch (err) {
      toast.error('Failed to fetch workers.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchWorkers(search);
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const action = currentStatus ? 'suspend' : 'activate';
    if (action === 'suspend' && !window.confirm('Are you sure you want to suspend this user?')) return;
    
    try {
      await api.patch(`/api/admin/users/${userId}/status`, { action, reason: 'Admin action' });
      toast.success(`User ${action}d successfully`);
      fetchWorkers(search);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Manage Workers</h2>
          <p className="page-subtitle">View and moderate worker accounts.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            className="input"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : workers.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No workers found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                <th style={{ padding: '1rem' }}>Worker</th>
                <th style={{ padding: '1rem' }}>Location</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Joined</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar name={worker.profile?.firstName || worker.email} size="sm" />
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {worker.profile ? `${worker.profile.firstName} ${worker.profile.lastName}` : 'No Profile'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{worker.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {worker.profile?.location?.city ? `${worker.profile.location.city}, ${worker.profile.location.country}` : '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${worker.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {worker.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {new Date(worker.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      className={`btn btn-sm ${worker.isActive ? 'btn-outline' : 'btn-primary'}`}
                      onClick={() => handleToggleStatus(worker._id, worker.isActive)}
                    >
                      {worker.isActive ? 'Suspend' : 'Activate'}
                    </button>
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
