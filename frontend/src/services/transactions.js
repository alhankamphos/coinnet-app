import api from './api'

export const transactionService = {
  create: (provider_id, requested_amount) =>
    api.post('/transactions/', { provider_id, requested_amount }),

  getById: (id) =>
    api.get(`/transactions/${id}`),

  getMy: () =>
    api.get('/transactions/my'),

  getProviderPending: () =>
    api.get('/transactions/provider/pending'),

  accept: (id) =>
    api.patch(`/transactions/${id}/accept`),

  markSinpeSent: (id) =>
    api.patch(`/transactions/${id}/sinpe-sent`),

  uploadProof: (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/transactions/${id}/proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  verify: (id) =>
    api.patch(`/transactions/${id}/verify`),

  complete: (id) =>
    api.patch(`/transactions/${id}/complete`),

  cancel: (id) =>
    api.patch(`/transactions/${id}/cancel`),

  dispute: (id, reason) =>
    api.post(`/transactions/${id}/dispute`, { reason }),
}
