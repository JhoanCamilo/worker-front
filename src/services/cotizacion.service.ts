import { api } from "./api";

export interface CrearCotizacionPayload {
  id_solicitud: number;
  valor_cotizacion: number;
  descripcion: string;
  tiempo_estimado: string;
  incluye_materiales?: boolean;
  dias_garantia?: number;
}

export interface TecnicoCotizacion {
  nombre: string;
  apellido: string;
  foto_perfil?: string | null;
  promedio_calificacion?: number | null;
  total_servicios?: number;
}

export interface CotizacionItem {
  id_cotizacion: number;
  id_solicitud: number;
  id_tecnico: number;
  valor_cotizacion: number;
  descripcion_trabajo: string;
  tiempo_estimado: string;
  estado: string;
  incluye_materiales?: boolean;
  dias_garantia?: number;
  tecnico?: TecnicoCotizacion | null;
}

interface ApiCotizacionItem {
  id_cotizacion: number;
  id_solicitud: number;
  id_tecnico: number;
  valor_cotizacion: number;
  descripcion?: string;
  descripcion_trabajo?: string;
  tiempo_estimado: string;
  estado: string;
  incluye_materiales?: boolean;
  dias_garantia?: number;
  Tecnico?: any;
  tecnico?: any;
}

const toCotizacionItem = (item: ApiCotizacionItem): CotizacionItem => {
  const raw = item.Tecnico ?? item.tecnico;
  const tecnico: TecnicoCotizacion | null = raw
    ? {
        nombre: raw.nombre ?? raw.Usuario?.nombre ?? "",
        apellido: raw.apellido ?? raw.Usuario?.apellido ?? "",
        foto_perfil: raw.foto_perfil ?? raw.Usuario?.foto_perfil ?? null,
        promedio_calificacion: raw.promedio_calificacion ?? null,
        total_servicios: raw.total_servicios ?? 0,
      }
    : null;

  return {
    id_cotizacion: item.id_cotizacion,
    id_solicitud: item.id_solicitud,
    id_tecnico: item.id_tecnico,
    valor_cotizacion: item.valor_cotizacion,
    descripcion_trabajo: item.descripcion_trabajo ?? item.descripcion ?? "",
    tiempo_estimado: item.tiempo_estimado,
    estado: item.estado,
    incluye_materiales: item.incluye_materiales,
    dias_garantia: item.dias_garantia,
    tecnico,
  };
};

export async function crearCotizacion(
  payload: CrearCotizacionPayload,
): Promise<CotizacionItem> {
  const { data } = await api.post("/cotizaciones", payload);
  const raw: ApiCotizacionItem = data.data ?? data;
  return toCotizacionItem(raw);
}

export async function getCotizacionesBySolicitud(
  idSolicitud: number,
): Promise<CotizacionItem[]> {
  const { data } = await api.get(`/cotizaciones/solicitud/${idSolicitud}`);
  const raw = data.data ?? data;

  if (Array.isArray(raw)) {
    return raw.map((item) => toCotizacionItem(item));
  }

  if (Array.isArray(raw?.cotizaciones)) {
    return raw.cotizaciones.map((item: ApiCotizacionItem) =>
      toCotizacionItem(item),
    );
  }

  return [];
}

export async function aceptarCotizacion(idCotizacion: number): Promise<void> {
  await api.put(`/cotizaciones/${idCotizacion}/aceptar`);
}
