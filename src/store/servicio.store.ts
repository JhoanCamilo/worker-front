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
  setServicioActivo: (servicio: ServicioActivo) => void;
  updateTecnicoLocation: (lat: number, lon: number) => void;
  updateFaseTracking: (fase: "EN_CAMINO" | "CERCA" | "LLEGO" | "EN_SERVICIO" | "FINALIZADO") => void;
  clearServicioActivo: () => void;
}

export const useServicioStore = create<ServicioState>((set) => ({
  servicioActivo: null,

  setServicioActivo: (servicio) => set({ servicioActivo: servicio }),

  updateTecnicoLocation: (lat, lon) =>
    set((state) => ({
      servicioActivo: state.servicioActivo
        ? { ...state.servicioActivo, tecnico_lat: lat, tecnico_lon: lon }
        : null,
    })),

  updateFaseTracking: (fase) =>
    set((state) => ({
      servicioActivo: state.servicioActivo
        ? { ...state.servicioActivo, fase_tracking: fase }
        : null,
    })),

  clearServicioActivo: () => set({ servicioActivo: null }),
}));
