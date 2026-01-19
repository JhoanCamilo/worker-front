import { create } from 'zustand'
import { login } from '@/src/services/auth.service'
import { AuthUser, LoginPayload } from '@/src/types/auth.types'

interface AuthState {
  token: string | null
  user: AuthUser | null
  loading: boolean

  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>(set => ({
  token: null,
  user: null,
  loading: false,

  login: async payload => {
    set({ loading: true })

    try {
      const response = await login(payload)

      set({
        token: response.accessToken,
        user: response.user,
        loading: false,
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  logout: () =>
    set({
      token: null,
      user: null,
    }),
}))