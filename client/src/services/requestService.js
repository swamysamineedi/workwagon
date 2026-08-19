import api from './api';

export const requestService = {
  // Create a new request (worker applies to a vacancy, or shop invites a worker)
  create: (toUserId, vacancyId, message) =>
    api.post('/api/requests', { toUserId, vacancyId, message }),

  // Get incoming requests (to me)
  getInbox: () => api.get('/api/requests', { params: { type: 'inbox' } }),

  // Get outgoing requests (from me)
  getOutbox: () => api.get('/api/requests', { params: { type: 'outbox' } }),

  // Get all requests (inbox + outbox)
  getAll: () => api.get('/api/requests', { params: { type: 'all' } }),

  // Respond to an incoming request
  respond: (id, action) =>
    api.patch(`/api/requests/${id}/respond`, { action }),

  // Cancel a pending request I sent
  cancel: (id) =>
    api.patch(`/api/requests/${id}/cancel`),
};
