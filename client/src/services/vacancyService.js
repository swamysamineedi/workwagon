import api from './api';

export const vacancyService = {
  create: (data) => api.post('/api/vacancies', data),
  browse: (params) => api.get('/api/vacancies', { params }),
  getMyVacancies: (params) => api.get('/api/vacancies/mine', { params }),
  getById: (id) => api.get(`/api/vacancies/${id}`),
  update: (id, data) => api.put(`/api/vacancies/${id}`, data),
  changeStatus: (id, status) => api.patch(`/api/vacancies/${id}/status`, { status }),
  delete: (id) => api.delete(`/api/vacancies/${id}`),
};
