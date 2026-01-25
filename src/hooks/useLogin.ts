import { useAuthStore } from "@/src/store/auth.store";
import { AuthUser } from "@/src/types/auth.types";

export function useLogin() {
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);

  const handleLogin = async (
    email: string,
    password: string,
  ): Promise<AuthUser> => {
    // 🔑 RETORNAMOS el usuario
    return login({ email, password });
  };

  return {
    handleLogin,
    loading,
  };
}
