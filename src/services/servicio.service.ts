import { api } from "./api";

export interface ServicioResponse {
  id_servicio: number;
  id_solicitud: number;
  id_tecnico: number;
  id_estado: number;
  valor_total?: number;
}

export async function iniciarServicio(
  idSolicitud: number,
): Promise<ServicioResponse> {
  const { data } = await api.put(`/servicios/iniciar/${idSolicitud}`);
  return data.data ?? data;
}

export async function finalizarServicio(idServicio: number): Promise<void> {
  await api.put(`/servicios/${idServicio}/finalizar`);
}
