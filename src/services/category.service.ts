import { api } from "./api";

export interface ApiCategoria {
  id_categoria: number;
  nombre: string;
}

export interface ApiSubcategoria {
  id_subcategoria: number;
  nombre: string;
  id_categoria: number;
}

export async function getCategorias(): Promise<ApiCategoria[]> {
  const { data } = await api.get("/categorias");
  return data.data ?? data;
}

export async function getSubcategorias(
  categoryId: number,
): Promise<ApiSubcategoria[]> {
  const { data } = await api.get(`/subcategorias?id_categoria=${categoryId}`);
  return data.data ?? data;
}
