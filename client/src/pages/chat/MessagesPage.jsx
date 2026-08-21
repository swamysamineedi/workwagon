import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { messageService } from '../../services/messageService';
import Avatar from '../../components/common/Avatar';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

/**
 * MessagesPage
 *
 * Conversation list page shared by both Worker (/worker/messages)
 * and Shop (/shop/messages) via the same component.
 *
 * Displays all active connections with:
 *  - Other party's name + avatar
 *  - Last message preview + timestamp
 *  - Unread message count badge
 */
export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  const basePath = user?.role === 'worker' ? '/worker' : '/shop';

  const loadConversations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await messageService.getConversations();
      setConversations(res.data.data.conversations);
    } catch {
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadConversations(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now  = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7)  return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) return <Loading />;
  if (error)   return <ErrorState message={error} onRetry={loadConversations} />;

  return (
    <div className="page fade-in">
      <div className="page-hero">
        <h2 className="page-hero-title">Messages 💬</h2>
        <p className="page-hero-sub">
          Chat with your connected {user?.role === 'worker' ? 'businesses' : 'workers'}
        </p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon="💬"
          title="No conversations yet"
          description="Once you have an active connection, you can start chatting here."
          action={
            <Link to={`${basePath}/connections`}>
              <button className="btn btn-primary">View Connections</button>
            </Link>
          }
        />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {conversations.map((conv, index) => (
            <div
              key={conv.connectionId}
              onClick={() => navigate(`${basePath}/chat/${conv.connectionId}`)}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '1rem',
                padding:      '1rem 1.25rem',
                cursor:       'pointer',
                borderBottom: index < conversations.length - 1 ? '1px solid var(--border)' : 'none',
                transition:   'background 0.15s',
                background:   conv.unreadCount > 0 ? 'var(--primary-glow)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = conv.unreadCount > 0 ? 'var(--primary-glow)' : 'transparent';
              }}
            >
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar name={conv.otherName} src={conv.otherAvatar} size="lg" />
                {conv.unreadCount > 0 && (
                  <span style={{
                    position:    'absolute',
                    top:         '-4px',
                    right:       '-4px',
                    background:  'var(--primary)',
                    color:       '#fff',
                    borderRadius: '50%',
                    fontSize:    '0.65rem',
                    fontWeight:  700,
                    minWidth:    '18px',
                    height:      '18px',
                    display:     'flex',
                    alignItems:  'center',
                    justifyContent: 'center',
                    padding:     '0 3px',
                  }}>
                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                  </span>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  alignItems:     'baseline',
                  gap:            '0.5rem',
                }}>
                  <span style={{
                    fontWeight:   conv.unreadCount > 0 ? 700 : 600,
                    color:        'var(--text)',
                    fontSize:     '0.9rem',
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace:   'nowrap',
                  }}>
                    {conv.otherName}
                  </span>
                  <span style={{
                    fontSize:   '0.72rem',
                    color:      'var(--text-muted)',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}>
                    {conv.lastMessage
                      ? formatTime(conv.lastMessage.createdAt)
                      : formatTime(conv.connectedAt)}
                  </span>
                </div>

                {conv.vacancy && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary-light)', marginBottom: '0.15rem' }}>
                    📋 {conv.vacancy.title}
                  </div>
                )}

                <div style={{
                  fontSize:     '0.8rem',
                  color:        conv.unreadCount > 0 ? 'var(--text-secondary)' : 'var(--text-muted)',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap',
                  fontWeight:   conv.unreadCount > 0 ? 600 : 400,
                }}>
                  {conv.lastMessage
                    ? conv.lastMessage.text
                    : 'No messages yet — say hello!'}
                </div>
              </div>

              {/* Arrow */}
              <span style={{ color: 'var(--text-muted)', fontSize: '1rem', flexShrink: 0 }}>›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
