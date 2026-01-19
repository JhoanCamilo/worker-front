import { create } from 'zustand'
import { RegisterPayload, RegisterRole } from '@/src/types/register'

interface RegisterState {
  payload: Partial<RegisterPayload>

  setRole: (role: RegisterRole) => void
  setPersonalData: (data: Partial<RegisterPayload>) => void
  clear: () => void
}

export const useRegisterStore = create<RegisterState>(set => ({
  payload: {},

  setRole: role =>
    set(state => ({
      payload: { ...state.payload, role },
    })),

  setPersonalData: data =>
    set(state => ({
      payload: { ...state.payload, ...data },
    })),

  clear: () => set({ payload: {} }),
}))
