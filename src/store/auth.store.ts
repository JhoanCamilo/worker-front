import AsyncStorage from "@react-native-async-storage/async-storage";
import { login } from "@/src/services/auth.service";
import { updateDisponibilidad } from "@/src/services/technician.service";
import { AuthUser, LoginPayload, UserRole } from "@/src/types/auth.types";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;

  login: (payload: LoginPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      logout: async () => {
        if (get().user?.role === UserRole.TECH) {
          try {
            await updateDisponibilidad(false);
          } catch {
            // always logout even if the call fails
          }
        }
        set({ token: null, user: null });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
