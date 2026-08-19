import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { requestService } from '../../services/requestService';
import { connectionService } from '../../services/connectionService';
import Avatar from '../../components/common/Avatar';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

const STATUS_BADGE = {
  pending:   'badge-warning',
  accepted:  'badge-success',
  rejected:  'badge-danger',
  cancelled: 'badge-muted',
};

export default function WorkerConnections() {
  const [activeTab, setActiveTab]   = useState('connections');
  const [connections, setConnections] = useState([]);
  const [inbox, setInbox]           = useState([]);
  const [outbox, setOutbox]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [actionId, setActionId]     = useState('');
  const [feedback, setFeedback]     = useState('');

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
    } catch {
      setError('Failed to load connections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleRespond = async (id, action) => {
    setActionId(id);
    setFeedback('');
    try {
      await requestService.respond(id, action);
      setFeedback(`success:Request ${action}ed!`);
      loadData();
    } catch (err) {
      setFeedback(`error:${err.response?.data?.message || 'Action failed.'}`);
    } finally {
      setActionId('');
    }
  };

  const handleCancel = async (id) => {
    setActionId(id);
    setFeedback('');
    try {
      await requestService.cancel(id);
      setFeedback('success:Request cancelled.');
      loadData();
    } catch (err) {
      setFeedback(`error:${err.response?.data?.message || 'Failed to cancel.'}`);
    } finally {
      setActionId('');
    }
  };

  if (loading) return <Loading />;
  if (error)   return <ErrorState message={error} onRetry={loadData} />;

  const pendingInbox  = inbox.filter((r) => r.status === 'pending').length;
  const pendingOutbox = outbox.filter((r) => r.status === 'pending').length;

  const [fbType, fbText] = feedback.includes(':')
    ? feedback.split(':')
    : ['info', feedback];

  const tabStyle = (tab) => ({
    padding: '0.75rem 1rem',
    background: 'transparent',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
    color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.875rem',
    transition: 'color 0.15s',
  });

  return (
    <div className="page fade-in">
      <div className="page-hero">
        <h2 className="page-hero-title">Connections & Requests 🤝</h2>
        <p className="page-hero-sub">Manage your active connections and request history</p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`alert ${fbType === 'success' ? 'alert-success' : 'alert-error'}`}
          style={{ marginBottom: '1.25rem' }}>
          {fbType === 'success' ? '✅' : '⚠️'} {fbText}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <button style={tabStyle('connections')} onClick={() => setActiveTab('connections')}>
          Active Connections ({connections.length})
        </button>
        <button style={tabStyle('inbox')} onClick={() => setActiveTab('inbox')}>
          Inbox {pendingInbox > 0 && <span className="badge badge-warning" style={{ marginLeft: '0.375rem', fontSize: '0.7rem' }}>{pendingInbox}</span>}
        </button>
        <button style={tabStyle('outbox')} onClick={() => setActiveTab('outbox')}>
          Sent Requests {pendingOutbox > 0 && <span className="badge badge-warning" style={{ marginLeft: '0.375rem', fontSize: '0.7rem' }}>{pendingOutbox}</span>}
        </button>
      </div>

      {/* ── Active Connections ──────────────────────────────────────── */}
      {activeTab === 'connections' && (
        <div className="grid-2">
          {connections.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <EmptyState
                icon="🤝"
                title="No active connections yet"
                description="Apply for jobs or accept invitations to build your work connections."
                action={<Link to="/worker/jobs"><Button variant="primary">Discover Jobs</Button></Link>}
              />
            </div>
          ) : (
            connections.map((c) => (
              <div key={c._id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.25rem' }}>
                <Avatar name={c.shop?.businessName || 'Shop'} src={c.shop?.logoUrl} size="lg" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: 0, color: 'var(--text)' }}>{c.shop?.businessName}</h4>
                  {c.shop?.industry && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.15rem 0' }}>{c.shop.industry}</p>
                  )}
                  {c.shop?.location?.city && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.15rem 0' }}>
                      📍 {c.shop.location.city}{c.shop.location.region ? `, ${c.shop.location.region}` : ''}
                    </p>
                  )}
                  {c.vacancy && (
                    <div className="badge badge-primary" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                      Role: {c.vacancy.title}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Connected {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span className="badge badge-success">Active</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Inbox (invites from shops) ──────────────────────────────── */}
      {activeTab === 'inbox' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {inbox.length === 0 ? (
            <EmptyState icon="📥" title="Inbox empty" description="You have no incoming invitations from businesses." />
          ) : (
            inbox.map((r) => (
              <div key={r._id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <Avatar name={r.fromProfile?.businessName || 'Shop'} size="md" />
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text)' }}>{r.fromProfile?.businessName || 'A Business'}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>
                        {r.vacancy
                          ? `Invited you for the role of "${r.vacancy.title}"`
                          : 'Invited you to connect'}
                      </p>
                      {r.fromProfile?.location?.city && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                          📍 {r.fromProfile.location.city}
                        </p>
                      )}
                      {r.message && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.375rem', fontStyle: 'italic' }}>
                          "{r.message}"
                        </p>
                      )}
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className={`badge ${STATUS_BADGE[r.status] || 'badge-muted'}`}>{r.status.toUpperCase()}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <Button
                        variant="primary" size="sm"
                        loading={actionId === r._id}
                        onClick={() => handleRespond(r._id, 'accept')}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        loading={actionId === r._id}
                        onClick={() => handleRespond(r._id, 'reject')}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Outbox (my sent requests) ───────────────────────────────── */}
      {activeTab === 'outbox' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {outbox.length === 0 ? (
            <EmptyState
              icon="📤"
              title="No sent requests"
              description="You haven't applied to any jobs yet."
              action={<Link to="/worker/jobs"><Button variant="primary">Discover Jobs</Button></Link>}
            />
          ) : (
            outbox.map((r) => (
              <div key={r._id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <Avatar name={r.toProfile?.businessName || 'Shop'} size="md" />
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text)' }}>{r.toProfile?.businessName || 'A Business'}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>
                        {r.vacancy
                          ? `Applied for "${r.vacancy.title}"`
                          : 'Applied to connect'}
                      </p>
                      {r.vacancy?.location?.city && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                          📍 {r.vacancy.location.city}
                        </p>
                      )}
                      {r.vacancy?.payRate?.amount && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.1rem 0' }}>
                          💰 {r.vacancy.payRate.currency || 'AUD'} {r.vacancy.payRate.amount}/{r.vacancy.payRate.period || 'hr'}
                        </p>
                      )}
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className={`badge ${STATUS_BADGE[r.status] || 'badge-muted'}`}>{r.status.toUpperCase()}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                        {r.status === 'accepted' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>🎉 Connected!</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {r.status === 'pending' && (
                    <Button
                      variant="secondary" size="sm"
                      loading={actionId === r._id}
                      onClick={() => handleCancel(r._id)}
                    >
                      Cancel
                    </Button>
                  )}
                  {r.vacancy && (
                    <Link to={`/worker/jobs/${r.vacancy._id}`}>
                      <button className="btn btn-ghost btn-sm">View Job →</button>
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
