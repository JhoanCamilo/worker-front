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
  const payload: {
    disponible_inmediato: boolean;
    latitud?: number;
    longitud?: number;
  } = {
    disponible_inmediato: disponible,
  };

  if (coords) {
    payload.latitud = coords.latitud;
    payload.longitud = coords.longitud;
  }

  await api.put("/tecnicos/perfil", {
    ...payload,
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

export async function getTechnicianEspecialidades(): Promise<
  TechnicianEspecialidad[]
> {
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

export interface TechnicianDisponibilidadActual {
  disponible_inmediato: boolean;
  estado_validacion: string;
  radio_cobertura_km: number | null;
  tipo_cobertura: string | null;
}

export interface TechnicianServicioActivoActual {
  id_servicio: number;
  id_solicitud: number;
  id_estado: number;
  fecha_servicio: string;
  tipo_servicio: string;
  direccion_servicio: string | null;
}

export interface TechnicianCitaProximaAsignada {
  id_cita: number;
  fecha_cita: string;
  id_estado: number;
  estado: string;
  id_solicitud: number;
  descripcion: string;
  direccion_servicio: string | null;
}

export interface TechnicianSolicitudInmediataPendiente {
  id_cola: number;
  priority_score: number;
  estado_respuesta: string;
  fecha_notificacion: string;
  solicitud: {
    id_solicitud: number;
    tipo_servicio: string;
    descripcion: string;
    prioridad: string;
    direccion_servicio: string | null;
    fecha_solicitud: string;
    estado: {
      id_estado: number;
      descripcion: string;
    };
  };
}

export interface TechnicianEstadoActual {
  disponibilidad: TechnicianDisponibilidadActual;
  servicio_activo: TechnicianServicioActivoActual | null;
  citas_proximas_asignadas: TechnicianCitaProximaAsignada[];
  solicitud_inmediata_pendiente: TechnicianSolicitudInmediataPendiente | null;
}

export async function getTechnicianEstadoActual(): Promise<TechnicianEstadoActual> {
  const { data } = await api.get("/tecnicos/estado-actual");
  return data.data ?? data;
}
