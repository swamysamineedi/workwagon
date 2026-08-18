import api from './api';

export const requestService = {
  create: (toUserId, vacancyId, message) => 
    api.post('/api/requests', { toUserId, vacancyId, message }),
    
  getInbox: () => api.get('/api/requests', { params: { type: 'inbox' } }),
  
  getOutbox: () => api.get('/api/requests', { params: { type: 'outbox' } }),
  
  respond: (id, action) => 
    api.patch(`/api/requests/${id}/respond`, { action }),
};
