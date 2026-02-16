import { AuthResponse, LoginPayload } from "@/src/types/auth.types";
import { api } from "./api";
import { mockLogin } from "./auth.mock";

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_API === "true";

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  if (USE_MOCK) {
    return mockLogin(payload);
  }

  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}
