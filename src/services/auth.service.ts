import { LoginPayload, AuthResponse } from '@/src/types/auth.types'

export async function login(
  payload: LoginPayload
): Promise<AuthResponse> {
  /**
   * 🔁 MOCK TEMPORAL
   * Cuando haya backend, este cuerpo se reemplaza por:
   * return api.post('/auth/login', payload)
   */

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Técnico pendiente
      if (
        payload.email === 'tech@test.com' &&
        payload.password === '123456'
      ) {
        resolve({
          accessToken: 'mock-token-tech',
          user: {
            id: '1',
            name: 'Carlos Técnico',
            role: 2,
            state: 'pending_review',
          },
        })
        return
      }

      // Cliente activo
      if (
        payload.email === 'client@test.com' &&
        payload.password === '123456'
      ) {
        resolve({
          accessToken: 'mock-token-client',
          user: {
            id: '2',
            name: 'Ana Cliente',
            role: 3,
            state: 'active',
          },
        })
        return
      }

      reject(new Error('Credenciales inválidas'))
    }, 800)
  })
}