import { create } from "zustand";

export interface ServicioActivo {
  id_servicio: number;
  id_solicitud: number;
  id_tecnico: number;
  id_estado: number;
  valor_total?: number;
  valor_cotizacion?: number; // Valor acordado en la cotización
  cliente_lat: number;
  cliente_lon: number;
  tecnico_lat?: number;
  tecnico_lon?: number;
  fase_tracking?: "EN_CAMINO" | "CERCA" | "LLEGO" | "EN_SERVICIO" | "FINALIZADO";
}

interface ServicioState {
  servicioActivo: ServicioActivo | null;
  navigatingToCalificar: boolean;
  valorUltimoServicio: number | null;
  setServicioActivo: (servicio: ServicioActivo) => void;
  updateTecnicoLocation: (lat: number, lon: number) => void;
  updateFaseTracking: (fase: "EN_CAMINO" | "CERCA" | "LLEGO" | "EN_SERVICIO" | "FINALIZADO") => void;
  clearServicioActivo: () => void;
  setNavigatingToCalificar: (value: boolean) => void;
  setValorUltimoServicio: (value: number | null) => void;
}

export const useServicioStore = create<ServicioState>((set) => ({
  servicioActivo: null,
  navigatingToCalificar: false,
  valorUltimoServicio: null,

  setServicioActivo: (servicio) => set({ servicioActivo: servicio }),

  updateTecnicoLocation: (lat, lon) =>
    set((state) => {
      if (
        state.servicioActivo?.tecnico_lat === lat &&
        state.servicioActivo?.tecnico_lon === lon
      ) return state;
      return {
        servicioActivo: state.servicioActivo
          ? { ...state.servicioActivo, tecnico_lat: lat, tecnico_lon: lon }
          : null,
      };
    }),

  updateFaseTracking: (fase) =>
    set((state) => {
      if (state.servicioActivo?.fase_tracking === fase) return state;
      return {
        servicioActivo: state.servicioActivo
          ? { ...state.servicioActivo, fase_tracking: fase }
          : null,
      };
    }),

  clearServicioActivo: () => set({ servicioActivo: null }),

  setNavigatingToCalificar: (value) => set({ navigatingToCalificar: value }),

  setValorUltimoServicio: (value) => set({ valorUltimoServicio: value }),
}));
