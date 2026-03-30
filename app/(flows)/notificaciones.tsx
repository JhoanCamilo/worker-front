import {
    getNotificaciones,
    marcarLeida,
    marcarTodasLeidas,
    Notificacion,
    TipoNotificacion,
} from "@/src/services/notificacion.service";
import { logRealtimeNavegacion } from "@/src/services/realtime-log.service";
import { useNotificacionStore } from "@/src/store/notificacion.store";
import { normalizeCotizacionAceptada } from "@/src/utils/cotizacionAceptada";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const ICON_MAP: Record<
  TipoNotificacion,
  { name: keyof typeof Ionicons.glyphMap; color: string }
> = {
  NUEVA_SOLICITUD: { name: "document-text", color: "#407ee3" },
  COTIZACION_RECIBIDA: { name: "pricetag", color: "#f59e0b" },
  COTIZACIONES_LISTAS: { name: "pricetags", color: "#f59e0b" },
  COTIZACION_ACEPTADA: { name: "checkmark-circle", color: "#10b981" },
  SERVICIO_INICIADO: { name: "play-circle", color: "#407ee3" },
  SERVICIO_COMPLETADO: { name: "checkmark-done-circle", color: "#10b981" },
  CALIFICACION_RECIBIDA: { name: "star", color: "#f2c70f" },
  SOLICITUD_CANCELADA: { name: "close-circle", color: "#cc2d2d" },
  SOLICITUD_EXPIRADA: { name: "time", color: "#6b7280" },
  RECORDATORIO_CITA: { name: "alarm", color: "#f59e0b" },
  PAGO_RECIBIDO: { name: "cash", color: "#10b981" },
  SISTEMA: { name: "information-circle", color: "#407ee3" },
};

export default function NotificacionesScreen() {
  const router = useRouter();
  const setNoLeidas = useNotificacionStore((s) => s.setNoLeidas);

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const toScalarId = (value: unknown): string | null => {
    if (typeof value === "number" && Number.isFinite(value))
      return String(value);
    if (typeof value === "string" && value.trim().length > 0) return value;
    return null;
  };

  const fetchNotificaciones = useCallback(
    async (page = 1, append = false) => {
      try {
        const res = await getNotificaciones(page, 20);
        const items = res?.notificaciones ?? [];
        setNotificaciones((prev) => (append ? [...prev, ...items] : items));
        setTotalPaginas(res?.total_paginas ?? 1);
        setPagina(page);
        setNoLeidas(res?.no_leidas ?? 0);
      } catch (err) {
        console.error("[notificaciones] Error:", err);
        if (!append) setNotificaciones([]);
      }
    },
    [setNoLeidas],
  );

  useEffect(() => {
    fetchNotificaciones(1).finally(() => setLoading(false));
  }, [fetchNotificaciones]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotificaciones(1);
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (loadingMore || pagina >= totalPaginas) return;
    setLoadingMore(true);
    await fetchNotificaciones(pagina + 1, true);
    setLoadingMore(false);
  };

  const navigateFromNotification = (
    item: Notificacion,
    datos: Record<string, unknown>,
    safePush: (
      pantallaDestino: string,
      action: () => void,
      idSolicitud?: unknown,
    ) => void,
  ) => {
    switch (item.tipo) {
      case "NUEVA_SOLICITUD": {
        const id = toScalarId(datos.id_solicitud);
        if (id)
          safePush(
            "/(flows)/tecnico-solicitud",
            () =>
              router.push({
                pathname: "/(flows)/tecnico-solicitud",
                params: { id },
              }),
            id,
          );
        return;
      }
      case "COTIZACION_RECIBIDA":
      case "COTIZACIONES_LISTAS":
      case "SOLICITUD_EXPIRADA": {
        const id = toScalarId(datos.id_solicitud);
        if (id)
          safePush(
            "/(flows)/cotizaciones",
            () =>
              router.push({
                pathname: "/(flows)/cotizaciones",
                params: { idSolicitud: id },
              }),
            id,
          );
        return;
      }
      case "COTIZACION_ACEPTADA": {
        const normalized = normalizeCotizacionAceptada({
          tipo: item.tipo,
          datos,
        });
        if (!normalized) return;

        if (normalized.destinoLogico === "AGENDA") {
          safePush(
            "/(technician)/schedule",
            () => router.push("/(technician)/schedule" as never),
            normalized.idSolicitud,
          );
          return;
        }

        safePush(
          "/(flows)/servicio-activo",
          () =>
            router.push({
              pathname: "/(flows)/servicio-activo",
              params: {
                idSolicitud: String(normalized.idSolicitud),
                ...(normalized.idServicio === null
                  ? {}
                  : { idServicio: String(normalized.idServicio) }),
              },
            }),
          normalized.idSolicitud,
        );
        return;
      }
      case "SERVICIO_INICIADO": {
        const id = toScalarId(datos.id_solicitud);
        if (id)
          safePush(
            "/(flows)/tracking-cliente",
            () =>
              router.push({
                pathname: "/(flows)/tracking-cliente",
                params: { idSolicitud: id },
              }),
            id,
          );
        return;
      }
      case "SERVICIO_COMPLETADO": {
        const idServ = toScalarId(datos.id_servicio);
        if (idServ)
          safePush(
            "/(flows)/calificar",
            () =>
              router.push({
                pathname: "/(flows)/calificar",
                params: { idServicio: idServ },
              }),
            datos.id_solicitud,
          );
        return;
      }
      case "CALIFICACION_RECIBIDA":
      case "PAGO_RECIBIDO": {
        safePush(
          "/(technician)/profile",
          () => router.push("/(technician)/profile" as never),
          datos.id_solicitud,
        );
        return;
      }
      default:
        return;
    }
  };

  const handlePress = async (item: Notificacion) => {
    const logNav = (
      pantallaDestino: string,
      resultado: "ok" | "error",
      idSolicitud?: unknown,
      error?: string,
    ) => {
      void logRealtimeNavegacion({
        canal: "PUSH",
        evento: item.tipo,
        pantallaDestino,
        resultado,
        idSolicitud,
        error,
      });
    };

    const safePush = (
      pantallaDestino: string,
      action: () => void,
      idSolicitud?: unknown,
    ) => {
      try {
        action();
        logNav(pantallaDestino, "ok", idSolicitud);
      } catch (err: any) {
        logNav(
          pantallaDestino,
          "error",
          idSolicitud,
          err?.message ?? "navigation_error",
        );
      }
    };

    // Marcar como leída
    if (!item.leida) {
      try {
        await marcarLeida(item.id_notificacion);
        setNotificaciones((prev) =>
          prev.map((n) =>
            n.id_notificacion === item.id_notificacion
              ? { ...n, leida: true }
              : n,
          ),
        );
        setNoLeidas(useNotificacionStore.getState().noLeidas - 1);
      } catch {}
    }

    // Navegar según tipo de notificación
    const datos = item.datos_adicionales ?? {};
    navigateFromNotification(item, datos, safePush);
  };

  const handleMarcarTodas = async () => {
    try {
      await marcarTodasLeidas();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch {}
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "Ahora";
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `Hace ${diffHrs}h`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  };

  const renderItem = ({ item }: { item: Notificacion }) => {
    const iconInfo = ICON_MAP[item.tipo] ?? ICON_MAP.SISTEMA;

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.leida && styles.notifUnread]}
        activeOpacity={0.7}
        onPress={() => handlePress(item)}
      >
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: iconInfo.color + "18" },
          ]}
        >
          <Ionicons name={iconInfo.name} size={22} color={iconInfo.color} />
        </View>

        <View style={styles.notifContent}>
          <Text style={styles.notifTitle} numberOfLines={1}>
            {item.titulo}
          </Text>
          <Text style={styles.notifMsg} numberOfLines={2}>
            {item.mensaje}
          </Text>
          <Text style={styles.notifTime}>{formatTime(item.fecha_envio)}</Text>
        </View>

        {!item.leida && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  let content: React.ReactNode;
  if (loading) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#407ee3" />
      </View>
    );
  } else if (notificaciones.length === 0) {
    content = (
      <View style={styles.center}>
        <Ionicons name="notifications-off-outline" size={56} color="#d1d5db" />
        <Text style={styles.emptyText}>No tienes notificaciones</Text>
      </View>
    );
  } else {
    content = (
      <FlatList
        data={notificaciones}
        keyExtractor={(item) => String(item.id_notificacion)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#407ee3"]}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              style={{ paddingVertical: 16 }}
              color="#407ee3"
            />
          ) : null
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <TouchableOpacity onPress={handleMarcarTodas} style={styles.markAllBtn}>
          <Ionicons name="checkmark-done" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },

  header: {
    backgroundColor: "#407ee3",
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { width: 34 },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  markAllBtn: { width: 34, alignItems: "flex-end" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 15, color: "#9ca3af", marginTop: 12 },

  list: { paddingVertical: 8 },

  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  notifUnread: {
    backgroundColor: "#eff6ff",
  },

  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: "600", color: "#1f2937" },
  notifMsg: { fontSize: 13, color: "#6b7280", marginTop: 2, lineHeight: 18 },
  notifTime: { fontSize: 11, color: "#9ca3af", marginTop: 4 },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#407ee3",
  },
});
