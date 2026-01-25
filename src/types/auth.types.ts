export interface LoginPayload {
  email: string;
  password: string;
}

export enum UserRole {
  TECH = 2,
  CLIENT = 3,
}

export enum TechStatus {
  PENDING = "pending_review",
  ACTIVE = "active",
}

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  state?: TechStatus;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
