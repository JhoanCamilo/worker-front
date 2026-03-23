import { io, Socket } from "socket.io-client";

// Quita el /api del final para obtener la base del servidor
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/api\/?$/, "");

export type SocketNamespace =
  | "/solicitudes"
  | "/cotizaciones"
  | "/servicios"
  | "/tracking";

/**
 * Crea una nueva conexión Socket.IO al namespace indicado.
 * La conexión NO inicia automáticamente (autoConnect: false) para
 * que cada hook controle el ciclo de vida.
 */
export function createSocket(namespace: SocketNamespace, token: string): Socket {
  const url = `${BASE_URL}${namespace}`;
  console.log("[socket] Creando conexión →", url);
  return io(url, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
}
