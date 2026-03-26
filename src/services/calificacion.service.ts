import { api } from "./api";

export interface CrearCalificacionPayload {
  id_servicio: number;
  puntuacion: number;
  comentario?: string;
}

export async function crearCalificacion(
  payload: CrearCalificacionPayload,
): Promise<void> {
  await api.post("/calificaciones", payload);
}
