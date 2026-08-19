import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/dashboard');
      setStats(res.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page"><p>Loading dashboard...</p></div>;
  if (!stats) return <div className="page"><p>Error loading dashboard.</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Admin Dashboard</h2>
          <p className="page-subtitle">Platform overview and pending actions.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '2rem', margin: '0.5rem 0', color: 'var(--primary)' }}>{stats.totalWorkers}</h3>
          <p style={{ color: 'var(--text-muted)' }}>Total Workers</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '2rem', margin: '0.5rem 0', color: 'var(--primary)' }}>{stats.totalBusinesses}</h3>
          <p style={{ color: 'var(--text-muted)' }}>Total Businesses</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '2rem', margin: '0.5rem 0', color: 'var(--primary)' }}>{stats.activeVacancies}</h3>
          <p style={{ color: 'var(--text-muted)' }}>Active Vacancies</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '2rem', margin: '0.5rem 0', color: 'var(--primary)' }}>{stats.connections}</h3>
          <p style={{ color: 'var(--text-muted)' }}>Total Connections</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Pending Verifications</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stats.pendingVerifications > 0 ? 'var(--warning)' : 'var(--text)' }}>
              {stats.pendingVerifications}
            </span>
            <Link to="/admin/verifications" className="btn btn-primary btn-sm">Review</Link>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Open Reports</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stats.openReports > 0 ? 'var(--danger)' : 'var(--text)' }}>
              {stats.openReports}
            </span>
            <Link to="/admin/reports" className="btn btn-primary btn-sm">View Reports</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
