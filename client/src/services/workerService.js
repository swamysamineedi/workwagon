import api from './api';

export const workerService = {
  getMyProfile: () => api.get('/api/workers/me'),
  updateMyProfile: (data) => api.put('/api/workers/me', data),
  getWorkerById: (id) => api.get(`/api/workers/${id}`),
  listWorkers: (params) => api.get('/api/workers', { params }),
};
