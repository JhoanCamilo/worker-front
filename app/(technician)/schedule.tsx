import { CitaAgenda, getAgenda } from "@/src/services/agenda.service";
import { GarantiaItem, getGarantiasTecnico } from "@/src/services/garantia.service";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ESTADOS_PROXIMAS = ["Todas", "ASIGNADA", "EN_PROCESO"];
const ESTADOS_HISTORIAL = ["Todas", "COMPLETADA", "CANCELADA"];

/** Mapeo backend: EstadoSolicitud seeder */
const ESTADO_TO_ID: Record<string, number> = {
  PENDIENTE: 1,
  BUSCANDO_TECNICOS: 2,
  COTIZANDO: 3,
  ASIGNADA: 4,
  EN_PROCESO: 5,
  COMPLETADA: 6,
  CANCELADA: 7,
};

const getHoy = () => new Date().toISOString().split("T")[0]; // "2026-03-27"

export default function TechnicianScheduleScreen() {
  const router = useRouter();
  const { modo: paramModo } = useLocalSearchParams<{ modo?: string }>();
  const [citas, setCitas] = useState<CitaAgenda[]>([]);
  const [garantias, setGarantias] = useState<GarantiaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modo, setModo] = useState<"proximas" | "historial" | "garantias">("proximas");

  useEffect(() => {
    if (paramModo === "garantias" || paramModo === "historial" || paramModo === "proximas") {
      setModo(paramModo as "proximas" | "historial" | "garantias");
    }
  }, [paramModo]);
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const estadosFiltro = modo === "proximas" ? ESTADOS_PROXIMAS : 
                        modo === "historial" ? ESTADOS_HISTORIAL : [];

  const fetchCitas = useCallback(
    async (page = 1, append = false) => {
      try {
        const idEstado =
          filtroEstado !== "Todas" ? ESTADO_TO_ID[filtroEstado] : undefined;
        const hoy = getHoy();
        const fechaDesde = modo === "proximas" ? hoy : undefined;
        const fechaHasta = modo === "historial" ? hoy : undefined;
        const res = await getAgenda(page, 15, fechaDesde, fechaHasta, idEstado);
        const items = res?.citas ?? [];
        setCitas((prev) => (append ? [...prev, ...items] : items));
        setTotalPaginas(res?.total_paginas ?? 1);
        setPagina(page);
      } catch (err) {
        console.error("[agenda] Error:", err);
        if (!append) setCitas([]);
      }
    },
    [filtroEstado, modo],
  );

  const fetchGarantias = useCallback(
    async (page = 1, append = false) => {
      try {
        const res = await getGarantiasTecnico(page, 15);
        const items = res?.garantias ?? [];
        setGarantias((prev) => (append ? [...prev, ...items] : items));
        setTotalPaginas(res?.total_paginas ?? 1);
        setPagina(page);
      } catch (err) {
        console.error("[agenda] Error garantias:", err);
        if (!append) setGarantias([]);
      }
    },
    [],
  );

  useEffect(() => {
    setLoading(true);
    if (modo === "garantias") {
      fetchGarantias(1).finally(() => setLoading(false));
    } else {
      fetchCitas(1).finally(() => setLoading(false));
    }
  }, [fetchCitas, fetchGarantias, modo]);

  const handleModoChange = (nuevoModo: "proximas" | "historial" | "garantias") => {
    if (nuevoModo === modo) return;
    setModo(nuevoModo);
    setFiltroEstado("Todas");
    setPagina(1);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (modo === "garantias") {
      await fetchGarantias(1);
    } else {
      await fetchCitas(1);
    }
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (loadingMore || pagina >= totalPaginas) return;
    setLoadingMore(true);
    if (modo === "garantias") {
      await fetchGarantias(pagina + 1, true);
    } else {
      await fetchCitas(pagina + 1, true);
    }
    setLoadingMore(false);
  };

  const formatFecha = (dateStr: string): string => {
    const date = new Date(dateStr);
    const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const hora = date.getHours();
    const min = String(date.getMinutes()).padStart(2, "0");
    const ampm = hora >= 12 ? "PM" : "AM";
    const hora12 = hora % 12 || 12;
    return `${dias[date.getDay()]} ${date.getDate()} ${meses[date.getMonth()]} - ${hora12}:${min} ${ampm}`;
  };

  const getEstadoStyle = (estado: string) => {
    switch (estado) {
      case "ASIGNADA":
        return { bg: "#fef3c7", text: "#92400e" };
      case "EN_PROCESO":
        return { bg: "#d1fae5", text: "#065f46" };
      case "COMPLETADA":
        return { bg: "#dbeafe", text: "#1e40af" };
      case "CANCELADA":
        return { bg: "#fee2e2", text: "#991b1b" };
      default:
        return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case "Todas":
        return "Todas";
      case "ASIGNADA":
        return "Pendiente";
      case "EN_PROCESO":
        return "En proceso";
      default:
        return estado.charAt(0) + estado.slice(1).toLowerCase();
    }
  };

  const handleCitaTap = (item: CitaAgenda) => {
    const estado = item.estado?.descripcion?.toUpperCase() ?? "";

    if (["COMPLETADA", "CANCELADA", "FINALIZADA"].includes(estado)) {
      router.push({
        pathname: "/(flows)/detalle-servicio" as never,
        params: { idSolicitud: String(item.solicitud?.id_solicitud) },
      });
      return;
    }

    if (modo !== "proximas") return;
    
    // Si ya está en proceso, ir al mapa directamente
    if (estado === "EN_PROCESO" || estado === "EN_CAMINO") {
      router.push({
          pathname: "/(flows)/servicio-activo",
          params: { idSolicitud: String(item.solicitud?.id_solicitud) }
      });
      return;
    }

    if (!["ASIGNADA", "PENDIENTE"].includes(estado)) return;

    const citaDate = new Date(item.fecha_cita);
    const diffMs = citaDate.getTime() - Date.now();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours > 2) {
      Alert.alert(
        "Aún es muy pronto",
        `Solo puedes iniciar un servicio programado faltando 2 horas o menos.\n\nFaltan aproximadamente ${Math.ceil(diffHours)} horas para tu cita.`
      );
      return;
    }

    Alert.alert(
      "Iniciar servicio",
      "¿Te diriges ahora a la ubicación del cliente para este servicio programado?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, ir en camino", 
          onPress: () => {
            router.push({
              pathname: "/(flows)/servicio-activo",
              params: {
                idSolicitud: String(item.solicitud?.id_solicitud),
              }
            });
          }
        }
      ]
    );
  };

  const renderCita = ({ item }: { item: CitaAgenda }) => {
    const estadoLabel = item.estado?.descripcion ?? "—";
    const estadoStyle = getEstadoStyle(estadoLabel);

    const sub = item.solicitud?.subcategoria;
    const catNombre = sub?.Categoria?.nombre ?? "";
    const subNombre = sub?.nombre ?? "";
    const categoria = catNombre && subNombre ? `${catNombre} - ${subNombre}` : catNombre || subNombre;

    const clienteDatos = item.solicitud?.cliente?.datos_usuario;
    const clienteNombre = clienteDatos
      ? `${clienteDatos.nombre} ${clienteDatos.apellido}`.trim()
      : "Cliente";

    const borderColor = modo === "historial" ? "#9ca3af" : "#407ee3";

    return (
      <TouchableOpacity 
        style={[styles.card, { borderLeftColor: borderColor }]}
        activeOpacity={modo === "proximas" ? 0.7 : 1}
        onPress={() => handleCitaTap(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color={borderColor} />
            <Text style={[styles.dateText, { color: borderColor }]}>{formatFecha(item.fecha_cita)}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: estadoStyle.bg }]}>
            <Text style={[styles.badgeText, { color: estadoStyle.text }]}>{estadoLabel}</Text>
          </View>
        </View>

        <Text style={styles.categoria}>{categoria || "Servicio"}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={14} color="#6b7280" />
          <Text style={styles.infoText}>{clienteNombre}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color="#6b7280" />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.solicitud?.direccion_servicio ?? "Sin dirección"}
          </Text>
        </View>

        {item.solicitud?.descripcion ? (
          <Text style={styles.descripcion} numberOfLines={2}>
            {item.solicitud.descripcion}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderGarantia = ({ item }: { item: GarantiaItem }) => {
    const expires = new Date(item.fecha_expiracion);
    const now = new Date();
    const isWtyActive = expires > now;
    const diffDays = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 3600 * 24));

    const nameCat = item.servicio?.subcategoria?.nombre || "Servicio";
    const clienteDatos = item.servicio?.cliente?.datos_usuario;
    const clienteNombre = clienteDatos
      ? `${clienteDatos.nombre} ${clienteDatos.apellido}`.trim()
      : null;

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: isWtyActive ? "#16a34a" : "#ef4444" }]}
        activeOpacity={0.7}
        onPress={() => router.push({
          pathname: "/(flows)/detalle-servicio" as never,
          params: { idServicio: String(item.id_servicio) },
        })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateRow}>
            <Ionicons name="shield-checkmark" size={16} color={isWtyActive ? "#16a34a" : "#ef4444"} />
            <Text style={[styles.dateText, { color: isWtyActive ? "#16a34a" : "#ef4444" }]}>
              {isWtyActive ? "Garantía Activa" : "Expirada"}
            </Text>
          </View>
          {isWtyActive && diffDays <= 5 && diffDays > 0 && (
            <View style={[styles.badge, { backgroundColor: "#fef2f2" }]}>
              <Text style={[styles.badgeText, { color: "#ef4444" }]}>
                {diffDays} días rest.
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.categoria}>{nameCat}</Text>

        {clienteNombre ? (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={14} color="#6b7280" />
            <Text style={styles.infoText}>{clienteNombre}</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={14} color="#6b7280" />
          <Text style={[styles.infoText, !isWtyActive && { color: "#ef4444" }]}>
            Vence: {formatFecha(item.fecha_expiracion)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const emptyMsg = modo === "garantias"
    ? "No tienes garantías registradas"
    : modo === "proximas"
    ? "No tienes citas próximas"
    : "No tienes citas en el historial";

  return (
    <View style={styles.container}>
      {/* Modo toggle: Próximas / Historial */}
      <View style={styles.modoRow}>
        <TouchableOpacity
          style={[styles.modoBtn, modo === "proximas" && styles.modoBtnActive]}
          onPress={() => handleModoChange("proximas")}
        >
          <Ionicons
            name="calendar"
            size={16}
            color={modo === "proximas" ? "#fff" : "#407ee3"}
          />
          <Text style={[styles.modoText, modo === "proximas" && styles.modoTextActive]}>
            Próximas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modoBtn, modo === "historial" && styles.modoBtnActive]}
          onPress={() => handleModoChange("historial")}
        >
          <Ionicons
            name="time"
            size={16}
            color={modo === "historial" ? "#fff" : "#6b7280"}
          />
          <Text style={[styles.modoText, modo === "historial" && styles.modoTextActive]}>
            Historial
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.modoBtn, modo === "garantias" && styles.modoBtnActive]}
          onPress={() => handleModoChange("garantias")}
        >
          <Ionicons
            name="shield-checkmark"
            size={16}
            color={modo === "garantias" ? "#fff" : "#6b7280"}
          />
          <Text style={[styles.modoText, modo === "garantias" && styles.modoTextActive]}>
            Garantías
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips (solo para citas, no para garantias) */}
      {modo !== "garantias" && (
        <View style={styles.filterRow}>
          {estadosFiltro.map((estado) => (
            <TouchableOpacity
              key={estado}
              style={[styles.chip, filtroEstado === estado && styles.chipActive]}
              onPress={() => setFiltroEstado(estado)}
            >
              <Text style={[styles.chipText, filtroEstado === estado && styles.chipTextActive]}>
                {getEstadoLabel(estado)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#407ee3" />
        </View>
      ) : (modo === "garantias" ? garantias : citas).length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={56} color="#d1d5db" />
          <Text style={styles.emptyText}>{emptyMsg}</Text>
        </View>
      ) : (
        <FlatList
          data={modo === "garantias" ? (garantias as any[]) : (citas as any[])}
          keyExtractor={(item, index) => String(item.id_cita || item.id_garantia || index)}
          renderItem={(props) =>
            modo === "garantias"
              ? renderGarantia({ item: props.item as GarantiaItem })
              : renderCita({ item: props.item as CitaAgenda })
          }
          ListHeaderComponent={
            modo === "garantias" ? (
              <View style={styles.garantiasInfoBox}>
                <Ionicons name="information-circle-outline" size={18} color="#6b7280" />
                <Text style={styles.garantiasInfoText}>
                  Aquí se muestran los trabajos que realizaste y que tienen garantía vigente. Son el respaldo de calidad que ofreciste a tus clientes, no trabajos pendientes por cubrir.
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#407ee3"]} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={{ paddingVertical: 16 }} color="#407ee3" /> : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },

  modoRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 10,
  },
  modoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  modoBtnActive: {
    backgroundColor: "#407ee3",
  },
  modoBtnActiveGray: {
    backgroundColor: "#6b7280",
  },
  modoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  modoTextActive: {
    color: "#fff",
  },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  chipActive: {
    backgroundColor: "#407ee3",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  chipTextActive: {
    color: "#fff",
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 15, color: "#9ca3af", marginTop: 12 },

  garantiasInfoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  garantiasInfoText: {
    flex: 1,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },

  list: { paddingHorizontal: 12, paddingBottom: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#407ee3",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#407ee3",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },

  categoria: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#6b7280",
    flex: 1,
  },

  descripcion: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 6,
    fontStyle: "italic",
  },
});
