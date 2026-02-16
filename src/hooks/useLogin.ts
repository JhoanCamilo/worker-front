import { useAuthStore } from "@/src/store/auth.store";
import { AuthUser } from "@/src/types/auth.types";

export function useLogin() {
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);

  const handleLogin = async (
    email: string,
    password: string,
  ): Promise<AuthUser> => {
    try {
      return await login({ email, password });
    } catch (err: any) {
      throw new Error(err?.message || "Error al iniciar sesión");
    }
  };

  return {
    handleLogin,
    loading,
  };
}
