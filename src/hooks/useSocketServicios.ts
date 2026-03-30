import { logRealtimeEvento } from "@/src/services/realtime-log.service";
import { createSocket } from "@/src/services/socket";
import { useAuthStore } from "@/src/store/auth.store";
import {
    CalificacionPayload,
    PagoConfirmadoPayload,
    ServicioPayload,
} from "@/src/types/socket.types";
import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

interface Options {
  /** (CLIENTE) El técnico inició el servicio */
  onServicioIniciado?: (data: ServicioPayload) => void;
  /** (CLIENTE) El técnico finalizó el servicio */
  onServicioFinalizado?: (data: ServicioPayload) => void;
  /** (TECNICO) El cliente confirmó el pago */
  onPagoConfirmado?: (data: PagoConfirmadoPayload) => void;
  /** (TECNICO) El cliente calificó el servicio */
  onCalificacionRecibida?: (data: CalificacionPayload) => void;
}

/**
 * Hook para el namespace /servicios.
 * - CLIENTE: escucha inicio y fin del servicio para actualizar la UI.
 * - TÉCNICO: escucha las calificaciones recibidas.
 *
 * El servidor une automáticamente al usuario a sus rooms personales
 * (user:{id} y tecnico:{id}) — no hay eventos join necesarios.
 */
export function useSocketServicios({
  onServicioIniciado,
  onServicioFinalizado,
  onPagoConfirmado,
  onCalificacionRecibida,
}: Options = {}) {
  const token = useAuthStore((s) => s.token);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = createSocket("/servicios", token);
    socketRef.current = socket;

    socket.on("server:servicio_iniciado", (data: ServicioPayload) => {
      void logRealtimeEvento({
        canal: "WS",
        evento: "server:servicio_iniciado",
        idSolicitud: data.id_solicitud,
        idTecnico: data.id_tecnico,
      });
      onServicioIniciado?.(data);
    });

    socket.on("server:servicio_finalizado", (data: ServicioPayload) => {
      void logRealtimeEvento({
        canal: "WS",
        evento: "server:servicio_finalizado",
        idSolicitud: data.id_solicitud,
        idTecnico: data.id_tecnico,
      });
      onServicioFinalizado?.(data);
    });

    socket.on("server:pago_confirmado", (data: PagoConfirmadoPayload) => {
      void logRealtimeEvento({
        canal: "WS",
        evento: "server:pago_confirmado",
        idSolicitud: data.id_solicitud,
        idTecnico: data.id_tecnico,
      });
      onPagoConfirmado?.(data);
    });

    socket.on("server:calificacion_recibida", (data: CalificacionPayload) => {
      void logRealtimeEvento({
        canal: "WS",
        evento: "server:calificacion_recibida",
      });
      onCalificacionRecibida?.(data);
    });

    socket.on("server:error", (err: { message: string }) => {
      console.warn("[socket/servicios] error:", err.message);
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { socket: socketRef };
}
