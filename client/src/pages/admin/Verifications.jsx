import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import Avatar from '../../components/common/Avatar';

export default function Verifications() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/verifications');
      setVerifications(res.data.data.verifications);
    } catch (err) {
      toast.error('Failed to fetch pending verifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (status) => {
    if (!selectedProfile) return;
    if (status === 'REJECTED' && !reason) {
      toast.error('Please provide a reason for rejection.');
      return;
    }

    try {
      await api.patch(`/api/admin/businesses/${selectedProfile._id}/verification`, { status, reason });
      toast.success(`Business ${status.toLowerCase()} successfully`);
      setSelectedProfile(null);
      setReason('');
      fetchVerifications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update verification status');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Pending Verifications</h2>
          <p className="page-subtitle">Review businesses requesting verified status.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : verifications.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No pending verifications.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                <th style={{ padding: '1rem' }}>Business</th>
                <th style={{ padding: '1rem' }}>ABN / Details</th>
                <th style={{ padding: '1rem' }}>Registration Date</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {verifications.map((profile) => (
                <tr key={profile._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar name={profile.businessName} size="sm" src={profile.logoUrl} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{profile.businessName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{profile.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div><strong>Type:</strong> {profile.businessType || 'N/A'}</div>
                    {profile.abn && <div><strong>ABN:</strong> {profile.abn}</div>}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {new Date(profile.user?.createdAt || profile.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setSelectedProfile(profile)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedProfile && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <h2>Review Business Verification</h2>
            <div style={{ margin: '1rem 0' }}>
              <p><strong>Business Name:</strong> {selectedProfile.businessName}</p>
              <p><strong>Email:</strong> {selectedProfile.user?.email}</p>
              <p><strong>Phone:</strong> {selectedProfile.phone || 'N/A'}</p>
              <p><strong>ABN:</strong> {selectedProfile.abn || 'N/A'}</p>
              <p><strong>Location:</strong> {selectedProfile.location?.address}, {selectedProfile.location?.city}</p>
              <p><strong>Description:</strong></p>
              <p style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '4px' }}>
                {selectedProfile.description || 'No description provided.'}
              </p>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Rejection Reason (if rejecting)</label>
              <textarea
                className="input"
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Required for rejection..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setSelectedProfile(null)}>Cancel</button>
              <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleUpdate('REJECTED')}>Reject</button>
              <button className="btn btn-primary" onClick={() => handleUpdate('APPROVED')}>Approve Business</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
