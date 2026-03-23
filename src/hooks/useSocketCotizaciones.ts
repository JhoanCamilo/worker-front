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
  onCotizacionAceptada?: (data: CotizacionPayload) => void;
  /** (TECNICO) Tu cotización fue rechazada */
  onCotizacionRechazada?: (data: RechazoPayload) => void;
}

/**
 * Hook para el namespace /cotizaciones.
 * - CLIENTE: se suscribe a cotizaciones de su solicitud activa.
 * - TÉCNICO: escucha el resultado de sus cotizaciones enviadas.
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

  useEffect(() => {
    if (!token) return;

    const socket = createSocket("/cotizaciones", token);
    socketRef.current = socket;

    socket.on("connect", () => {
      if (idSolicitud) {
        socket.emit("client:join_cotizaciones", { id_solicitud: idSolicitud });
      }
    });

    socket.on("server:nueva_cotizacion", (data: CotizacionPayload) => {
      onNuevaCotizacion?.(data);
    });

    socket.on("server:cotizaciones_listas", (data: BatchListasPayload) => {
      onCotizacionesListas?.(data);
    });

    socket.on("server:cotizacion_aceptada", (data: CotizacionPayload) => {
      onCotizacionAceptada?.(data);
    });

    socket.on("server:cotizacion_rechazada", (data: RechazoPayload) => {
      onCotizacionRechazada?.(data);
    });

    socket.on("server:error", (err: { message: string }) => {
      console.warn("[socket/cotizaciones] error:", err.message);
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, idSolicitud]);

  return { socket: socketRef };
}
