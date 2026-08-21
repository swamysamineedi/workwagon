import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestService } from '../../services/requestService';
import { connectionService } from '../../services/connectionService';
import Avatar from '../../components/common/Avatar';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';

const STATUS_BADGE = {
  pending:   'badge-warning',
  accepted:  'badge-success',
  rejected:  'badge-danger',
  cancelled: 'badge-muted',
};

export default function ShopConnections() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]   = useState('inbox');
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
      setFeedback(`success:Worker ${action === 'accept' ? 'hired' : 'declined'} successfully.`);
      loadData();
    } catch (err) {
      setFeedback(`error:${err.response?.data?.message || 'Action failed.'}`);
    } finally {
      setActionId('');
    }
  };

  if (loading) return <Loading />;
  if (error)   return <ErrorState message={error} onRetry={loadData} />;

  const pendingApps  = inbox.filter((r) => r.status === 'pending').length;
  const pendingInvites = outbox.filter((r) => r.status === 'pending').length;

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
        <h2 className="page-hero-title">Workers & Requests 🤝</h2>
        <p className="page-hero-sub">Review applications, manage your hired workers, and track invitations</p>
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
        <button style={tabStyle('inbox')} onClick={() => setActiveTab('inbox')}>
          Applications{' '}
          {pendingApps > 0 && (
            <span className="badge badge-warning" style={{ marginLeft: '0.375rem', fontSize: '0.7rem' }}>{pendingApps}</span>
          )}
        </button>
        <button style={tabStyle('connections')} onClick={() => setActiveTab('connections')}>
          Hired Workers ({connections.length})
        </button>
        <button style={tabStyle('outbox')} onClick={() => setActiveTab('outbox')}>
          Sent Invites{' '}
          {pendingInvites > 0 && (
            <span className="badge badge-warning" style={{ marginLeft: '0.375rem', fontSize: '0.7rem' }}>{pendingInvites}</span>
          )}
        </button>
      </div>

      {/* ── Applications (inbox) ────────────────────────────────────── */}
      {activeTab === 'inbox' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {inbox.length === 0 ? (
            <EmptyState
              icon="📥"
              title="No applications yet"
              description="Workers will appear here when they apply to your vacancies."
            />
          ) : (
            inbox.map((r) => {
              const wp = r.fromProfile;
              const name = wp
                ? `${wp.firstName || ''} ${wp.lastName || ''}`.trim()
                : 'A Worker';
              return (
                <div key={r._id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    {/* Worker info */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', flex: 1, minWidth: 0 }}>
                      <Avatar name={name} size="lg" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ margin: 0, color: 'var(--text)' }}>{name}</h4>

                        {/* Location */}
                        {wp?.location?.city && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>
                            📍 {wp.location.city}{wp.location.region ? `, ${wp.location.region}` : ''}
                          </p>
                        )}

                        {/* Experience + availability */}
                        {(wp?.experienceYears != null || wp?.availability?.preferredHours) && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.1rem 0' }}>
                            {wp.experienceYears != null && `${wp.experienceYears} yr${wp.experienceYears !== 1 ? 's' : ''} exp`}
                            {wp.experienceYears != null && wp.availability?.preferredHours && ' · '}
                            {wp.availability?.preferredHours}
                          </p>
                        )}

                        {/* Skills */}
                        {wp?.skills?.length > 0 && (
                          <div className="tags-row" style={{ marginTop: '0.5rem' }}>
                            {wp.skills.slice(0, 6).map((s) => (
                              <span key={s} className="chip chip-primary chip-sm">{s}</span>
                            ))}
                            {wp.skills.length > 6 && (
                              <span className="chip chip-sm">+{wp.skills.length - 6}</span>
                            )}
                          </div>
                        )}

                        {/* Applied for */}
                        <div style={{ marginTop: '0.625rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {r.vacancy && (
                            <span className="badge badge-primary">
                              Applied for: {r.vacancy.title}
                            </span>
                          )}
                          <span className={`badge ${STATUS_BADGE[r.status] || 'badge-muted'}`}>
                            {r.status.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Message */}
                        {r.message && (
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                            "{r.message}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {r.status === 'pending' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                        <Button
                          variant="primary" size="sm"
                          loading={actionId === r._id}
                          onClick={() => handleRespond(r._id, 'accept')}
                        >
                          ✅ Hire / Accept
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          loading={actionId === r._id}
                          onClick={() => handleRespond(r._id, 'reject')}
                        >
                          ❌ Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Hired Workers (connections) ─────────────────────────────── */}
      {activeTab === 'connections' && (
        <div className="grid-2">
          {connections.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <EmptyState
                icon="🤝"
                title="No hired workers yet"
                description="Accept applications or invite workers to build your team."
              />
            </div>
          ) : (
            connections.map((c) => {
              const name = c.worker
                ? `${c.worker.firstName || ''} ${c.worker.lastName || ''}`.trim()
                : 'Worker';
              return (
                <div key={c._id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.25rem' }}>
                  <Avatar name={name} src={c.worker?.avatarUrl} size="lg" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, color: 'var(--text)' }}>{name}</h4>
                    {c.worker?.location?.city && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>
                        📍 {c.worker.location.city}
                      </p>
                    )}
                    {c.worker?.skills?.length > 0 && (
                      <div className="tags-row" style={{ marginTop: '0.375rem' }}>
                        {c.worker.skills.slice(0, 4).map((s) => (
                          <span key={s} className="chip chip-primary chip-sm">{s}</span>
                        ))}
                      </div>
                    )}
                    {c.vacancy && (
                      <div className="badge badge-primary" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                        Role: {c.vacancy.title}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Hired {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                    <span className="badge badge-success">Active</span>
                    {c.status === 'active' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/shop/chat/${c._id}`)}
                        id={`open-chat-shop-${c._id}`}
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                      >
                        💬 Open Chat
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Sent Invites (outbox) ───────────────────────────────────── */}
      {activeTab === 'outbox' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {outbox.length === 0 ? (
            <EmptyState
              icon="📤"
              title="No invitations sent"
              description="Use Find Workers to discover and invite available workers."
            />
          ) : (
            outbox.map((r) => {
              const wp = r.toProfile;
              const name = wp
                ? `${wp.firstName || ''} ${wp.lastName || ''}`.trim()
                : 'A Worker';
              return (
                <div key={r._id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <Avatar name={name} size="md" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: 0, color: 'var(--text)' }}>{name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>
                        {r.vacancy
                          ? `Invited for "${r.vacancy.title}"`
                          : 'Invited to connect'}
                      </p>
                      {wp?.location?.city && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                          📍 {wp.location.city}
                        </p>
                      )}
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className={`badge ${STATUS_BADGE[r.status] || 'badge-muted'}`}>
                          {r.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                        {r.status === 'accepted' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>🎉 Hired!</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
