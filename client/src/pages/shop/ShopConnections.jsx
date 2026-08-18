import { useState, useEffect } from 'react';
import { requestService } from '../../services/requestService';
import { connectionService } from '../../services/connectionService';
import Avatar from '../../components/common/Avatar';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';

export default function ShopConnections() {
  const [activeTab, setActiveTab] = useState('connections');
  const [connections, setConnections] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [outbox, setOutbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [connRes, inRes, outRes] = await Promise.all([
        connectionService.getMyConnections(),
        requestService.getInbox(),
        requestService.getOutbox(),
      ]);
      setConnections(connRes.data.data.connections);
      setInbox(inRes.data.data.requests);
      setOutbox(outRes.data.data.requests);
    } catch (err) {
      setError('Failed to load connections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleRespond = async (id, action) => {
    try {
      await requestService.respond(id, action);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="page fade-in">
      <div className="page-hero">
        <h2 className="page-hero-title">Workers & Requests 🤝</h2>
        <p className="page-hero-sub">Manage your hired workers and pending applications</p>
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)' }}>
        <button 
          className={`tab-item ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
          style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'connections' ? '2px solid var(--primary)' : 'none', color: activeTab === 'connections' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}
        >
          Hired Workers ({connections.length})
        </button>
        <button 
          className={`tab-item ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('inbox')}
          style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'inbox' ? '2px solid var(--primary)' : 'none', color: activeTab === 'inbox' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}
        >
          Applications ({inbox.filter(r => r.status === 'pending').length})
        </button>
        <button 
          className={`tab-item ${activeTab === 'outbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('outbox')}
          style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'outbox' ? '2px solid var(--primary)' : 'none', color: activeTab === 'outbox' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}
        >
          Sent Invites
        </button>
      </div>

      {activeTab === 'connections' && (
        <div className="grid-2">
          {connections.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <EmptyState icon="🤝" title="No hired workers yet" description="Accept applications or invite workers to connect!" />
            </div>
          ) : (
            connections.map(c => {
              const name = `${c.worker.firstName} ${c.worker.lastName}`;
              return (
                <div key={c._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                  <Avatar name={name} src={c.worker.avatarUrl} size="lg" />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0 }}>{name}</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>📍 {c.worker.location?.city}</p>
                    {c.vacancy && <div className="badge badge-primary">Role: {c.vacancy.title}</div>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'inbox' && (
        <div className="grid-1" style={{ gap: '1rem' }}>
          {inbox.length === 0 ? (
            <EmptyState icon="📥" title="Inbox empty" description="You have no pending applications." />
          ) : (
            inbox.map(r => {
              const name = `${r.fromProfile?.firstName || 'A'} ${r.fromProfile?.lastName || 'Worker'}`;
              return (
                <div key={r._id} className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Avatar name={name} size="md" />
                    <div>
                      <h4 style={{ margin: 0 }}>{name}</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>Applied for {r.vacancy ? r.vacancy.title : 'a position'}</p>
                      <span className={`badge ${r.status === 'pending' ? 'badge-warning' : r.status === 'accepted' ? 'badge-success' : 'badge-danger'}`}>
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button variant="primary" size="sm" onClick={() => handleRespond(r._id, 'accept')}>Hire / Accept</Button>
                      <Button variant="outline" size="sm" onClick={() => handleRespond(r._id, 'reject')}>Decline</Button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'outbox' && (
        <div className="grid-1" style={{ gap: '1rem' }}>
          {outbox.length === 0 ? (
            <EmptyState icon="📤" title="No sent invites" description="You haven't invited any workers yet." />
          ) : (
            outbox.map(r => {
              const name = `${r.toProfile?.firstName || 'A'} ${r.toProfile?.lastName || 'Worker'}`;
              return (
                <div key={r._id} className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Avatar name={name} size="md" />
                    <div>
                      <h4 style={{ margin: 0 }}>{name}</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>You invited them {r.vacancy ? `for ${r.vacancy.title}` : 'to connect'}</p>
                      <span className={`badge ${r.status === 'pending' ? 'badge-warning' : r.status === 'accepted' ? 'badge-success' : 'badge-danger'}`}>
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  );
}
