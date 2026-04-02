import {
  getMisSolicitudes,
  SolicitudCliente,
} from "@/src/services/solicitud.service";
import { GarantiaItem, getGarantiasCliente } from "@/src/services/garantia.service";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TIPOS_FILTRO = ["Todas", "INMEDIATA", "PROGRAMADO"];

export default function ClientScheduleScreen() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<SolicitudCliente[]>([]);
  const [garantias, setGarantias] = useState<GarantiaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modo, setModo] = useState<"activas" | "historial" | "garantias">("activas");
  const [filtroTipo, setFiltroTipo] = useState("Todas");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchSolicitudes = useCallback(
    async (page = 1, append = false) => {
      try {
        const tipo = filtroTipo === "Todas" ? undefined : filtroTipo;
        const res = await getMisSolicitudes(page, 15, tipo);
        const items = res?.solicitudes ?? [];

        // Filtrar por modo (activas vs historial)
        const filtered = items.filter((s) => {
          const estado = s.estado?.descripcion?.toUpperCase() ?? "";
          if (modo === "activas") {
            return !["COMPLETADA", "CANCELADA", "FINALIZADA"].includes(estado);
          }
          return ["COMPLETADA", "CANCELADA", "FINALIZADA"].includes(estado);
        });

        setSolicitudes((prev) => (append ? [...prev, ...filtered] : filtered));
        setTotalPaginas(res?.total_paginas ?? 1);
        setPagina(page);
      } catch (err) {
        console.error("[agenda-cliente] Error:", err);
        if (!append) setSolicitudes([]);
      }
    },
    [filtroTipo, modo],
  );

  const fetchGarantias = useCallback(
    async (page = 1, append = false) => {
      try {
        const res = await getGarantiasCliente(page, 15);
        const items = res?.garantias ?? [];
        setGarantias((prev) => (append ? [...prev, ...items] : items));
        setTotalPaginas(res?.total_paginas ?? 1);
        setPagina(page);
      } catch (err) {
        console.error("[agenda-cliente] Error garantias:", err);
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
      fetchSolicitudes(1).finally(() => setLoading(false));
    }
  }, [fetchSolicitudes, fetchGarantias, modo]);

  const handleModoChange = (nuevoModo: "activas" | "historial" | "garantias") => {
    if (nuevoModo === modo) return;
    setModo(nuevoModo);
    setFiltroTipo("Todas");
    setPagina(1);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (modo === "garantias") {
      await fetchGarantias(1);
    } else {
      await fetchSolicitudes(1);
    }
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (loadingMore || pagina >= totalPaginas) return;
    setLoadingMore(true);
    if (modo === "garantias") {
      await fetchGarantias(pagina + 1, true);
    } else {
      await fetchSolicitudes(pagina + 1, true);
    }
    setLoadingMore(false);
  };

  const handleTap = (item: SolicitudCliente) => {
    const estado = item.estado?.descripcion?.toUpperCase() ?? "";
    const servicio = item.servicios_generados?.[0];
    const tieneCotizaciones = (item.cotizaciones?.length ?? 0) > 0;
    const cotizacionAceptada = item.cotizaciones?.find(
      (c) => c.estado === "ACEPTADA",
    );

    if (["COMPLETADA", "FINALIZADA", "CANCELADA"].includes(estado)) {
      router.push({
        pathname: "/(flows)/detalle-servicio" as never,
        params: { idServicio: String(servicio?.id_servicio || 0) },
      });
      return;
    }

    if (["EN_PROGRESO", "EN_CAMINO", "ASIGNADA"].includes(estado) && cotizacionAceptada) {
      router.push({
        pathname: "/(flows)/tracking-cliente",
        params: {
          idSolicitud: String(item.id_solicitud),
          idServicio: String(servicio?.id_servicio || 0),
        },
      });
    } else if (tieneCotizaciones && !cotizacionAceptada) {
      router.push({
        pathname: "/(flows)/cotizaciones",
        params: { idSolicitud: String(item.id_solicitud) },
      });
    }
  };

  const formatFecha = (dateStr: string): string => {
    const date = new Date(dateStr);
    const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const meses = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
    ];
    const hora = date.getHours();
    const min = String(date.getMinutes()).padStart(2, "0");
    const ampm = hora >= 12 ? "PM" : "AM";
    const hora12 = hora % 12 || 12;
    return `${dias[date.getDay()]} ${date.getDate()} ${meses[date.getMonth()]} - ${hora12}:${min} ${ampm}`;
  };

  const getEstadoStyle = (estado: string) => {
    const upper = estado.toUpperCase();
    switch (upper) {
      case "PENDIENTE":
      case "BUSCANDO_TECNICOS":
        return { bg: "#fef3c7", text: "#92400e" };
      case "ASIGNADA":
        return { bg: "#dbeafe", text: "#1e40af" };
      case "EN_PROGRESO":
      case "EN_CAMINO":
        return { bg: "#d1fae5", text: "#065f46" };
      case "COMPLETADA":
      case "FINALIZADA":
        return { bg: "#e0e7ff", text: "#3730a3" };
      case "CANCELADA":
        return { bg: "#fee2e2", text: "#991b1b" };
      default:
        return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  const getEstadoLabel = (estado: string) => {
    const upper = estado.toUpperCase();
    switch (upper) {
      case "PENDIENTE":
        return "Pendiente";
      case "BUSCANDO_TECNICOS":
        return "Buscando";
      case "ASIGNADA":
        return "Asignada";
      case "EN_PROGRESO":
        return "En progreso";
      case "EN_CAMINO":
        return "En camino";
      case "COMPLETADA":
      case "FINALIZADA":
        return "Completada";
      case "CANCELADA":
        return "Cancelada";
      default:
        return estado.charAt(0) + estado.slice(1).toLowerCase();
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "Todas":
        return "Todas";
      case "INMEDIATA":
        return "Inmediata";
      case "PROGRAMADO":
        return "Programada";
      default:
        return tipo;
    }
  };

  const renderSolicitud = ({ item }: { item: SolicitudCliente }) => {
    const estadoDesc = item.estado?.descripcion ?? "—";
    const estadoStyle = getEstadoStyle(estadoDesc);

    const sub = item.subcategoria;
    const catNombre = sub?.Categoria?.nombre ?? "";
    const subNombre = sub?.nombre ?? "";
    const categoria =
      catNombre && subNombre
        ? `${catNombre} - ${subNombre}`
        : catNombre || subNombre;

    const cotizacion = item.cotizaciones?.[0];
    const tecnico = cotizacion?.tecnico;
    const tecnicoNombre = tecnico?.datos_usuario
      ? `${tecnico.datos_usuario.nombre} ${tecnico.datos_usuario.apellido}`.trim()
      : null;
    const valor = cotizacion
      ? Number(cotizacion.valor_cotizacion)
      : null;

    const cita = item.citas?.[0];
    const fecha =
      cita?.fecha_cita ?? item.fecha_solicitud;
    const esProgramada = item.tipo_servicio === "PROGRAMADO";
    const borderColor = modo === "historial" ? "#9ca3af" : "#407ee3";

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: borderColor }]}
        activeOpacity={0.7}
        onPress={() => handleTap(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateRow}>
            <Ionicons
              name={esProgramada ? "calendar-outline" : "flash-outline"}
              size={16}
              color={borderColor}
            />
            <Text style={[styles.dateText, { color: borderColor }]}>
              {formatFecha(fecha)}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: estadoStyle.bg }]}>
            <Text style={[styles.badgeText, { color: estadoStyle.text }]}>
              {getEstadoLabel(estadoDesc)}
            </Text>
          </View>
        </View>

        <Text style={styles.categoria}>{categoria || "Servicio"}</Text>

        {item.descripcion ? (
          <Text style={styles.descripcion} numberOfLines={2}>
            {item.descripcion}
          </Text>
        ) : null}

        {tecnicoNombre && (
          <View style={styles.tecnicoRow}>
            {tecnico?.url_foto ? (
              <Image
                source={{ uri: tecnico.url_foto }}
                style={styles.tecnicoFoto}
              />
            ) : (
              <View style={styles.tecnicoFotoPlaceholder}>
                <Ionicons name="person" size={14} color="#9ca3af" />
              </View>
            )}
            <Text style={styles.tecnicoNombre}>{tecnicoNombre}</Text>
            {tecnico?.prom_calificacion != null && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#f2c70f" />
                <Text style={styles.ratingText}>
                  {tecnico.prom_calificacion.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        )}

        {valor != null && valor > 0 && (
          <View style={styles.valorRow}>
            <Text style={styles.valorLabel}>Cotización:</Text>
            <Text style={styles.valorText}>
              ${valor.toLocaleString("es-CO")}
            </Text>
          </View>
        )}

        {esProgramada && (
          <View style={styles.tipoBadge}>
            <Ionicons name="calendar" size={11} color="#6b7280" />
            <Text style={styles.tipoText}>Programada</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderGarantia = ({ item }: { item: GarantiaItem }) => {
    const expires = new Date(item.fecha_expiracion);
    const now = new Date();
    const isWtyActive = expires > now;
    const diffDays = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    const categoria = item.Servicio?.Solicitud?.subcategoria?.Categorium?.nombre || 'Servicio';
    const subcategoria = item.Servicio?.Solicitud?.subcategoria?.nombre || '';
    const nameCat = subcategoria ? `${categoria} - ${subcategoria}` : categoria;

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
        
        <View style={styles.valorRow}>
          <Text style={styles.valorLabel}>Vence en:</Text>
          <Text style={[styles.valorText, !isWtyActive && { color: "#ef4444" }]}>
            {formatFecha(item.fecha_expiracion)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const emptyMsg =
    modo === "garantias"
      ? "No tienes garantías registradas"
      : modo === "activas"
      ? "No tienes solicitudes activas"
      : "No tienes solicitudes en el historial";

  return (
    <View style={styles.container}>
      {/* Modo toggle */}
      <View style={styles.modoRow}>
        <TouchableOpacity
          style={[
            styles.modoBtn,
            modo === "activas" && styles.modoBtnActive,
          ]}
          onPress={() => handleModoChange("activas")}
        >
          <Ionicons
            name="list"
            size={16}
            color={modo === "activas" ? "#fff" : "#407ee3"}
          />
          <Text
            style={[
              styles.modoText,
              modo === "activas" && styles.modoTextActive,
            ]}
          >
            Activas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modoBtn,
            modo === "historial" && styles.modoBtnActiveGray,
          ]}
          onPress={() => handleModoChange("historial")}
        >
          <Ionicons
            name="time"
            size={16}
            color={modo === "historial" ? "#fff" : "#6b7280"}
          />
          <Text
            style={[
              styles.modoText,
              modo === "historial" && styles.modoTextActive,
            ]}
          >
            Historial
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modoBtn,
            modo === "garantias" && styles.modoBtnActiveGray,
          ]}
          onPress={() => handleModoChange("garantias")}
        >
          <Ionicons
            name="shield-checkmark"
            size={16}
            color={modo === "garantias" ? "#fff" : "#6b7280"}
          />
          <Text
            style={[
              styles.modoText,
              modo === "garantias" && styles.modoTextActive,
            ]}
          >
            Garantías
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {TIPOS_FILTRO.map((tipo) => (
          <TouchableOpacity
            key={tipo}
            style={[
              styles.chip,
              filtroTipo === tipo && styles.chipActive,
            ]}
            onPress={() => setFiltroTipo(tipo)}
          >
            <Text
              style={[
                styles.chipText,
                filtroTipo === tipo && styles.chipTextActive,
              ]}
            >
              {getTipoLabel(tipo)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#407ee3" />
        </View>
      ) : (modo === "garantias" ? garantias : solicitudes).length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={56} color="#d1d5db" />
          <Text style={styles.emptyText}>{emptyMsg}</Text>
        </View>
      ) : (
        <FlatList
          data={modo === "garantias" ? (garantias as any[]) : (solicitudes as any[])}
          keyExtractor={(item) => String(item.id_solicitud || item.id_garantia)}
          renderItem={(props) =>
            modo === "garantias"
              ? renderGarantia({ item: props.item as GarantiaItem })
              : renderSolicitud({ item: props.item as SolicitudCliente })
          }
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
  modoBtnActive: { backgroundColor: "#407ee3" },
  modoBtnActiveGray: { backgroundColor: "#6b7280" },
  modoText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  modoTextActive: { color: "#fff" },

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
  chipActive: { backgroundColor: "#407ee3" },
  chipText: { fontSize: 13, fontWeight: "500", color: "#374151" },
  chipTextActive: { color: "#fff" },

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
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dateText: { fontSize: 14, fontWeight: "600", color: "#407ee3" },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "600" },

  categoria: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  descripcion: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 8,
    fontStyle: "italic",
  },

  tecnicoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  tecnicoFoto: { width: 28, height: 28, borderRadius: 14 },
  tecnicoFotoPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  tecnicoNombre: { fontSize: 13, fontWeight: "600", color: "#374151", flex: 1 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 12, color: "#6b7280", fontWeight: "600" },

  valorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  valorLabel: { fontSize: 12, color: "#6b7280" },
  valorText: { fontSize: 14, fontWeight: "700", color: "#407ee3" },

  tipoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  tipoText: { fontSize: 11, color: "#6b7280" },
});
