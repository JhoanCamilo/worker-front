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
  let result: { lat: number; lon: number } | null = null;

  // 1. Campos planos directos
  if (isValidCoord(solicitud.latitud) && isValidCoord(solicitud.longitud)) {
    result = { lat: solicitud.latitud as number, lon: solicitud.longitud as number };
    console.log("[coords] Extraídas de campos planos:", result);
  }

  // 2. GeoJSON: ubicacion_solicitud
  if (!result) {
    const geoSolicitud = (solicitud as any).ubicacion_solicitud;
    if (geoSolicitud?.coordinates?.length === 2) {
      const [lon, lat] = geoSolicitud.coordinates;
      if (isValidCoord(lat) && isValidCoord(lon)) {
        result = { lat, lon };
        console.log("[coords] Extraídas de ubicacion_solicitud GeoJSON:", result);
      }
    }
  }

  // 3. GeoJSON: ubicacion_servicio
  if (!result) {
    const geoServicio = (solicitud as any).ubicacion_servicio;
    if (geoServicio?.coordinates?.length === 2) {
      const [lon, lat] = geoServicio.coordinates;
      if (isValidCoord(lat) && isValidCoord(lon)) {
        result = { lat, lon };
        console.log("[coords] Extraídas de ubicacion_servicio GeoJSON:", result);
      }
    }
  }

  // 4. Campos con nombres alternativos
  if (!result) {
    const lat = (solicitud as any).lat ?? (solicitud as any).latitude;
    const lon = (solicitud as any).lon ?? (solicitud as any).lng ?? (solicitud as any).longitude;
    if (isValidCoord(lat) && isValidCoord(lon)) {
      result = { lat, lon };
      console.log("[coords] Extraídas de campos alternativos:", result);
    }
  }

  if (!result) {
    console.warn("[coords] No se pudieron extraer coordenadas de:", JSON.stringify(solicitud, null, 2));
    return null;
  }

  // Validar que las coordenadas estén dentro de Colombia
  if (!isInColombia(result.lat, result.lon)) {
    console.warn("[coords] Coordenadas fuera de Colombia:", result, "- rechazadas");
    return null;
  }

  return result;
}

/** Verifica que un valor sea un número finito y no sea 0 (ubicación inválida) */
function isValidCoord(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value !== 0;
}

/**
 * Valida que las coordenadas estén dentro de Colombia (aprox).
 * Lat: -4.5 a 13.5 | Lon: -82 a -66
 */
function isInColombia(lat: number, lon: number): boolean {
  return lat >= -4.5 && lat <= 13.5 && lon >= -82 && lon <= -66;
}
