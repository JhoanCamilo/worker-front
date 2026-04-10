import { api } from "./api";

export interface GarantiaItem {
  id_garantia: number;
  id_servicio: number;
  tiempo_validez: string;
  fecha_expiracion: string;
  createdAt: string;
  servicio?: {
    fecha_servicio?: string;
    subcategoria?: { nombre: string };
    tecnico?: {
      datos_usuario?: { nombre: string; apellido: string };
    };
    cliente?: {
      datos_usuario?: { nombre: string; apellido: string };
    };
  };
}

export interface GarantiaResponse {
  total: number;
  page: number;
  limit: number;
  total_paginas: number;
  garantias: GarantiaItem[];
}

function normalizeGarantiaResponse(data: any): GarantiaResponse {
  const items: GarantiaItem[] = Array.isArray(data.data) ? data.data : [];
  return {
    garantias:    items,
    total:        data.total        ?? items.length,
    total_paginas: data.total_paginas ?? 1,
    page:         data.page         ?? 1,
    limit:        data.limit        ?? items.length,
  };
}

export async function getGarantiasCliente(
  page = 1,
  limit = 10,
): Promise<GarantiaResponse> {
  const { data } = await api.get("/garantias/cliente", {
    params: { page, limit },
  });
  return normalizeGarantiaResponse(data);
}

export async function getGarantiasTecnico(
  page = 1,
  limit = 10,
): Promise<GarantiaResponse> {
  const { data } = await api.get("/garantias/tecnico", {
    params: { page, limit },
  });
  return normalizeGarantiaResponse(data);
}

export async function getGarantiaByServicio(
  idServicio: number,
): Promise<GarantiaItem | null> {
  try {
    const { data } = await api.get(`/garantias/servicio/${idServicio}`);
    return data.data ?? null;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}
