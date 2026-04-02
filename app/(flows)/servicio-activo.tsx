import { useSocketServicios } from "@/src/hooks/useSocketServicios";
import { useSocketTracking } from "@/src/hooks/useSocketTracking";
import { useToast } from "@/src/hooks/useToast";
import {
    finalizarServicio,
    iniciarServicio,
    getServicioDetalle
} from "@/src/services/servicio.service";
import { getSolicitudDetalle } from "@/src/services/solicitud.service";
import { useServicioStore } from "@/src/store/servicio.store";
import { extraerCoordenadas } from "@/src/utils/coordinates";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { Component, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    AppState,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

// ── Error Boundary para prevenir crash nativo al renderizar el mapa ──
class MapErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn("[MapError] Crash nativo capturado por ErrorBoundary:", error.message);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

type Fase = "EN_CAMINO" | "LLEGO" | "EN_SERVICIO" | "FINALIZADO";
const MEDIO_PAGO_EFECTIVO = 1;

export default function ServicioActivoScreen() {
  const { idSolicitud, idServicio: idServicioParam } = useLocalSearchParams<{
    idSolicitud: string;
    idServicio: string;
  }>();
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToast();

  const mapRef = useRef<MapView>(null);
  const [fase, setFase] = useState<Fase>("EN_CAMINO");
  const [idServicio, setIdServicio] = useState<number | null>(
    idServicioParam ? Number(idServicioParam) : null,
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [countdownSecondsLeft, setCountdownSecondsLeft] = useState(300); // 5 minutos
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // ── Modal de pago al finalizar ──────────────────────────────────
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [valorPagado, setValorPagado] = useState("");

  // Solo rastrear si la app está en primer plano (watchPosition crashea en background en Android)
  // Los permisos de ubicación ya se solicitan al inicio desde _layout.tsx
  const [appIsActive, setAppIsActive] = useState(AppState.currentState === "active");

  const servicioActivo = useServicioStore((s) => s.servicioActivo);
  const setServicioActivo = useServicioStore((s) => s.setServicioActivo);
  const clearServicioActivo = useServicioStore((s) => s.clearServicioActivo);

  const idSolicitudNum = Number(idSolicitud);
  const idServicioNum = idServicioParam ? Number(idServicioParam) : null;

  // ── Detectar cambios Foreground/Background para proteger watchPosition ──
  useEffect(() => {
    let mounted = true;
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (mounted) setAppIsActive(nextAppState === "active");
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  // Fallback: al abrir desde push o app recien iniciada puede no existir estado en memoria.
  useEffect(() => {
    if (servicioActivo && fase !== servicioActivo.fase_tracking && servicioActivo.fase_tracking) {
      setFase(servicioActivo.fase_tracking as Fase);
    }
    if (servicioActivo) return;
    if (!Number.isFinite(idSolicitudNum)) return;

    let cancelled = false;

    getSolicitudDetalle(idSolicitudNum)
      .then((solicitud) => {
        if (cancelled) return;

        const coords = extraerCoordenadas(solicitud);
        if (!coords) {
          showError("No se pudo obtener la ubicacion del servicio");
          return;
        }

        let recoveredIdServicio =
          idServicioNum != null && Number.isFinite(idServicioNum)
            ? idServicioNum
            : 0;

        // Si es 0 o no tenemos un ID válido, buscarlo en las solicitudes generadas
        if (recoveredIdServicio === 0 && solicitud.servicios_generados?.length) {
          recoveredIdServicio = solicitud.servicios_generados[0].id_servicio;
          setIdServicio(recoveredIdServicio);
        }

        setServicioActivo({
          id_servicio: recoveredIdServicio,
          id_solicitud: idSolicitudNum,
          id_tecnico: 0,
          id_estado: solicitud.id_estado,
          valor_total: 0,
          valor_cotizacion: 0,
          cliente_lat: coords.lat,
          cliente_lon: coords.lon,
        });
      })
      .catch(() => {
        if (!cancelled) {
          showError("No se pudo cargar los datos del servicio");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    idServicioNum,
    idSolicitudNum,
    servicioActivo,
    setServicioActivo,
    showError,
  ]);

  // ── Socket: enviar GPS automáticamente (el hook detecta rol TECH) ──
  // Habilita el tracking SOLAMENTE si estamos activos. El expo watchPosition crashea en back.
  useSocketTracking({
    idSolicitud: Number(idSolicitud),
    enabled: appIsActive,
    onTecnicoLlego: () => {
      if (fase === "EN_CAMINO") {
        setFase("LLEGO");
        setCountdownSecondsLeft(300);
      }
    },
  });

  // ── Sincronizar Fase en Store para recuperación ─────────────────
  useEffect(() => {
    if (servicioActivo) {
      useServicioStore.getState().updateFaseTracking(fase);
    }
  }, [fase, servicioActivo]);

  // ── Socket: lifecycle del servicio ──────────────────────────────
  useSocketServicios({
    onPagoConfirmado: () => {
      showSuccess("Pago confirmado. Servicio cerrado correctamente");
      clearServicioActivo();
      setTimeout(() => {
        router.replace("/(technician)/home");
      }, 1200);
    },
    onCalificacionRecibida: (data) => {
      showSuccess(`¡Calificación recibida: ${data.puntuacion}⭐!`);
      clearServicioActivo();
      setTimeout(() => {
        router.replace("/(technician)/home");
      }, 1500);
    },
  });

  // ── Countdown de 5 minutos después de llegar ───────────────────
  useEffect(() => {
    if (fase !== "LLEGO") {
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      setCountdownSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          countdownIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [fase]);

  // ── Confirmar llegada manual ──────────────────────────────────────
  const handleLlegueManual = () => {
    Alert.alert(
      "Confirmar llegada",
      "¿Confirmas que ya llegaste a la ubicación del cliente?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, ya llegué",
          onPress: () => {
            setFase("LLEGO");
            setCountdownSecondsLeft(300);
            showSuccess("Llegada confirmada");
          },
        },
      ],
    );
  };

  // ── Iniciar servicio ────────────────────────────────────────────
  const confirmarIniciar = async () => {
    setActionLoading(true);
    try {
      const resp = await iniciarServicio(Number(idSolicitud));
      setIdServicio(resp.id_servicio);
      setFase("EN_SERVICIO");
      showSuccess("Servicio iniciado correctamente");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "No se pudo iniciar el servicio";
      showError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleIniciar = () => {
    if (countdownSecondsLeft > 0) {
      const min = Math.floor(countdownSecondsLeft / 60);
      const sec = countdownSecondsLeft % 60;
      Alert.alert(
        "Tiempo de espera",
        `Aún quedan ${min}:${String(sec).padStart(2, "0")} del tiempo recomendado de espera.\n\n¿Deseas iniciar el servicio de todas formas?`,
        [
          { text: "Esperar", style: "cancel" },
          {
            text: "Iniciar ahora",
            onPress: () => {
              void confirmarIniciar();
            },
          },
        ],
      );
    } else {
      Alert.alert(
        "Iniciar servicio",
        "¿Confirmas que deseas iniciar el servicio?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Iniciar",
            onPress: () => {
              void confirmarIniciar();
            },
          },
        ],
      );
    }
  };

  // ── Finalizar servicio ──────────────────────────────────────────
  const handleFinalizar = () => {
    if (!idServicio) return;
    setShowPaymentModal(true);
  };

  const confirmarFinalizar = async () => {
    if (!idServicio) return;

    const monto = Number(valorPagado);
    if (!valorPagado.trim() || Number.isNaN(monto) || monto <= 0) {
      showError("Ingresa el valor que te pagó el cliente");
      return;
    }

    setShowPaymentModal(false);
    setActionLoading(true);
    try {
      await finalizarServicio(idServicio, {
        id_medioPago: MEDIO_PAGO_EFECTIVO,
        valor_total: monto,
      });
      setFase("FINALIZADO");
      showSuccess("Servicio finalizado. Esperando confirmación del cliente...");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "No se pudo finalizar el servicio";
      showError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (servicioActivo?.fase_tracking === "FINALIZADO") {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ fontSize: 20, fontWeight: "700", marginTop: 16 }}>Esperando confirmación</Text>
        <Text style={{ fontSize: 15, color: "#6b7280", textAlign: "center", paddingHorizontal: 32 }}>
          El cliente debe confirmar el pago en su aplicación para concluir totalmente el servicio de forma confirmada.
        </Text>

        <View style={{ marginTop: 40, width: "100%", paddingHorizontal: 32, gap: 12 }}>
          <TouchableOpacity
            style={{ backgroundColor: "#407ee3", padding: 14, borderRadius: 10, alignItems: "center" }}
            activeOpacity={0.8}
            onPress={async () => {
              try {
                // Sincronización manual 
                const det = await getServicioDetalle(servicioActivo.id_servicio);
                if (det.id_estado === 6) { // 6 = COMPLETADO
                   clearServicioActivo();
                   router.replace("/(technician)/home");
                   return;
                }
                Alert.alert("Aún no confirmado", "El cliente aún no ha confirmado el pago en su aplicación.");
              } catch {
                Alert.alert("Error", "No se pudo actualizar el estado.");
              }
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Actualizar estado</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ 
              backgroundColor: "#f9fafb", 
              padding: 14, 
              borderRadius: 10, 
              alignItems: "center",
              borderWidth: 1.5,
              borderColor: "#6b7280" 
            }}
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert(
                "Dejar pago pendiente",
                "¿Deseas salir y dejar el pago pendiente? Ya cumpliste con el servicio y serás notificado cuando el cliente finalmente lo confirme.",
                [
                  { text: "No, esperar", style: "cancel" },
                  { 
                    text: "Sí, salir ahora", 
                    onPress: () => {
                      clearServicioActivo();
                      router.replace("/(technician)/home");
                    }
                  }
                ]
              );
            }}
          >
            <Text style={{ color: "#374151", fontWeight: "700", fontSize: 15 }}>Dejar pendiente y salir</Text>
          </TouchableOpacity>
        </View>

      </View>
    );
  }

  if (!servicioActivo) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#407ee3" />
        <Text style={styles.loadingText}>Cargando datos del servicio...</Text>
      </View>
    );
  }

  // Si el backend dice que esto está cancelado o completado y ya se cerró la fase_tracking, chao
  if (servicioActivo.id_estado >= 6 && fase === "FINALIZADO") {
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-done-circle" size={48} color="#10b981" />
        <Text style={{ color: "#4b5563", marginTop: 12, fontSize: 16, textAlign: 'center' }}>
          Este servicio ha finalizado.
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 24, padding: 12, backgroundColor: '#407ee3', borderRadius: 8 }} 
          onPress={() => {
            clearServicioActivo();
            router.replace("/(technician)/home");
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Guard: si las coordenadas son inválidas el MapView de Google crashea la app entera en Android
  if (
    !servicioActivo.cliente_lat ||
    !servicioActivo.cliente_lon ||
    Number.isNaN(servicioActivo.cliente_lat) ||
    Number.isNaN(servicioActivo.cliente_lon) ||
    (servicioActivo.cliente_lat === 0 && servicioActivo.cliente_lon === 0)
  ) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#407ee3" />
        <Text style={styles.loadingText}>Obteniendo ubicación del cliente...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(technician)/home")} style={styles.backBtn}>
          <Ionicons name="home" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Servicio activo</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Map — envuelto en ErrorBoundary para capturar crashes nativos */}
      <MapErrorBoundary
        fallback={
          <View style={[styles.center, styles.map]}>
            <Ionicons name="warning-outline" size={48} color="#f59e0b" />
            <Text style={[styles.loadingText, { textAlign: "center", paddingHorizontal: 24 }]}>
              No se pudo cargar el mapa.{"\n"}Puedes continuar con las acciones de la pantalla.
            </Text>
          </View>
        }
      >
        {appIsActive ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: servicioActivo.cliente_lat,
              longitude: servicioActivo.cliente_lon,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
          >
            <Marker
              coordinate={{
                latitude: servicioActivo.cliente_lat,
                longitude: servicioActivo.cliente_lon,
              }}
              title="Ubicación del cliente"
            >
              <View style={styles.markerClient}>
                <Ionicons name="home" size={20} color="#fff" />
              </View>
            </Marker>
          </MapView>
        ) : (
          <View style={[styles.center, styles.map]}>
            <Ionicons name="location-outline" size={48} color="#9ca3af" />
            <Text style={styles.loadingText}>Conectando GPS y mapa...</Text>
          </View>
        )}
      </MapErrorBoundary>

      {/* Status card */}
      <View style={styles.statusCard}>
        <View
          style={[styles.statusBadge, { backgroundColor: getFaseColor(fase) }]}
        >
          <Text style={styles.statusText}>{getFaseLabel(fase)}</Text>
        </View>

        {fase === "EN_CAMINO" && (
          <>
            <Text style={styles.infoText}>
              Dirígete a la ubicación del cliente
            </Text>
            <TouchableOpacity
              style={styles.llegueBtn}
              activeOpacity={0.8}
              onPress={handleLlegueManual}
            >
              <Ionicons name="location" size={18} color="#fff" />
              <Text style={styles.actionText}>Ya llegué</Text>
            </TouchableOpacity>
          </>
        )}

        {fase === "LLEGO" && (
          <>
            <Text style={styles.infoText}>
              Has llegado a la ubicación del cliente
            </Text>
            {countdownSecondsLeft > 0 && (
              <Text style={styles.countdownText}>
                Podrás iniciar en {Math.floor(countdownSecondsLeft / 60)}:
                {String(countdownSecondsLeft % 60).padStart(2, "0")}
              </Text>
            )}
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.8}
              onPress={handleIniciar}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="play-arrow" size={20} color="#fff" />
                  <Text style={styles.actionText}>Iniciar servicio</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {fase === "EN_SERVICIO" && (
          <>
            <Text style={styles.infoText}>Servicio en progreso...</Text>
            <TouchableOpacity
              style={[styles.actionBtn, styles.finalizarBtn]}
              activeOpacity={0.8}
              onPress={handleFinalizar}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="check-circle" size={20} color="#fff" />
                  <Text style={styles.actionText}>Finalizar servicio</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {fase === "FINALIZADO" && (
          <Text style={styles.infoText}>
            Esperando confirmación de pago del cliente...
          </Text>
        )}
      </View>

      {/* ── Modal: ¿Cuánto te pagaron? ─────────────────────────── */}
      <Modal visible={showPaymentModal} transparent animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowPaymentModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>¿Cuánto te pagó el cliente?</Text>

            {servicioActivo?.valor_cotizacion != null && (
              <View style={styles.modalCotizacionRow}>
                <Text style={styles.modalCotizacionLabel}>Valor cotizado:</Text>
                <Text style={styles.modalCotizacionValue}>
                  ${servicioActivo.valor_cotizacion.toLocaleString("es-CO")}
                </Text>
              </View>
            )}

            <View style={styles.modalInputRow}>
              <Text style={styles.modalCurrency}>$</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej: 80000"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
                value={valorPagado}
                onChangeText={setValorPagado}
              />
            </View>

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              activeOpacity={0.8}
              onPress={confirmarFinalizar}
            >
              <Text style={styles.modalConfirmText}>Finalizar servicio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              activeOpacity={0.8}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function getFaseColor(fase: Fase): string {
  switch (fase) {
    case "EN_CAMINO":
      return "#407ee3";
    case "LLEGO":
      return "#10b981";
    case "EN_SERVICIO":
      return "#8b5cf6";
    case "FINALIZADO":
      return "#6b7280";
  }
}

function getFaseLabel(fase: Fase): string {
  switch (fase) {
    case "EN_CAMINO":
      return "En camino al cliente";
    case "LLEGO":
      return "Has llegado";
    case "EN_SERVICIO":
      return "Servicio en progreso";
    case "FINALIZADO":
      return "Servicio finalizado";
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: { fontSize: 14, color: "#9ca3af" },

  header: {
    backgroundColor: "#407ee3",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    justifyContent: "space-between",
    zIndex: 10,
  },
  backBtn: { width: 36, alignItems: "flex-start" },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },

  map: { flex: 1 },

  markerClient: {
    backgroundColor: "#407ee3",
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },

  statusCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  infoText: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  countdownText: { fontSize: 16, fontWeight: "700", color: "#f2c70f" },

  llegueBtn: {
    flexDirection: "row",
    backgroundColor: "#f59e0b",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    width: "100%",
    justifyContent: "center",
  },
  actionBtn: {
    flexDirection: "row",
    backgroundColor: "#10b981",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    width: "100%",
    justifyContent: "center",
  },
  finalizarBtn: {
    backgroundColor: "#cc2d2d",
  },
  actionText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // ── Modal pago ──────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
  },
  modalCotizacionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f7ff",
    borderRadius: 8,
    padding: 12,
  },
  modalCotizacionLabel: { fontSize: 13, color: "#6b7280" },
  modalCotizacionValue: { fontSize: 18, fontWeight: "700", color: "#407ee3" },
  modalInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#407ee3",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  modalCurrency: { fontSize: 20, fontWeight: "700", color: "#374151" },
  modalInput: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 8,
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  modalConfirmBtn: {
    backgroundColor: "#10b981",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  modalConfirmText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  modalCancelBtn: {
    borderWidth: 1.5,
    borderColor: "#6b7280",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelText: { color: "#6b7280", fontSize: 14, fontWeight: "600" },
});
