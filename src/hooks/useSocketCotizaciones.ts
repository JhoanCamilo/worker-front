import { logRealtimeEvento } from "@/src/services/realtime-log.service";
import { createSocket } from "@/src/services/socket";
import { useAuthStore } from "@/src/store/auth.store";
import {
    BatchListasPayload,
    CotizacionPayload,
    RechazoPayload,
} from "@/src/types/socket.types";
import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

interface Options {
  /** (CLIENTE) ID de la solicitud para recibir cotizaciones */
  idSolicitud?: number;
  /** (CLIENTE) Nueva cotización recibida de un técnico */
  onNuevaCotizacion?: (data: CotizacionPayload) => void;
  /** (CLIENTE) Ventana de cotizaciones cerrada (5 min o 5 cotizaciones) */
  onCotizacionesListas?: (data: BatchListasPayload) => void;
  /** (TECNICO) Tu cotización fue aceptada */
  onCotizacionAceptada?: (data: unknown) => void;
  /** (TECNICO) Tu cotización fue rechazada */
  onCotizacionRechazada?: (data: RechazoPayload) => void;
}

/**
 * Hook para el namespace /cotizaciones.
 * - CLIENTE: se suscribe a cotizaciones de su solicitud activa.
 * - TÉCNICO: escucha el resultado de sus cotizaciones enviadas.
 *
 * Usa refs para los callbacks para evitar re-crear el socket cuando
 * los callbacks cambian (stale closure fix).
 */
export function useSocketCotizaciones({
  idSolicitud,
  onNuevaCotizacion,
  onCotizacionesListas,
  onCotizacionAceptada,
  onCotizacionRechazada,
}: Options = {}) {
  const token = useAuthStore((s) => s.token);
  const socketRef = useRef<Socket | null>(null);

  // Refs para callbacks — evita stale closures
  const cbRefs = useRef({
    onNuevaCotizacion,
    onCotizacionesListas,
    onCotizacionAceptada,
    onCotizacionRechazada,
  });
  cbRefs.current = {
    onNuevaCotizacion,
    onCotizacionesListas,
    onCotizacionAceptada,
    onCotizacionRechazada,
  };

  useEffect(() => {
    if (!token) return;

    const socket = createSocket("/cotizaciones", token);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[socket/cotizaciones] ✅ Conectado. id:", socket.id);
      if (idSolicitud) {
        console.log(
          "[socket/cotizaciones] Joining room solicitud:",
          idSolicitud,
        );
        socket.emit("client:join_cotizaciones", { id_solicitud: idSolicitud });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[socket/cotizaciones] 🔌 Desconectado:", reason);
    });

    socket.on("server:nueva_cotizacion", (data: CotizacionPayload) => {
      console.log("[socket/cotizaciones] 💰 nueva_cotizacion:", data);
      void logRealtimeEvento({
        canal: "WS",
        evento: "server:nueva_cotizacion",
        idSolicitud: data.id_solicitud,
        idTecnico: data.id_tecnico,
      });
      cbRefs.current.onNuevaCotizacion?.(data);
    });

    socket.on("server:cotizaciones_listas", (data: BatchListasPayload) => {
      console.log("[socket/cotizaciones] ✅ cotizaciones_listas:", data);
      void logRealtimeEvento({
        canal: "WS",
        evento: "server:cotizaciones_listas",
        idSolicitud: data.id_solicitud,
      });
      cbRefs.current.onCotizacionesListas?.(data);
    });

    socket.on("server:cotizacion_aceptada", (data: any) => {
      console.log("[socket/cotizaciones] ✅ cotizacion_aceptada:", data);
      void logRealtimeEvento({
        canal: "WS",
        evento: "server:cotizacion_aceptada",
        idSolicitud: data?.id_solicitud ?? data?.datos?.id_solicitud,
        idTecnico: data?.id_tecnico ?? data?.datos?.id_tecnico,
      });
      cbRefs.current.onCotizacionAceptada?.(data);
    });

    socket.on("server:cotizacion_rechazada", (data: RechazoPayload) => {
      console.log("[socket/cotizaciones] ❌ cotizacion_rechazada:", data);
      void logRealtimeEvento({
        canal: "WS",
        evento: "server:cotizacion_rechazada",
        idSolicitud: data.id_solicitud,
      });
      cbRefs.current.onCotizacionRechazada?.(data);
    });

    socket.on("server:error", (err: { message: string }) => {
      console.warn("[socket/cotizaciones] ⚠️ error:", err.message);
    });

    socket.on("connect_error", (err) => {
      console.error("[socket/cotizaciones] ❌ connect_error:", err.message);
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [token, idSolicitud]);

  return { socket: socketRef };
}
