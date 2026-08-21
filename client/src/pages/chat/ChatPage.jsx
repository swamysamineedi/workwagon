import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { messageService } from '../../services/messageService';
import { connectionService } from '../../services/connectionService';
import Avatar from '../../components/common/Avatar';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';

/**
 * ChatPage
 *
 * Real-time chat interface between a Worker and a Business.
 * Accessible at /worker/chat/:connectionId and /shop/chat/:connectionId.
 *
 * Security:
 *  - Backend verifies connection membership on every REST call and Socket event.
 *  - Frontend derives the "other user" from the connection data, never from URL params.
 *  - JWT is sent in Socket.IO handshake — not trusted from client body.
 */
export default function ChatPage() {
  const { connectionId } = useParams();
  const { user }         = useAuth();
  const { socket, connected } = useSocket();
  const navigate         = useNavigate();

  const [messages, setMessages]     = useState([]);
  const [connection, setConnection] = useState(null);
  const [otherUser, setOtherUser]   = useState(null);
  const [text, setText]             = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [sending, setSending]       = useState(false);
  const [sendError, setSendError]   = useState('');

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  const basePath = user?.role === 'worker' ? '/worker' : '/shop';

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [msgRes, connRes] = await Promise.all([
          messageService.getMessages(connectionId),
          connectionService.getMyConnections(),
        ]);
        const msgs = msgRes.data.data.messages;
        setMessages(msgs);

        // Find this specific connection from the list
        const conn = connRes.data.data.connections.find(
          (c) => String(c._id) === connectionId
        );
        if (conn) {
          setConnection(conn);
          const isWorker = String(user.id || user._id) === String(conn.workerUser);
          setOtherUser({
            name: isWorker
              ? conn.shop?.businessName || 'Business'
              : conn.worker
                ? `${conn.worker.firstName || ''} ${conn.worker.lastName || ''}`.trim() || 'Worker'
                : 'Worker',
            avatar: isWorker ? conn.shop?.logoUrl : conn.worker?.avatarUrl,
            role:   isWorker ? 'Business' : 'Worker',
          });
        }

        // Mark messages as read
        await messageService.markRead(connectionId).catch(() => {});
      } catch (err) {
        const status = err.response?.status;
        if (status === 403) {
          setError('Access denied. You can only chat in your own active connections.');
        } else if (status === 404) {
          setError('Conversation not found.');
        } else {
          setError('Failed to load messages. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [connectionId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Socket.IO room join ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    socket.emit('join-conversation', { connectionId });

    const handleNewMessage = ({ message }) => {
      setMessages((prev) => {
        // Avoid duplicate if we get our own message back
        if (prev.some((m) => String(m._id) === String(message._id))) return prev;
        return [...prev, message];
      });
      // Mark as read if we're the receiver
      const userId = String(user.id || user._id);
      if (String(message.receiver?._id || message.receiver) === userId) {
        socket.emit('mark-read', { connectionId });
      }
    };

    const handleError = ({ message: msg }) => {
      setError(msg || 'Connection error.');
    };

    socket.on('new-message', handleNewMessage);
    socket.on('error', handleError);

    return () => {
      socket.emit('leave-conversation', { connectionId });
      socket.off('new-message', handleNewMessage);
      socket.off('error', handleError);
    };
  }, [socket, connectionId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSendError('');
    setSending(true);
    try {
      // Send via REST (server saves + emits to room via Socket.IO)
      await messageService.sendMessage(connectionId, trimmed);
      setText('');
      inputRef.current?.focus();
    } catch (err) {
      setSendError(
        err.response?.data?.message || 'Failed to send message. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d   = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000 && d.getDate() === now.getDate()) return 'Today';
    if (diff < 172800000) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const userId = String(user?.id || user?._id);

  // ── Render: Loading / Error ──────────────────────────────────────────────────
  if (loading) return <Loading />;
  if (error)   return (
    <div className="page fade-in">
      <div style={{ marginBottom: '1rem' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(`${basePath}/connections`)}
        >← Back to Connections</button>
      </div>
      <ErrorState message={error} />
    </div>
  );

  // ── Group messages by date ───────────────────────────────────────────────────
  const groupedMessages = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const d = formatDate(msg.createdAt);
    if (d !== lastDate) {
      groupedMessages.push({ type: 'date', label: d, key: `date-${msg.createdAt}` });
      lastDate = d;
    }
    groupedMessages.push({ type: 'message', msg, key: msg._id });
  });

  // ── Render: Chat UI ──────────────────────────────────────────────────────────
  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      height:        'calc(100vh - var(--topbar-h, 64px))',
      maxHeight:     'calc(100vh - var(--topbar-h, 64px))',
      overflow:      'hidden',
    }}>

      {/* ── Chat Header ─────────────────────────────────────────────────── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '0.875rem',
        padding:        '0.875rem 1.25rem',
        borderBottom:   '1px solid var(--border)',
        background:     'var(--surface)',
        flexShrink:     0,
      }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(`${basePath}/messages`)}
          style={{ padding: '0.375rem 0.5rem' }}
          aria-label="Back to messages"
        >
          ← Back
        </button>

        <Avatar name={otherUser?.name || '?'} src={otherUser?.avatar} size="md" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>
            {otherUser?.name || 'Connected User'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {otherUser?.role}
            {connection?.vacancy && ` · ${connection.vacancy.title}`}
          </div>
        </div>

        {/* Connection status + Socket status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Connected</span>
          <span style={{
            width:        8,
            height:       8,
            borderRadius: '50%',
            background:   connected ? 'var(--success)' : 'var(--error)',
            display:      'inline-block',
            title:        connected ? 'Real-time: active' : 'Real-time: reconnecting...',
          }} title={connected ? 'Real-time active' : 'Reconnecting…'} />
        </div>
      </div>

      {/* ── Messages Area ────────────────────────────────────────────────── */}
      <div style={{
        flex:           1,
        overflowY:      'auto',
        padding:        '1rem 1.25rem',
        display:        'flex',
        flexDirection:  'column',
        gap:            '0.25rem',
      }}>
        {messages.length === 0 && (
          <div style={{
            flex:           1,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            color:          'var(--text-muted)',
            gap:            '0.5rem',
            padding:        '3rem 1rem',
          }}>
            <span style={{ fontSize: '3rem' }}>💬</span>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Start the conversation</div>
            <div style={{ fontSize: '0.82rem', textAlign: 'center' }}>
              Say hello to {otherUser?.name}! This is the beginning of your conversation.
            </div>
          </div>
        )}

        {groupedMessages.map((item) => {
          if (item.type === 'date') {
            return (
              <div key={item.key} style={{
                textAlign:  'center',
                fontSize:   '0.72rem',
                color:      'var(--text-muted)',
                margin:     '0.75rem 0 0.25rem',
                position:   'relative',
              }}>
                <span style={{
                  background: 'var(--background)',
                  padding:    '0 0.75rem',
                  position:   'relative',
                  zIndex:     1,
                }}>
                  {item.label}
                </span>
                <hr style={{
                  position:   'absolute',
                  top:        '50%',
                  left:       0,
                  right:      0,
                  border:     'none',
                  borderTop:  '1px solid var(--border)',
                  zIndex:     0,
                }} />
              </div>
            );
          }

          const msg   = item.msg;
          const senderId = String(msg.sender?._id || msg.sender);
          const isMine   = senderId === userId;

          return (
            <div
              key={item.key}
              style={{
                display:        'flex',
                justifyContent: isMine ? 'flex-end' : 'flex-start',
                marginBottom:   '0.25rem',
              }}
            >
              <div style={{
                maxWidth:     'min(75%, 480px)',
                padding:      '0.625rem 0.875rem',
                borderRadius: isMine ? '1.25rem 1.25rem 0.25rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.25rem',
                background:   isMine ? 'var(--primary)' : 'var(--surface-2)',
                color:        isMine ? '#fff' : 'var(--text)',
                fontSize:     '0.875rem',
                lineHeight:   1.55,
                wordBreak:    'break-word',
                boxShadow:    '0 1px 2px rgba(0,0,0,0.08)',
              }}>
                <div>{msg.text}</div>
                <div style={{
                  fontSize:   '0.65rem',
                  marginTop:  '0.3rem',
                  opacity:    0.7,
                  textAlign:  'right',
                  display:    'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap:        '0.25rem',
                }}>
                  {formatTime(msg.createdAt)}
                  {isMine && (
                    <span title={msg.read ? 'Read' : 'Delivered'}>
                      {msg.read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Send Error ───────────────────────────────────────────────────── */}
      {sendError && (
        <div style={{
          padding:    '0.5rem 1.25rem',
          background: 'var(--error-soft, #fee2e2)',
          color:      'var(--error, #dc2626)',
          fontSize:   '0.8rem',
          flexShrink: 0,
        }}>
          ⚠️ {sendError}
          <button
            onClick={() => setSendError('')}
            style={{ marginLeft: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >×</button>
        </div>
      )}

      {/* ── Not connected warning ─────────────────────────────────────────── */}
      {!connected && (
        <div style={{
          padding:    '0.4rem 1.25rem',
          background: 'var(--warning-soft, #fef3c7)',
          color:      'var(--warning, #d97706)',
          fontSize:   '0.75rem',
          textAlign:  'center',
          flexShrink: 0,
        }}>
          ⚡ Reconnecting to real-time server… Messages sent will still be delivered.
        </div>
      )}

      {/* ── Input Area ───────────────────────────────────────────────────── */}
      <div style={{
        display:     'flex',
        alignItems:  'flex-end',
        gap:         '0.625rem',
        padding:     '0.875rem 1.25rem',
        borderTop:   '1px solid var(--border)',
        background:  'var(--surface)',
        flexShrink:  0,
      }}>
        <textarea
          ref={inputRef}
          id="chat-input"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            // Auto-resize
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          rows={1}
          style={{
            flex:        1,
            resize:      'none',
            border:      '1px solid var(--border)',
            borderRadius: '0.875rem',
            padding:     '0.6rem 0.875rem',
            fontSize:    '0.875rem',
            background:  'var(--background)',
            color:       'var(--text)',
            outline:     'none',
            fontFamily:  'inherit',
            maxHeight:   '120px',
            overflowY:   'auto',
            lineHeight:  1.5,
            transition:  'border-color 0.15s',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
          onBlur={(e)  => { e.target.style.borderColor = 'var(--border)'; }}
          disabled={sending}
          maxLength={2000}
          aria-label="Message input"
        />
        <button
          id="chat-send-btn"
          className="btn btn-primary"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            flexShrink:   0,
            borderRadius: '0.875rem',
            padding:      '0.6rem 1.1rem',
            fontSize:     '0.875rem',
            minWidth:     '68px',
          }}
          aria-label="Send message"
        >
          {sending ? '…' : 'Send ➤'}
        </button>
      </div>
    </div>
  );
}
