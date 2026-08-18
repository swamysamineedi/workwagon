import api from './api';

export const connectionService = {
  getMyConnections: () => api.get('/api/connections'),
};
