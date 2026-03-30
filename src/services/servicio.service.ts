import { api } from "./api";

export interface ServicioResponse {
  id_servicio: number;
  id_solicitud: number;
  id_tecnico: number;
  id_estado: number;
  valor_total?: number;
}

export interface FinalizarServicioPayload {
  id_medioPago: number;
  valor_total?: number;
  imagenes?: string;
}

export async function iniciarServicio(
  idSolicitud: number,
): Promise<ServicioResponse> {
  const { data } = await api.put(`/servicios/iniciar/${idSolicitud}`);
  return data.data ?? data;
}

export async function finalizarServicio(
  idServicio: number,
  payload: FinalizarServicioPayload,
): Promise<ServicioResponse> {
  const { data } = await api.put(`/servicios/${idServicio}/finalizar`, payload);
  return data.data ?? data;
}

export async function confirmarPagoServicio(
  idServicio: number,
): Promise<Record<string, unknown>> {
  const { data } = await api.put(`/servicios/${idServicio}/confirmar-pago`);
  return data.data ?? data;
}
