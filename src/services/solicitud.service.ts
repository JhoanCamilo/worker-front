import { api } from "./api";

export type Prioridad = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";

export interface SolicitudInmediataPayload {
  id_subcategoria: number | null;
  descripcion: string;
  latitud: number;
  longitud: number;
  prioridad: Prioridad;
}

export interface SolicitudInmediataResponse {
  id_solicitud: number;
  tipo_servicio: string;
  id_estado: number;
  tecnicos_notificados: number;
}

export async function createSolicitudInmediata(
  payload: SolicitudInmediataPayload,
): Promise<SolicitudInmediataResponse> {
  const { data } = await api.post("/solicitudes/inmediata", payload);
  return data.data ?? data;
}

export async function cancelarSolicitud(id: number): Promise<void> {
  await api.delete(`/solicitudes/${id}`);
}

export interface SolicitudDetalle {
  id_solicitud: number;
  descripcion: string;
  prioridad: string;
  tipo_servicio: string;
  id_estado: number;
  estado: { descripcion: string };
  subcategoria: {
    nombre: string;
    Categorium: { nombre: string };
  };
}

export async function getSolicitudDetalle(id: number): Promise<SolicitudDetalle> {
  const { data } = await api.get(`/solicitudes/${id}`);
  return data.data ?? data;
}
