import { useSocketCotizaciones } from "@/src/hooks/useSocketCotizaciones";
import { useToast } from "@/src/hooks/useToast";
import {
    aceptarCotizacion,
    CotizacionItem,
    getCotizacionesBySolicitud,
} from "@/src/services/cotizacion.service";
import {
    cancelarSolicitud,
    getSolicitudDetalle,
} from "@/src/services/solicitud.service";
import { useServicioStore } from "@/src/store/servicio.store";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function CotizacionesScreen() {
  const { idSolicitud, modo: modoParam } = useLocalSearchParams<{
    idSolicitud: string;
    modo?: string;
  }>();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const setServicioActivo = useServicioStore((s) => s.setServicioActivo);

  const [cotizaciones, setCotizaciones] = useState<CotizacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCotizacion, setSelectedCotizacion] = useState<CotizacionItem | null>(null);

  // ── Tipo de servicio ─────────────────────────────────────────
  // REST devuelve "INMEDIATO"/"PROGRAMADO", WS y params usan "INMEDIATA"/"PROGRAMADA"
  const [tipoServicio, setTipoServicio] = useState<string | null>(
    modoParam ?? null,
  );
  const [fechaProgramada, setFechaProgramada] = useState<string | null>(null);
  const [showProgramadaModal, setShowProgramadaModal] = useState(false);

  const solicitudId = (() => {
    if (Array.isArray(idSolicitud)) {
      const parsed = Number(idSolicitud[0]);
      return Number.isFinite(parsed) ? parsed : null;
    }
    const parsed = Number(idSolicitud);
    return Number.isFinite(parsed) ? parsed : null;
  })();

  const fetchCotizaciones = useCallback(async () => {
    if (solicitudId === null) {
      setLoadError("No se recibió el identificador de la solicitud.");
      setLoading(false);
      return;
    }

    try {
      setLoadError(null);
      const data = await getCotizacionesBySolicitud(solicitudId);
      setCotizaciones(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        "No se pudieron cargar las cotizaciones";
      setLoadError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [showError, solicitudId]);

  // ── Carga inicial por REST ────────────────────────────────────
  useEffect(() => {
    fetchCotizaciones();
  }, [fetchCotizaciones]);

  // ── Obtener tipo_servicio si no viene como param ────────────
  useEffect(() => {
    if (tipoServicio || !solicitudId) return;
    getSolicitudDetalle(solicitudId)
      .then((detalle) => {
        setTipoServicio(detalle.tipo_servicio);
        if (detalle.fecha_programada) setFechaProgramada(detalle.fecha_programada);
      })
      .catch(() => {
        setTipoServicio("INMEDIATA"); // fallback
      });
  }, [solicitudId, tipoServicio]);

  // ── Socket: cotizaciones en tiempo real ───────────────────────
  useSocketCotizaciones({
    idSolicitud: solicitudId ?? undefined,
    onNuevaCotizacion: useCallback((data: any) => {
      setCotizaciones((prev) => {
        if (prev.some((c) => c.id_cotizacion === data.id_cotizacion))
          return prev;
        return [...prev, data];
      });
    }, []),
    onCotizacionesListas: useCallback(
      (data: any) => {
        console.log("[cotizaciones] Ventana cerrada →", data);
        fetchCotizaciones();
      },
      [fetchCotizaciones],
    ),
  });

  // ── Confirmar aceptación (modal) ────────────────────────────────
  const handleConfirmAceptar = async () => {
    if (!selectedCotizacion) return;
    const idCotizacion = selectedCotizacion.id_cotizacion;
    const cotizacionValor = selectedCotizacion.valor_cotizacion;
    const cotizacionTecnico = selectedCotizacion.id_tecnico;
    setSelectedCotizacion(null);
    setAccepting(idCotizacion);

    try {
      await aceptarCotizacion(idCotizacion);

      // ── PROGRAMADA: modal de confirmación → home ────────────
      const esInmediata = tipoServicio === "INMEDIATA" || tipoServicio === "INMEDIATO";
      if (!esInmediata) {
        success("¡Cotización aceptada! Servicio programado.");
        setShowProgramadaModal(true);
        return;
      }

      // ── INMEDIATA: tracking en tiempo real ──────────────────
      success("¡Cotización aceptada! El técnico va en camino.");

      let clienteLat = 0;
      let clienteLon = 0;
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        clienteLat = loc.coords.latitude;
        clienteLon = loc.coords.longitude;
      } catch {
        console.warn("[cotizaciones] No se pudo obtener ubicación del cliente");
      }

      setServicioActivo({
        id_servicio: 0,
        id_solicitud: solicitudId ?? 0,
        id_tecnico: cotizacionTecnico,
        id_estado: 4,
        valor_total: cotizacionValor,
        valor_cotizacion: cotizacionValor,
        cliente_lat: clienteLat,
        cliente_lon: clienteLon,
      });

      router.replace({
        pathname: "/(flows)/tracking-cliente",
        params: {
          idSolicitud: String(solicitudId ?? 0),
          idServicio: "0",
        },
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "No se pudo aceptar la cotización";
      showError(msg);
    } finally {
      setAccepting(null);
    }
  };

  // ── Aceptar modal programada → home ───────────────────────────
  const handleProgramadaAccept = () => {
    setShowProgramadaModal(false);
    router.replace("/(tabs)/home");
  };

  // ── Volver al home (back button) ────────────────────────────────
  const handleGoHome = () => {
    if (cotizaciones.length > 0) {
      Alert.alert(
        "Salir de cotizaciones",
        "¿Quieres volver al inicio? Las cotizaciones seguirán disponibles desde tus notificaciones.",
        [
          { text: "Quedarme", style: "cancel" },
          {
            text: "Ir al inicio",
            onPress: () => router.replace("/(tabs)/home"),
          },
        ],
      );
    } else {
      router.replace("/(tabs)/home");
    }
  };

  // ── Cancelar solicitud ──────────────────────────────────────────
  const handleCancel = () => {
    Alert.alert(
      "Cancelar solicitud",
      "¿Quieres cancelar la solicitud de servicio? Perderás las cotizaciones recibidas.",
      [
        { text: "No, continuar", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            if (solicitudId) {
              try { await cancelarSolicitud(solicitudId); } catch {}
            }
            router.replace("/(tabs)/home");
          },
        },
      ],
    );
  };

  // ── Reintentar solicitud (nueva) ──────────────────────────────
  const handleRetry = () => {
    router.replace("/(tabs)/home");
  };

  // ── Estrellas helper ────────────────────────────────────────────
  const renderStars = (rating: number | null | undefined) => {
    const r = rating ?? 0;
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Ionicons
            key={i}
            name={i <= Math.round(r) ? "star" : "star-outline"}
            size={14}
            color="#f2c70f"
          />
        ))}
        {r > 0 && <Text style={styles.ratingText}>{r.toFixed(1)}</Text>}
      </View>
    );
  };

  // ── Render item ───────────────────────────────────────────────
  const renderItem = ({ item }: { item: CotizacionItem }) => {
    const tecnico = item.tecnico;
    const nombreTecnico = tecnico
      ? `${tecnico.nombre} ${tecnico.apellido}`.trim()
      : `Técnico #${item.id_tecnico}`;

    return (
      <View style={styles.card}>
        {/* Técnico info */}
        <View style={styles.tecnicoRow}>
          {tecnico?.foto_perfil ? (
            <Image source={{ uri: tecnico.foto_perfil }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={22} color="#9ca3af" />
            </View>
          )}
          <View style={styles.tecnicoInfo}>
            <Text style={styles.tecnicoName} numberOfLines={1}>
              {nombreTecnico}
            </Text>
            {renderStars(tecnico?.promedio_calificacion)}
          </View>
        </View>

        {/* Valor */}
        <View style={styles.cardHeader}>
          <FontAwesome6 name="file-invoice-dollar" size={16} color="#407ee3" />
          <Text style={styles.cardValor}>
            ${item.valor_cotizacion.toLocaleString("es-CO")}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardLabel}>Descripción del trabajo</Text>
          <Text style={styles.cardText}>{item.descripcion_trabajo}</Text>

          <View style={styles.cardRow}>
            <View style={styles.cardCol}>
              <Text style={styles.cardLabel}>Tiempo estimado</Text>
              <Text style={styles.cardText}>{item.tiempo_estimado}</Text>
            </View>
            {item.dias_garantia != null && item.dias_garantia > 0 && (
              <View style={styles.cardCol}>
                <Text style={styles.cardLabel}>Garantía</Text>
                <Text style={styles.cardText}>{item.dias_garantia} días</Text>
              </View>
            )}
          </View>

          {item.incluye_materiales && (
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="construct" size={12} color="#10b981" />
                <Text style={styles.badgeText}>Incluye materiales</Text>
              </View>
            </View>
          )}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerRow}>
          <Ionicons name="information-circle-outline" size={14} color="#f59e0b" />
          <Text style={styles.disclaimerText}>
            Sujeto a inspección visual en sitio
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.aceptarBtn,
            accepting === item.id_cotizacion && { opacity: 0.6 },
          ]}
          activeOpacity={0.8}
          onPress={() => setSelectedCotizacion(item)}
          disabled={accepting !== null}
        >
          {accepting === item.id_cotizacion ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.aceptarText}>Aceptar cotización</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ── Content ────────────────────────────────────────────────────
  let content = (
    <FlatList
      data={cotizaciones}
      keyExtractor={(item) => String(item.id_cotizacion)}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  );

  if (loading) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#407ee3" />
        <Text style={styles.loadingText}>Esperando cotizaciones...</Text>
      </View>
    );
  } else if (loadError) {
    content = (
      <View style={styles.center}>
        <FontAwesome6 name="triangle-exclamation" size={46} color="#ef4444" />
        <Text style={styles.emptyText}>{loadError}</Text>
      </View>
    );
  } else if (cotizaciones.length === 0) {
    content = (
      <View style={styles.center}>
        <Ionicons name="sad-outline" size={56} color="#9ca3af" />
        <Text style={styles.emptyTitle}>No llegaron cotizaciones</Text>
        <Text style={styles.emptyText}>
          Ningún técnico envió cotización en este momento.{"\n"}Puedes intentar de nuevo o mejorar los detalles de tu solicitud.
        </Text>

        <View style={styles.emptyActions}>
          <TouchableOpacity
            style={styles.retryBtn}
            activeOpacity={0.8}
            onPress={handleRetry}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryText}>Intentar de nuevo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emptyCancel}
            activeOpacity={0.8}
            onPress={handleCancel}
          >
            <Text style={styles.emptyCancelText}>Cancelar solicitud</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoHome} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cotizaciones recibidas</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Count badge */}
      {!loading && !loadError && cotizaciones.length > 0 && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>
            {cotizaciones.length}{" "}
            {cotizaciones.length === 1 ? "cotización disponible" : "cotizaciones disponibles"}
          </Text>
        </View>
      )}

      {content}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.8}
          onPress={handleCancel}
        >
          <Text style={styles.cancelText}>Cancelar solicitud</Text>
        </TouchableOpacity>
      </View>

      {/* ── Modal de confirmación ───────────────────────────────── */}
      <Modal
        visible={!!selectedCotizacion}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCotizacion(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              ¿Estás de acuerdo con esta cotización?
            </Text>

            {selectedCotizacion && (
              <>
                <View style={styles.modalValueRow}>
                  <Text style={styles.modalLabel}>Valor:</Text>
                  <Text style={styles.modalValue}>
                    ${selectedCotizacion.valor_cotizacion.toLocaleString("es-CO")}
                  </Text>
                </View>

                <View style={styles.modalValueRow}>
                  <Text style={styles.modalLabel}>Tiempo estimado:</Text>
                  <Text style={styles.modalValueSm}>
                    {selectedCotizacion.tiempo_estimado}
                  </Text>
                </View>

                {/* Disclaimer */}
                <View style={styles.modalDisclaimer}>
                  <Ionicons name="alert-circle" size={18} color="#f59e0b" />
                  <Text style={styles.modalDisclaimerText}>
                    Este valor está sujeto a cambios tras la inspección visual del técnico en el sitio.
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              activeOpacity={0.8}
              onPress={handleConfirmAceptar}
            >
              <Text style={styles.modalConfirmText}>Sí, aceptar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              activeOpacity={0.8}
              onPress={() => setSelectedCotizacion(null)}
            >
              <Text style={styles.modalCancelText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal servicio programado confirmado ──────────────────── */}
      <Modal
        visible={showProgramadaModal}
        transparent
        animationType="fade"
        onRequestClose={handleProgramadaAccept}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.programadaIconWrap}>
              <Ionicons name="calendar-outline" size={48} color="#10b981" />
            </View>

            <Text style={styles.modalTitle}>Servicio programado</Text>

            <Text style={styles.programadaDesc}>
              Tu cotización ha sido aceptada. El técnico ha sido asignado y el servicio aparecerá en tu agenda.
            </Text>

            {fechaProgramada && (
              <View style={styles.programadaDateRow}>
                <Ionicons name="time-outline" size={18} color="#407ee3" />
                <Text style={styles.programadaDateText}>
                  Fecha: {new Date(fechaProgramada).toLocaleDateString("es-CO", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
            )}

            <Text style={styles.programadaHint}>
              Recibirás una notificación cuando se acerque la fecha del servicio.
            </Text>

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              activeOpacity={0.8}
              onPress={handleProgramadaAccept}
            >
              <Text style={styles.modalConfirmText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },

  header: {
    backgroundColor: "#407ee3",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    justifyContent: "space-between",
  },
  backBtn: { width: 36, alignItems: "flex-start" },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },

  countBar: {
    backgroundColor: "#f0f7ff",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  countText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#407ee3",
    textAlign: "center",
  },

  loadingText: { fontSize: 14, color: "#6b7280", marginTop: 8 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 32,
  },
  emptyActions: {
    width: "100%",
    paddingHorizontal: 32,
    marginTop: 24,
    gap: 12,
  },
  retryBtn: {
    backgroundColor: "#407ee3",
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyCancel: {
    borderWidth: 1.5,
    borderColor: "#cc2d2d",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  emptyCancelText: {
    color: "#cc2d2d",
    fontSize: 14,
    fontWeight: "600",
  },

  list: { padding: 20, gap: 16, paddingBottom: 20 },

  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  // Técnico row
  tecnicoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e5e7eb",
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  tecnicoInfo: { flex: 1 },
  tecnicoName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  ratingText: { fontSize: 12, color: "#6b7280", marginLeft: 4 },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  cardValor: {
    fontSize: 22,
    fontWeight: "700",
    color: "#407ee3",
  },
  cardBody: { marginBottom: 12 },
  cardRow: { flexDirection: "row", gap: 24, marginTop: 10 },
  cardCol: { flex: 1 },
  cardLabel: { fontSize: 12, color: "#6b7280", marginBottom: 2 },
  cardText: { fontSize: 14, color: "#374151" },

  badgeRow: { marginTop: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, color: "#10b981", fontWeight: "600" },

  disclaimerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: "#f59e0b",
    fontWeight: "500",
    flex: 1,
  },

  aceptarBtn: {
    backgroundColor: "#407ee3",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  aceptarText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: "#cc2d2d",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: { color: "#cc2d2d", fontSize: 15, fontWeight: "600" },

  // ── Modal ──────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 380,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 20,
  },
  modalValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalLabel: { fontSize: 14, color: "#6b7280" },
  modalValue: { fontSize: 20, fontWeight: "700", color: "#407ee3" },
  modalValueSm: { fontSize: 14, fontWeight: "600", color: "#374151" },
  modalDisclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fffbeb",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  modalDisclaimerText: {
    fontSize: 13,
    color: "#92400e",
    lineHeight: 18,
    flex: 1,
  },
  modalConfirmBtn: {
    backgroundColor: "#407ee3",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  modalConfirmText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  modalCancelBtn: {
    borderWidth: 1.5,
    borderColor: "#6b7280",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCancelText: { color: "#6b7280", fontSize: 14, fontWeight: "600" },

  // ── Programada modal ──────────────────────────────────────────
  programadaIconWrap: {
    alignItems: "center",
    marginBottom: 12,
  },
  programadaDesc: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  programadaDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0f7ff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  programadaDateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#407ee3",
    flex: 1,
  },
  programadaHint: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 20,
  },
});
