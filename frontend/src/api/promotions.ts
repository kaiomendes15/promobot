import type { Promotion } from '../types/api'
import { MOCK_PROMOTIONS } from '../mocks/promotions'
import { apiClient } from './client'

export async function fetchPromotions(): Promise<Promotion[]> {
  // M4: return apiClient.get<Promotion[]>('/promotions').then(r => r.data)
  void apiClient
  return Promise.resolve(MOCK_PROMOTIONS)
}
