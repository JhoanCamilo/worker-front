import { api } from "./api";

export interface TechnicianProfile {
  id_tecnico: number;
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  telefono: string;
  num_identificacion: string;
  fecha_nacimiento: string;
  tipo_documento: string;
  url_foto: string | null;
  id_ciudad: number | null;
  ciudad_base: string | null;
  ciudades_operacion: { id_ciudad: number; nombre_ciudad: string }[];
  estado_validacion: string;
  prom_calificacion: number | null;
  disponible_inmediato: boolean;
}

export async function getTechnicianProfile(): Promise<TechnicianProfile> {
  const { data } = await api.get("/tecnicos/perfil");
  return data.data ?? data;
}

export async function updateDisponibilidad(
  disponible: boolean,
  coords?: { latitud: number; longitud: number },
): Promise<void> {
  await api.put("/tecnicos/perfil", {
    disponible_inmediato: disponible,
    ...(coords ?? {}),
  });
}

export async function uploadTechnicianPhoto(uri: string): Promise<string> {
  const filename = uri.split("/").pop() ?? "photo.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  const formData = new FormData();
  formData.append("foto", { uri, name: filename, type } as any);

  const { data } = await api.post("/tecnicos/foto", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data.url_foto;
}

export interface TechnicianEspecialidad {
  id_especialidad: number;
  id_subcategoria: number;
  subcategoria: string;
  categoria: string | null;
  experiencia: string;
  fecha_agregada: string;
}

export async function getTechnicianEspecialidades(): Promise<TechnicianEspecialidad[]> {
  const { data } = await api.get("/tecnicos/especialidades");
  return data.data;
}

export async function addTechnicianEspecialidades(
  especialidades: { id_subcategoria: number; experiencia: string }[],
): Promise<void> {
  await api.post("/tecnicos/especialidades", { especialidades });
}

export async function deleteTechnicianEspecialidad(id: number): Promise<void> {
  await api.delete(`/tecnicos/especialidades/${id}`);
}

export interface TechnicianCitiesData {
  ciudad_base: { id_ciudad: number; nombre_ciudad: string };
  ciudades_adicionales: {
    id_ciudad_tecnico: number;
    id_ciudad: number;
    nombre_ciudad: string;
  }[];
}

export async function getTechnicianCities(): Promise<TechnicianCitiesData> {
  const { data } = await api.get("/tecnicos/ciudades");
  return data.data;
}
