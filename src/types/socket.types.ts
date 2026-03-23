// ── Payloads Cliente → Servidor ──────────────────────────────

export interface LocationPayload {
  id_solicitud: number;
  latitud: number;
  longitud: number;
  velocidad_kmh?: number;
  en_movimiento?: boolean;
}

export interface JoinRoomPayload {
  id_solicitud: number;
}

// ── Payloads Servidor → Cliente ──────────────────────────────

export interface NuevaSolicitudPayload {
  id_solicitud: number;
  id_cliente: number;
  id_subcategoria: number;
  subcategoria: string;
  descripcion: string;
  tipo_solicitud: "INMEDIATA" | "PROGRAMADA";
  prioridad: "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
  direccion_servicio: string;
  distancia_metros: number;
  priority_score: number;
}

export interface CotizacionPayload {
  id_cotizacion: number;
  id_solicitud: number;
  id_tecnico: number;
  valor_cotizacion: number;
  descripcion_trabajo: string;
  tiempo_estimado: string;
  estado: string;
}

export interface BatchListasPayload {
  id_solicitud: number;
  total_cotizaciones: number;
  razon: "TIMEOUT" | "MAX_COTIZACIONES";
}

export interface RechazoPayload {
  id_solicitud: number;
  id_cotizacion?: number;
  razon: "OTRA_ACEPTADA" | "RECHAZADA_POR_CLIENTE";
}

export interface ServicioPayload {
  id_servicio: number;
  id_solicitud: number;
  id_tecnico: number;
  id_estado: number;
  valor_total?: number;
}

export interface CalificacionPayload {
  id_servicio: number;
  id_cliente: number;
  puntuacion: number;
  comentario: string | null;
  nuevo_promedio: number;
}

export interface UbicacionPayload {
  id_solicitud: number;
  id_tecnico: number;
  latitud: number;
  longitud: number;
  velocidad_kmh: number;
  en_movimiento: boolean;
  timestamp: string;
  distancia_restante_metros: number | null;
}

export interface ProximidadPayload {
  id_solicitud: number;
  distancia_metros?: number;
}

export interface ErrorPayload {
  message: string;
}
