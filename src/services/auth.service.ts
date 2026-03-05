import {
  ApiLoginResponse,
  AuthResponse,
  LoginPayload,
  TechStatus,
  UserRole,
} from "@/src/types/auth.types";
import { api } from "./api";
import { mockLogin } from "./auth.mock";

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_API === "true";

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  if (USE_MOCK) {
    return mockLogin(payload);
  }

  const { data } = await api.post<ApiLoginResponse>("/auth/login", {
    correo_electronico: payload.email,
    contraseña: payload.password,
  });

  return {
    accessToken: data.token,
    user: {
      name: data.usuario.nombre,
      role: data.usuario.rol === "TECNICO" ? UserRole.TECH : UserRole.CLIENT,
      state: data.usuario.estado_validacion as TechStatus | undefined,
    },
  };
}
