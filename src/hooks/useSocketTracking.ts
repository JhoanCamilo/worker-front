import { createSocket } from "@/src/services/socket";
import { useAuthStore } from "@/src/store/auth.store";
import { UserRole } from "@/src/types/auth.types";
import { ProximidadPayload, UbicacionPayload } from "@/src/types/socket.types";
import * as Location from "expo-location";
import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

interface Options {
  /** ID de la solicitud activa */
  idSolicitud: number;
  /** (CLIENTE) Actualización de ubicación del técnico */
  onUbicacion?: (data: UbicacionPayload) => void;
  /** (CLIENTE) Técnico a ≤500m */
  onTecnicoCerca?: (data: ProximidadPayload) => void;
  /** (CLIENTE) Técnico llegó (≤50m y detenido) */
  onTecnicoLlego?: (data: { id_solicitud: number }) => void;
  /** (Opcional) Switch de seguridad para evitar carreras de UI native */
  enabled?: boolean;
}

/**
 * Hook para el namespace /tracking.
 * - CLIENTE: se une a la room y recibe actualizaciones GPS del técnico.
 * - TÉCNICO: se une a la room y comienza a enviar su ubicación cada 4s.
 *
 * El rol se detecta automáticamente desde el auth store.
 */
export function useSocketTracking({
  idSolicitud,
  onUbicacion,
  onTecnicoCerca,
  onTecnicoLlego,
  enabled = true,
}: Options) {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.user?.role);
  const socketRef = useRef<Socket | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!token || !idSolicitud || !enabled) return;

    const socket = createSocket("/tracking", token);
    socketRef.current = socket;

    const isTech = role === UserRole.TECH;

    socket.on("connect", () => {
      socket.emit("client:join_tracking", { id_solicitud: idSolicitud });

      if (isTech) startSendingLocation(socket, idSolicitud);
    });

    socket.on("disconnect", () => {
      locationSubRef.current?.remove();
      locationSubRef.current = null;
    });

    // Eventos que recibe el CLIENTE
    socket.on("server:tecnico_ubicacion", (data: UbicacionPayload) => {
      onUbicacion?.(data);
    });

    socket.on("server:tecnico_cerca", (data: ProximidadPayload) => {
      onTecnicoCerca?.(data);
    });

    socket.on("server:tecnico_llego", (data: { id_solicitud: number }) => {
      onTecnicoLlego?.(data);
    });

    socket.on("server:error", (err: { message: string }) => {
      console.warn("[socket/tracking] error:", err.message);
    });

    socket.connect();

    return () => {
      locationSubRef.current?.remove();
      locationSubRef.current = null;
      socket.emit("client:leave_tracking", { id_solicitud: idSolicitud });
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, idSolicitud, enabled]);

  async function startSendingLocation(socket: Socket, solicitudId: number) {
    try {
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 4000,
          distanceInterval: 5,
        },
        (loc) => {
          socket.emit("client:tecnico_ubicacion", {
            id_solicitud: solicitudId,
            latitud: loc.coords.latitude,
            longitud: loc.coords.longitude,
            velocidad_kmh: (loc.coords.speed ?? 0) * 3.6,
            en_movimiento: (loc.coords.speed ?? 0) > 0.5,
          });
        },
      );

      locationSubRef.current = sub;
    } catch (err) {
      console.warn("[socket/tracking] Native location error. WatchPosition aborted:", err);
      // Esto previene que la app se crashee nativamente si los permisos no fueron dados
      // o el GPS físico del dispositivo está apagado.
    }
  }

  return { socket: socketRef };
}
