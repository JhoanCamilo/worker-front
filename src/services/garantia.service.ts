import { api } from "./api";

export interface GarantiaItem {
  id_garantia: number;
  id_servicio: number;
  tiempo_validez: string;
  fecha_expiracion: string;
  createdAt: string;
  Servicio?: {
    id_solicitud: number;
    valor_total: number;
    Solicitud?: {
      descripcion: string;
      subcategoria?: {
        nombre: string;
        Categorium?: { nombre: string };
      };
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

export async function getGarantiasCliente(
  page = 1,
  limit = 10,
): Promise<GarantiaResponse> {
  const { data } = await api.get("/garantias/cliente", {
    params: { page, limit },
  });
  return data.data;
}

export async function getGarantiasTecnico(
  page = 1,
  limit = 10,
): Promise<GarantiaResponse> {
  const { data } = await api.get("/garantias/tecnico", {
    params: { page, limit },
  });
  return data.data;
}

export async function getGarantiaByServicio(
  idServicio: number,
): Promise<GarantiaItem | null> {
  try {
    const { data } = await api.get(`/garantias/servicio/${idServicio}`);
    return data.data;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}
