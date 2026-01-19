import { LoginPayload, AuthResponse } from './auth.types'

export async function mockLogin(
  payload: LoginPayload
): Promise<AuthResponse> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
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
            state: 'pending_review'
          },
        })
      } else if (
        payload.email === 'client@test.com' &&
        payload.password === '123456'
      ) {
        resolve({
          accessToken: 'mock-token-client',
          user: {
            id: '2',
            name: 'Ana Cliente',
            role: 3,
            state: 'active'
          },
        })
      } else {
        reject(new Error('Credenciales inválidas'))
      }
    }, 800)
  })
}