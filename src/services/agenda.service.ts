import { api } from "./api";

export interface CitaAgenda {
  id_cita: number;
  id_solicitud: number;
  fecha_cita: string;
  notas: string | null;
  id_estado: number;
  solicitud: {
    id_solicitud: number;
    descripcion: string;
    tipo_servicio: string;
    direccion_servicio: string;
    subcategoria: {
      id_subcategoria: number;
      nombre: string;
      Categoria: {
        id_categoria: number;
        nombre: string;
      };
    };
    cliente: {
      id_cliente: number;
      datos_usuario: {
        nombre: string;
        apellido: string;
        telefono?: string;
      };
    };
  };
  estado: {
    id_estado: number;
    descripcion: string;
  };
}

interface AgendaResponse {
  citas: CitaAgenda[];
  total: number;
  page: number;
  limit: number;
  total_paginas: number;
}

/** GET /api/tecnicos/agenda — backend wraps in { success, data: { ... } } */
export async function getAgenda(
  page = 1,
  limit = 20,
  fechaDesde?: string,
  fechaHasta?: string,
  idEstado?: number,
): Promise<AgendaResponse> {
  const { data } = await api.get("/tecnicos/agenda", {
    params: {
      page,
      limit,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      id_estado: idEstado,
    },
  });
  // data = { success, message, data: { citas, total, ... } }
  return data.data;
}
