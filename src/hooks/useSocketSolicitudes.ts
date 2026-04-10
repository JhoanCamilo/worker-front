import { logRealtimeEvento } from "@/src/services/realtime-log.service";
import { createSocket } from "@/src/services/socket";
import { useAuthStore } from "@/src/store/auth.store";
import { NuevaSolicitudPayload } from "@/src/types/socket.types";
import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

interface Options {
  /** Activa o desactiva la conexión. Por defecto true. */
  enabled?: boolean;
  /** (TECNICO) Llega una solicitud cercana nueva */
  onNuevaSolicitud?: (data: NuevaSolicitudPayload) => void;
  /** Solicitud fue cancelada */
  onSolicitudCancelada?: (data: { id_solicitud: number }) => void;
  /** Cotización aceptada → solicitud asignada */
  onSolicitudAsignada?: (data: { id_solicitud: number }) => void;
  /** (CLIENTE) ID de la solicitud activa para unirse a la room */
  idSolicitud?: number;
}

/**
 * Hook para el namespace /solicitudes.
 * - TÉCNICO: escucha nuevas solicitudes cercanas, cancelaciones y asignaciones.
 * - CLIENTE: se une a la room de su solicitud activa.
 */
export function useSocketSolicitudes({
  enabled = true,
  onNuevaSolicitud,
  onSolicitudCancelada,
  onSolicitudAsignada,
  idSolicitud,
}: Options = {}) {
  const token = useAuthStore((s) => s.token);
  const socketRef = useRef<Socket | null>(null);

  // Refs para callbacks — evita stale closures
  const cbRefs = useRef({
    onNuevaSolicitud,
    onSolicitudCancelada,
    onSolicitudAsignada,
  });
  cbRefs.current = {
    onNuevaSolicitud,
    onSolicitudCancelada,
    onSolicitudAsignada,
  };

  useEffect(() => {
    if (!token || !enabled) return;

    const socket = createSocket("/solicitudes", token);
    socketRef.current = socket;

    console.log(
      "[socket/solicitudes] Conectando... token:",
      token ? "✅ presente" : "❌ ausente",
    );

    socket.on("connect", () => {
      console.log("[socket/solicitudes] ✅ Conectado. id:", socket.id);
      if (idSolicitud) {
        socket.emit("client:join_solicitud", { id_solicitud: idSolicitud });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[socket/solicitudes] 🔌 Desconectado:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("[socket/solicitudes] ❌ Error de conexión:", err.message);
    });

    socket.on("server:nueva_solicitud", (data: NuevaSolicitudPayload) => {
      console.log("[socket/solicitudes] 📨 nueva_solicitud:", data);
      void logRealtimeEvento({
        canal: "WS",
        evento: "server:nueva_solicitud",
        idSolicitud: data.id_solicitud,
      });
      cbRefs.current.onNuevaSolicitud?.(data);
    });

    socket.on(
      "server:solicitud_cancelada",
      (data: { id_solicitud: number }) => {
        console.log("[socket/solicitudes] 🚫 solicitud_cancelada:", data);
        void logRealtimeEvento({
          canal: "WS",
          evento: "server:solicitud_cancelada",
          idSolicitud: data.id_solicitud,
        });
        cbRefs.current.onSolicitudCancelada?.(data);
      },
    );

    socket.on("server:solicitud_asignada", (data: { id_solicitud: number }) => {
      console.log("[socket/solicitudes] ✅ solicitud_asignada:", data);
      void logRealtimeEvento({
        canal: "WS",
        evento: "server:solicitud_asignada",
        idSolicitud: data.id_solicitud,
      });
      cbRefs.current.onSolicitudAsignada?.(data);
    });

    socket.on("server:error", (err: { message: string }) => {
      console.warn("[socket/solicitudes] ⚠️ error:", err.message);
    });

    socket.connect();

    return () => {
      if (idSolicitud) {
        socket.emit("client:leave_solicitud", { id_solicitud: idSolicitud });
      }
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, enabled, idSolicitud]);

  const joinSolicitud = (id: number) => {
    socketRef.current?.emit("client:join_solicitud", { id_solicitud: id });
  };

  const leaveSolicitud = (id: number) => {
    socketRef.current?.emit("client:leave_solicitud", { id_solicitud: id });
  };

  return { joinSolicitud, leaveSolicitud };
}
