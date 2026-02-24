import api from './api'

export const providerService = {
  getNearby: (lat, lng, amount, radius = 5) =>
    api.get('/providers/nearby', { params: { lat, lng, amount, radius_km: radius } }),

  getMyProvider: () =>
    api.get('/providers/my'),

  getById: (id) =>
    api.get(`/providers/${id}`),

  create: (data) =>
    api.post('/providers/', data),

  update: (id, data) =>
    api.patch(`/providers/${id}`, data),

  setAvailability: (id, is_available, declared_liquidity = null) =>
    api.post(`/providers/${id}/availability`, { is_available, declared_liquidity }),
}
