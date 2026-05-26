import type { Promotion } from '../types/api'
import { MOCK_PROMOTIONS } from '../mocks/promotions'

// M4: replace body with → return axios.get<Promotion[]>('/promotions').then(r => r.data)
export async function fetchPromotions(): Promise<Promotion[]> {
  return Promise.resolve(MOCK_PROMOTIONS)
}
