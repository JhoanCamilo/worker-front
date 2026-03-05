import { api } from "./api";

export interface TechnicianProfile {
  nombre: string;
  apellido: string;
  telefono: string;
  correo_electronico: string;
  fecha_nacimiento: string;
  num_identificacion: string;
  id_ciudad: number | null;
}

export async function getTechnicianProfile(): Promise<TechnicianProfile> {
  const { data } = await api.get("/tecnicos/perfil");
  return data.data ?? data;
}

export async function updateDisponibilidad(disponible: boolean): Promise<void> {
  await api.put("/tecnicos/perfil", { disponible_inmediato: disponible });
}
