import { api } from "./api";

// ── Types ──────────────────────────────────────────────────────────

export type TipoNotificacion =
  | "NUEVA_SOLICITUD"
  | "COTIZACION_RECIBIDA"
  | "COTIZACIONES_LISTAS"
  | "COTIZACION_ACEPTADA"
  | "SERVICIO_INICIADO"
  | "SERVICIO_COMPLETADO"
  | "CALIFICACION_RECIBIDA"
  | "SOLICITUD_CANCELADA"
  | "SOLICITUD_EXPIRADA"
  | "RECORDATORIO_CITA"
  | "PAGO_RECIBIDO"
  | "SISTEMA";

export interface Notificacion {
  id_notificacion: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  datos_adicionales: Record<string, unknown> | null;
  leida: boolean;
  fecha_envio: string;
}

export interface NotificacionesResponse {
  notificaciones: Notificacion[];
  total: number;
  page: number;
  limit: number;
  total_paginas: number;
  no_leidas: number;
}

// ── API Calls ──────────────────────────────────────────────────────

/** Register Expo push token with the backend */
export async function registrarPushToken(token: string): Promise<void> {
  await api.post("/notificaciones/push-token", {
    expo_push_token: token,
  });
}

/** Get paginated notifications — backend wraps in { success, data: { ... } } */
export async function getNotificaciones(
  page = 1,
  limit = 20,
  soloNoLeidas = false,
): Promise<NotificacionesResponse> {
  const { data } = await api.get("/notificaciones", {
    params: { page, limit, solo_no_leidas: soloNoLeidas },
  });
  // data = { success, message, data: { notificaciones, total, ... } }
  return data.data;
}

/** Mark a single notification as read */
export async function marcarLeida(idNotificacion: number): Promise<void> {
  await api.put(`/notificaciones/${idNotificacion}/leer`);
}

/** Mark all notifications as read */
export async function marcarTodasLeidas(): Promise<void> {
  await api.put("/notificaciones/leer-todas");
}
