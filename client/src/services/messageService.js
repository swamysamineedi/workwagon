import api from './api';

/**
 * messageService
 *
 * REST API wrapper for the /api/messages endpoints.
 * Socket.IO real-time events are handled separately via useSocket hook.
 */
export const messageService = {
  /**
   * Get all conversations (connections with last message + unread count)
   * GET /api/messages/conversations
   */
  getConversations: () => api.get('/api/messages/conversations'),

  /**
   * Get all messages for a specific connection
   * GET /api/messages/:connectionId
   */
  getMessages: (connectionId) => api.get(`/api/messages/${connectionId}`),

  /**
   * Send a new message
   * POST /api/messages/:connectionId
   */
  sendMessage: (connectionId, text) =>
    api.post(`/api/messages/${connectionId}`, { text }),

  /**
   * Mark all unread messages in connection as read (for current user)
   * PATCH /api/messages/:connectionId/read
   */
  markRead: (connectionId) =>
    api.patch(`/api/messages/${connectionId}/read`),
};
