import { api } from "./api";

export type Prioridad = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";

export interface SolicitudBasePayload {
  id_subcategoria?: number;
  descripcion: string;
  latitud: number;
  longitud: number;
  prioridad: Prioridad;
  direccion?: string;
}

export interface SolicitudProgramadaPayload extends SolicitudBasePayload {
  fecha_programada: string; // ISO 8601 — requerido para programada
}

export interface SolicitudResponse {
  id_solicitud: number;
  tipo_servicio: string;
  id_estado: number;
  tecnicos_notificados: number;
}

export async function createSolicitudInmediata(
  payload: SolicitudBasePayload,
): Promise<SolicitudResponse> {
  const { data } = await api.post("/solicitudes/inmediata", payload);
  return data.data ?? data;
}

export async function createSolicitudProgramada(
  payload: SolicitudProgramadaPayload,
): Promise<SolicitudResponse> {
  const { data } = await api.post("/solicitudes/programada", payload);
  return data.data ?? data;
}

export async function cancelarSolicitud(id: number): Promise<void> {
  await api.delete(`/solicitudes/${id}`);
}

export interface SolicitudDetalle {
  id_solicitud: number;
  descripcion: string;
  prioridad: string;
  tipo_servicio: "INMEDIATA" | "PROGRAMADA";
  id_estado: number;
  estado: { descripcion: string };
  subcategoria: {
    nombre: string;
    Categorium: { nombre: string };
  };
  fecha_programada?: string | null;
  direccion_servicio?: string | null;
  // Coordenadas — el backend almacena como GEOMETRY POINT(lon, lat)
  // pero puede devolverlas como campos planos o como ubicacion_solicitud GeoJSON
  latitud?: number;
  longitud?: number;
  ubicacion_solicitud?: {
    type: string;
    coordinates: [number, number]; // [longitud, latitud] — orden GeoJSON
  };
}

export async function getSolicitudDetalle(
  id: number,
): Promise<SolicitudDetalle> {
  const { data } = await api.get(`/solicitudes/${id}`);
  return data.data ?? data;
}
