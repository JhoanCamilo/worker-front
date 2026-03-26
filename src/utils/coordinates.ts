import { SolicitudDetalle } from "@/src/services/solicitud.service";

/**
 * Extrae latitud y longitud de una SolicitudDetalle.
 * El backend puede devolver las coordenadas en varios formatos:
 * - Campos planos: `latitud`, `longitud`
 * - GeoJSON: `ubicacion_solicitud.coordinates` → [longitud, latitud]
 * - GeoJSON alternativo: `ubicacion_servicio.coordinates` → [longitud, latitud]
 * - Campos dentro de nested objects
 */
export function extraerCoordenadas(
  solicitud: SolicitudDetalle | Record<string, any>,
): { lat: number; lon: number } | null {
  // 1. Campos planos directos
  if (isValidCoord(solicitud.latitud) && isValidCoord(solicitud.longitud)) {
    const result = { lat: solicitud.latitud as number, lon: solicitud.longitud as number };
    console.log("[coords] Extraídas de campos planos:", result);
    return result;
  }

  // 2. GeoJSON: ubicacion_solicitud
  const geoSolicitud = (solicitud as any).ubicacion_solicitud;
  if (geoSolicitud?.coordinates?.length === 2) {
    const [lon, lat] = geoSolicitud.coordinates;
    if (isValidCoord(lat) && isValidCoord(lon)) {
      const result = { lat, lon };
      console.log("[coords] Extraídas de ubicacion_solicitud GeoJSON:", result);
      return result;
    }
  }

  // 3. GeoJSON: ubicacion_servicio
  const geoServicio = (solicitud as any).ubicacion_servicio;
  if (geoServicio?.coordinates?.length === 2) {
    const [lon, lat] = geoServicio.coordinates;
    if (isValidCoord(lat) && isValidCoord(lon)) {
      const result = { lat, lon };
      console.log("[coords] Extraídas de ubicacion_servicio GeoJSON:", result);
      return result;
    }
  }

  // 4. Campos con nombres alternativos
  const lat = (solicitud as any).lat ?? (solicitud as any).latitude;
  const lon = (solicitud as any).lon ?? (solicitud as any).lng ?? (solicitud as any).longitude;
  if (isValidCoord(lat) && isValidCoord(lon)) {
    const result = { lat, lon };
    console.log("[coords] Extraídas de campos alternativos:", result);
    return result;
  }

  console.warn("[coords] No se pudieron extraer coordenadas de:", JSON.stringify(solicitud, null, 2));
  return null;
}

/** Verifica que un valor sea un número finito y no sea 0,0 (ubicación inválida) */
function isValidCoord(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
