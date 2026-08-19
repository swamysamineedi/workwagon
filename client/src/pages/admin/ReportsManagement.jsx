import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

export default function ReportsManagement() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [selectedReport, setSelectedReport] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/reports', {
        params: { status: statusFilter },
      });
      setReports(res.data.data.reports);
    } catch (err) {
      toast.error('Failed to fetch reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (status) => {
    if (!selectedReport) return;
    try {
      await api.patch(`/api/admin/reports/${selectedReport._id}`, { status, notes });
      toast.success(`Report marked as ${status.replace('_', ' ')}`);
      setSelectedReport(null);
      setNotes('');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update report');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Platform Reports</h2>
          <p className="page-subtitle">Review and resolve user reports.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ maxWidth: '200px' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No reports found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                <th style={{ padding: '1rem' }}>Reporter</th>
                <th style={{ padding: '1rem' }}>Reason</th>
                <th style={{ padding: '1rem' }}>Target Entity</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>
                    {report.reporter?.email || 'Unknown'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ textTransform: 'capitalize' }}>{report.reason.replace('_', ' ')}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {report.refModel}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${report.status === 'OPEN' ? 'badge-warning' : report.status === 'RESOLVED' ? 'badge-success' : 'badge-outline'}`}>
                      {report.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => { setSelectedReport(report); setNotes(report.adminNotes || ''); }}
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

      {selectedReport && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <h2>Review Report</h2>
            <div style={{ margin: '1rem 0' }}>
              <p><strong>Reporter:</strong> {selectedReport.reporter?.email}</p>
              <p><strong>Target:</strong> {selectedReport.refModel} ({selectedReport.refId})</p>
              {selectedReport.reportedUser && <p><strong>Reported User:</strong> {selectedReport.reportedUser.email}</p>}
              <p><strong>Reason:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedReport.reason.replace('_', ' ')}</span></p>
              <p><strong>Details:</strong></p>
              <p style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '4px' }}>
                {selectedReport.details || 'No details provided.'}
              </p>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Admin Notes</label>
              <textarea
                className="input"
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes about the resolution..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setSelectedReport(null)}>Cancel</button>
              {selectedReport.status === 'OPEN' && (
                <button className="btn btn-outline" onClick={() => handleUpdate('UNDER_REVIEW')}>Mark Under Review</button>
              )}
              <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleUpdate('DISMISSED')}>Dismiss</button>
              <button className="btn btn-primary" onClick={() => handleUpdate('RESOLVED')}>Resolve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
