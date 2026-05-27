import type { AuthResponse } from '../types/api'
import { apiClient } from './client'

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data)
}

export async function register(email: string, username: string, password: string): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/register', { email, username, password }).then(r => r.data)
}
