export type DestinoLogico = "AGENDA" | "SERVICIO_TRACKING";

export interface CotizacionAceptadaNormalizada {
  idSolicitud: number;
  idTecnico: number | null;
  tipoServicio: string | null;
  idCita: number | null;
  idServicio: number | null;
  estado: string | null;
  destinoLogico: DestinoLogico;
}

const VALID_DESTINOS = new Set<DestinoLogico>(["AGENDA", "SERVICIO_TRACKING"]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function inferDestino(
  destinoLogico: string | null,
  tipoServicio: string | null,
  idCita: number | null,
): DestinoLogico {
  if (destinoLogico && VALID_DESTINOS.has(destinoLogico as DestinoLogico)) {
    return destinoLogico as DestinoLogico;
  }

  const tipo = (tipoServicio ?? "").toUpperCase();
  if (tipo === "PROGRAMADO" || tipo === "PROGRAMADA" || idCita != null) {
    return "AGENDA";
  }

  return "SERVICIO_TRACKING";
}

/**
 * Normaliza COTIZACION_ACEPTADA desde WS o Push.
 * Soporta contrato nuevo canónico y fallback legacy temporal.
 */
export function normalizeCotizacionAceptada(
  payload: unknown,
): CotizacionAceptadaNormalizada | null {
  const root = asRecord(payload);
  if (!root) return null;

  const datos = asRecord(root.datos) ?? root;

  const idSolicitud = toNumberOrNull(datos.id_solicitud);
  if (idSolicitud == null) return null;

  const idTecnico = toNumberOrNull(datos.id_tecnico);
  const tipoServicio = toStringOrNull(datos.tipo_servicio);
  const idCita = toNumberOrNull(datos.id_cita);
  const idServicio = toNumberOrNull(datos.id_servicio);
  const estado = toStringOrNull(datos.estado);
  const destinoRaw = toStringOrNull(datos.destino_logico);

  return {
    idSolicitud,
    idTecnico,
    tipoServicio,
    idCita,
    idServicio,
    estado,
    destinoLogico: inferDestino(destinoRaw, tipoServicio, idCita),
  };
}
