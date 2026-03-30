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
}

interface ServicioState {
  servicioActivo: ServicioActivo | null;
  setServicioActivo: (servicio: ServicioActivo) => void;
  updateTecnicoLocation: (lat: number, lon: number) => void;
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

  clearServicioActivo: () => set({ servicioActivo: null }),
}));
