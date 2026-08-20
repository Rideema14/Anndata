import { api } from './api'

export interface MandiAlertPayload {
  cropId: string;
  mandiId?: string;
  priceType?: 'MIN' | 'MAX' | 'MODAL';
  condition: 'ABOVE' | 'BELOW';
  thresholdPrice: number;
  isActive?: boolean;
}

export const mandiService = {
  // Locations
  getStates: async () => {
    const response = await api.get('/mandi/states')
    return response.data
  },
  getDistricts: async (state: string) => {
    const response = await api.get(`/mandi/districts`, { params: { state } })
    return response.data
  },
  getMarkets: async (params?: { state?: string; district?: string }) => {
    const response = await api.get(`/mandi/markets`, { params })
    return response.data
  },

  // Crops
  getCrops: async () => {
    const response = await api.get('/mandi/crops')
    return response.data
  },

  // Prices
  getPrices: async (params: { state?: string; district?: string; mandiId?: string; cropId?: string; startDate?: string; endDate?: string; limit?: number; page?: number }) => {
    const response = await api.get('/mandi/prices', { params })
    return response.data
  },
  getPriceHistory: async (params: { mandiId: string; cropId: string; days?: number }) => {
    const response = await api.get('/mandi/prices/history', { params })
    return response.data
  },

  // Favorites
  getFavorites: async () => {
    const response = await api.get('/mandi/favorites')
    return response.data
  },
  addFavorite: async (mandiId: string) => {
    const response = await api.post(`/mandi/favorites/${mandiId}`)
    return response.data
  },
  removeFavorite: async (mandiId: string) => {
    const response = await api.delete(`/mandi/favorites/${mandiId}`)
    return response.data
  },

  // Alerts
  getAlerts: async () => {
    const response = await api.get('/mandi/alerts')
    return response.data
  },
  createAlert: async (data: MandiAlertPayload) => {
    const response = await api.post('/mandi/alerts', data)
    return response.data
  },
  updateAlert: async (id: string, data: Partial<MandiAlertPayload & { active: boolean }>) => {
    const response = await api.patch(`/mandi/alerts/${id}`, data)
    return response.data
  },
  deleteAlert: async (id: string) => {
    const response = await api.delete(`/mandi/alerts/${id}`)
    return response.data
  }
}
