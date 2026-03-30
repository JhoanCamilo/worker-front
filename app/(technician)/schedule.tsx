import { CitaAgenda, getAgenda } from "@/src/services/agenda.service";
import { Ionicons } from "@expo/vector-icons";
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
  const [citas, setCitas] = useState<CitaAgenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modo, setModo] = useState<"proximas" | "historial">("proximas");
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const estadosFiltro = modo === "proximas" ? ESTADOS_PROXIMAS : ESTADOS_HISTORIAL;

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

  useEffect(() => {
    setLoading(true);
    fetchCitas(1).finally(() => setLoading(false));
  }, [fetchCitas]);

  const handleModoChange = (nuevoModo: "proximas" | "historial") => {
    if (nuevoModo === modo) return;
    setModo(nuevoModo);
    setFiltroEstado("Todas");
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCitas(1);
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (loadingMore || pagina >= totalPaginas) return;
    setLoadingMore(true);
    await fetchCitas(pagina + 1, true);
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
      <View style={[styles.card, { borderLeftColor: borderColor }]}>
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
      </View>
    );
  };

  const emptyMsg = modo === "proximas"
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
          style={[styles.modoBtn, modo === "historial" && styles.modoBtnActiveGray]}
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
      </View>

      {/* Filter chips */}
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

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#407ee3" />
        </View>
      ) : citas.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={56} color="#d1d5db" />
          <Text style={styles.emptyText}>{emptyMsg}</Text>
        </View>
      ) : (
        <FlatList
          data={citas}
          keyExtractor={(item) => String(item.id_cita)}
          renderItem={renderCita}
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
