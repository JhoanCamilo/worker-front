import {
    TechnicianCitaProximaAsignada,
    TechnicianDisponibilidadActual,
    TechnicianSolicitudInmediataPendiente,
} from "@/src/services/technician.service";
import { create } from "zustand";

interface TecnicoEstadoState {
  disponibilidad: TechnicianDisponibilidadActual | null;
  citasProximasAsignadas: TechnicianCitaProximaAsignada[];
  solicitudInmediataPendiente: TechnicianSolicitudInmediataPendiente | null;
  hydratedAt: string | null;

  setEstadoActual: (payload: {
    disponibilidad: TechnicianDisponibilidadActual;
    citasProximasAsignadas: TechnicianCitaProximaAsignada[];
    solicitudInmediataPendiente: TechnicianSolicitudInmediataPendiente | null;
  }) => void;
  clearEstadoActual: () => void;
}

export const useTecnicoEstadoStore = create<TecnicoEstadoState>((set) => ({
  disponibilidad: null,
  citasProximasAsignadas: [],
  solicitudInmediataPendiente: null,
  hydratedAt: null,

  setEstadoActual: ({
    disponibilidad,
    citasProximasAsignadas,
    solicitudInmediataPendiente,
  }) =>
    set({
      disponibilidad,
      citasProximasAsignadas,
      solicitudInmediataPendiente,
      hydratedAt: new Date().toISOString(),
    }),

  clearEstadoActual: () =>
    set({
      disponibilidad: null,
      citasProximasAsignadas: [],
      solicitudInmediataPendiente: null,
      hydratedAt: null,
    }),
}));
