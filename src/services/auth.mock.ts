// src/services/auth.mock.ts
import { mockUsers } from "@/src/mocks/user.mock";
import { AuthResponse, LoginPayload } from "@/src/types/auth.types";

export async function mockLogin(payload: LoginPayload): Promise<AuthResponse> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(
        (u) => u.email === payload.email && u.password === payload.password,
      );

      if (!user) {
        reject(new Error("Credenciales inválidas"));
        return;
      }

      resolve({
        accessToken: "mock-token-" + user.id,
        user,
      });
    }, 800);
  });
}
