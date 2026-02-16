import AsyncStorage from "@react-native-async-storage/async-storage";
import { login } from "@/src/services/auth.service";
import { AuthUser, LoginPayload } from "@/src/types/auth.types";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;

  login: (payload: LoginPayload) => Promise<AuthUser>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      loading: false,

      login: async (payload) => {
        set({ loading: true });

        try {
          const response = await login(payload);

          set({
            token: response.accessToken,
            user: response.user,
            loading: false,
          });

          return response.user;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      logout: () =>
        set({
          token: null,
          user: null,
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
