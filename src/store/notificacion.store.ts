import { create } from "zustand";

interface NotificacionState {
  noLeidas: number;
  setNoLeidas: (count: number) => void;
  incrementNoLeidas: () => void;
  decrementNoLeidas: () => void;
  clearNoLeidas: () => void;
}

export const useNotificacionStore = create<NotificacionState>((set) => ({
  noLeidas: 0,
  setNoLeidas: (count) => set({ noLeidas: count }),
  incrementNoLeidas: () =>
    set((state) => ({ noLeidas: state.noLeidas + 1 })),
  decrementNoLeidas: () =>
    set((state) => ({ noLeidas: Math.max(0, state.noLeidas - 1) })),
  clearNoLeidas: () => set({ noLeidas: 0 }),
}));
