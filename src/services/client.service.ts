import { api } from "./api";

export interface ClientProfile {
  nombre: string;
  apellido: string;
  telefono: string;
  correo_electronico: string;
  fecha_nacimiento: string;
  num_identificacion: string;
  id_ciudad: number | null;
}

export async function getClientProfile(): Promise<ClientProfile> {
  const { data } = await api.get("/clientes/perfil");
  return data.data ?? data;
}
