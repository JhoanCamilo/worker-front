export interface LoginPayload {
  email: string;
  password: string;
}

export enum UserRole {
  TECH = 2,
  CLIENT = 3,
}

export enum TechStatus {
  PENDING = "PENDIENTE_VALIDACION",
  ACTIVE = "ACTIVO",
}

export interface AuthUser {
  id?: string;
  name: string;
  role: UserRole;
  state?: TechStatus;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

/** Contrato exacto que devuelve POST /auth/login */
export interface ApiLoginResponse {
  message: string;
  token: string;
  usuario: {
    nombre: string;
    rol: "TECNICO" | "CLIENTE";
    estado_validacion?: "PENDIENTE_VALIDACION" | "ACTIVO";
  };
}
