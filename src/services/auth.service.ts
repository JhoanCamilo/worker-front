// src/services/auth.service.ts
import { AuthResponse, LoginPayload } from "@/src/types/auth.types";
import { mockLogin } from "./auth.mock";

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  // mañana reemplazas mockLogin por fetch/axios
  return mockLogin(payload);
}
