import api from './api';

export const shopService = {
  getMyProfile: () => api.get('/api/shops/me'),
  updateMyProfile: (data) => api.put('/api/shops/me', data),
  getShopById: (id) => api.get(`/api/shops/${id}`),
};
