import { api } from "./api";

export interface ApiCiudad {
  id_ciudad: number;
  nombre_ciudad: string;
}

interface ApiCiudadesResponse {
  success: boolean;
  message: string;
  total: number;
  data: ApiCiudad[];
}

export async function getCiudades(): Promise<ApiCiudad[]> {
  const { data } = await api.get<ApiCiudadesResponse>("/ciudades");
  return data.data;
}
