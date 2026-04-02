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
  const latPlano = parseCoord(solicitud.latitud);
  const lonPlano = parseCoord(solicitud.longitud);
  if (latPlano !== null && lonPlano !== null) {
    result = { lat: latPlano, lon: lonPlano };
    console.log("[coords] Extraídas de campos planos:", result);
  }

  // 2. GeoJSON: ubicacion_solicitud
  if (!result) {
    const geoSolicitud = (solicitud as any).ubicacion_solicitud;
    if (geoSolicitud?.coordinates?.length === 2) {
      const parsedLon = parseCoord(geoSolicitud.coordinates[0]);
      const parsedLat = parseCoord(geoSolicitud.coordinates[1]);
      if (parsedLat !== null && parsedLon !== null) {
        result = { lat: parsedLat, lon: parsedLon };
        console.log("[coords] Extraídas de ubicacion_solicitud GeoJSON:", result);
      }
    }
  }

  // 3. GeoJSON: ubicacion_servicio
  if (!result) {
    const geoServicio = (solicitud as any).ubicacion_servicio;
    if (geoServicio?.coordinates?.length === 2) {
      const parsedLon = parseCoord(geoServicio.coordinates[0]);
      const parsedLat = parseCoord(geoServicio.coordinates[1]);
      if (parsedLat !== null && parsedLon !== null) {
        result = { lat: parsedLat, lon: parsedLon };
        console.log("[coords] Extraídas de ubicacion_servicio GeoJSON:", result);
      }
    }
  }

  // 4. Campos con nombres alternativos
  if (!result) {
    const latAlt = parseCoord((solicitud as any).lat ?? (solicitud as any).latitude);
    const lonAlt = parseCoord((solicitud as any).lon ?? (solicitud as any).lng ?? (solicitud as any).longitude);
    if (latAlt !== null && lonAlt !== null) {
      result = { lat: latAlt, lon: lonAlt };
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

/** Intenta transformar dinámicamente el valor en número finito real */
function parseCoord(value: unknown): number | null {
  let num: number;
  if (typeof value === "number") {
    num = value;
  } else if (typeof value === "string") {
    num = Number(value);
  } else {
    return null;
  }
  return Number.isFinite(num) && num !== 0 ? num : null;
}

/**
 * Valida que las coordenadas estén dentro de Colombia (aprox).
 * Lat: -4.5 a 13.5 | Lon: -82 a -66
 */
function isInColombia(lat: number, lon: number): boolean {
  return lat >= -4.5 && lat <= 13.5 && lon >= -82 && lon <= -66;
}
