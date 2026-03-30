import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "realtime-event-logs";
const MAX_LOGS = 300;

type Canal = "WS" | "PUSH";
type NavegacionEstado = "ok" | "error";

interface BaseLog {
  timestamp_local: string;
  id_solicitud: number | null;
  id_tecnico: number | null;
  canal: Canal;
}

export interface RealtimeEventoLog extends BaseLog {
  tipo: "evento";
  evento: string;
  detalles?: Record<string, unknown>;
}

export interface RealtimeNavegacionLog extends BaseLog {
  tipo: "navegacion";
  evento: string;
  pantalla_destino: string;
  resultado: NavegacionEstado;
  error?: string;
}

type RealtimeLog = RealtimeEventoLog | RealtimeNavegacionLog;

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function appendLog(entry: RealtimeLog): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const current: RealtimeLog[] = raw ? JSON.parse(raw) : [];
    current.push(entry);
    const trimmed = current.slice(-MAX_LOGS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn("[realtime-log] No se pudo persistir log:", err);
  }
}

export async function logRealtimeEvento(input: {
  canal: Canal;
  evento: string;
  idSolicitud?: unknown;
  idTecnico?: unknown;
  detalles?: Record<string, unknown>;
}): Promise<void> {
  const entry: RealtimeEventoLog = {
    tipo: "evento",
    timestamp_local: new Date().toISOString(),
    canal: input.canal,
    evento: input.evento,
    id_solicitud: toNumberOrNull(input.idSolicitud),
    id_tecnico: toNumberOrNull(input.idTecnico),
    detalles: input.detalles,
  };

  console.log("[realtime-log] evento", entry);
  await appendLog(entry);
}

export async function logRealtimeNavegacion(input: {
  canal: Canal;
  evento: string;
  pantallaDestino: string;
  resultado: NavegacionEstado;
  idSolicitud?: unknown;
  idTecnico?: unknown;
  error?: string;
}): Promise<void> {
  const entry: RealtimeNavegacionLog = {
    tipo: "navegacion",
    timestamp_local: new Date().toISOString(),
    canal: input.canal,
    evento: input.evento,
    pantalla_destino: input.pantallaDestino,
    resultado: input.resultado,
    id_solicitud: toNumberOrNull(input.idSolicitud),
    id_tecnico: toNumberOrNull(input.idTecnico),
    error: input.error,
  };

  console.log("[realtime-log] navegacion", entry);
  await appendLog(entry);
}
