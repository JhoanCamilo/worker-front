export interface LoginPayload {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  name: string
  role: number // 2 = técnico, 3 = cliente
  state: 'pending_review' | 'active'
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}