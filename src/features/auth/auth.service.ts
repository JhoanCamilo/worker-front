import { LoginPayload, AuthResponse } from './auth.types'
import { mockLogin } from './auth.mock'
import { api } from '@/src/services/api'

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true'

export async function login(
  payload: LoginPayload
): Promise<AuthResponse> {
  if (USE_MOCK) {
    return mockLogin(payload)
  }

  const { data } = await api.post<AuthResponse>('/auth/login', payload)
  return data
}
