import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import Avatar from '../../components/common/Avatar';

export default function BusinessesManagement() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async (searchQuery = '') => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/businesses', { params: { search: searchQuery } });
      setBusinesses(res.data.data.businesses);
    } catch (err) {
      toast.error('Failed to fetch businesses.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBusinesses(search);
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const action = currentStatus ? 'suspend' : 'activate';
    if (action === 'suspend' && !window.confirm('Are you sure you want to suspend this business account?')) return;
    
    try {
      await api.patch(`/api/admin/users/${userId}/status`, { action, reason: 'Admin action' });
      toast.success(`Business ${action}d successfully`);
      fetchBusinesses(search);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Manage Businesses</h2>
          <p className="page-subtitle">View and moderate business accounts.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            className="input"
            placeholder="Search by business name or email..."
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
        ) : businesses.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No businesses found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                <th style={{ padding: '1rem' }}>Business</th>
                <th style={{ padding: '1rem' }}>Location</th>
                <th style={{ padding: '1rem' }}>Verification</th>
                <th style={{ padding: '1rem' }}>Account Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((shop) => (
                <tr key={shop._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar name={shop.businessName} size="sm" src={shop.logoUrl} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{shop.businessName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{shop.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {shop.location?.city ? `${shop.location.city}, ${shop.location.country}` : '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${shop.verificationStatus === 'APPROVED' ? 'badge-success' : shop.verificationStatus === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                      {shop.verificationStatus}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${shop.user?.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {shop.user?.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      className={`btn btn-sm ${shop.user?.isActive ? 'btn-outline' : 'btn-primary'}`}
                      onClick={() => handleToggleStatus(shop.user._id, shop.user.isActive)}
                    >
                      {shop.user?.isActive ? 'Suspend' : 'Activate'}
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
