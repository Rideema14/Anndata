import { api } from './api'

export const weatherService = {
  getWeather: async (lat: number, lng: number, days?: number) => {
    const response = await api.get('/weather', { params: { lat, lng, days } })
    return response.data
  }
}
