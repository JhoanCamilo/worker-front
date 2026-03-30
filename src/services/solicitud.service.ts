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
  tipo_servicio: "INMEDIATA" | "PROGRAMADA" | "INMEDIATO" | "PROGRAMADO";
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

// ── Mis solicitudes (agenda del cliente) ──────────────────────

export interface SolicitudCliente {
  id_solicitud: number;
  tipo_servicio: "PROGRAMADO" | "INMEDIATA";
  descripcion: string;
  fecha_solicitud: string;
  estado: { id_estado: number; descripcion: string };
  subcategoria: {
    id_subcategoria: number;
    nombre: string;
    Categoria: { id_categoria: number; nombre: string };
  };
  cotizaciones: Array<{
    id_cotizacion: number;
    valor_cotizacion: string;
    estado: string;
    tecnico: {
      id_tecnico: number;
      url_foto: string | null;
      prom_calificacion: number | null;
      datos_usuario: { nombre: string; apellido: string; telefono?: string };
    };
  }>;
  servicios_generados: Array<{
    id_servicio: number;
    id_estado: number;
    valor_total: string;
    estado: { id_estado: number; descripcion: string };
  }>;
  citas: Array<{
    id_cita: number;
    fecha_cita: string;
    id_estado: number;
  }>;
}

export interface MisSolicitudesResponse {
  total: number;
  page: number;
  limit: number;
  total_paginas: number;
  solicitudes: SolicitudCliente[];
}

export async function getMisSolicitudes(
  page = 1,
  limit = 10,
  tipo_servicio?: string,
): Promise<MisSolicitudesResponse> {
  const { data } = await api.get("/solicitudes/mis-solicitudes", {
    params: { page, limit, tipo_servicio },
  });
  return data.data;
}

export async function getSolicitudesTecnicoPendientes(): Promise<unknown> {
  const { data } = await api.get("/solicitudes/tecnico/pendientes");
  return data.data ?? data;
}
