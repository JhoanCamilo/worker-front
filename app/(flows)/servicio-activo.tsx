import { useSocketTracking } from "@/src/hooks/useSocketTracking";
import { useSocketServicios } from "@/src/hooks/useSocketServicios";
import { useServicioStore } from "@/src/store/servicio.store";
import {
  iniciarServicio,
  finalizarServicio,
} from "@/src/services/servicio.service";
import { useToast } from "@/src/hooks/useToast";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

type Fase = "EN_CAMINO" | "LLEGO" | "EN_SERVICIO" | "FINALIZADO";

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

  const servicioActivo = useServicioStore((s) => s.servicioActivo);
  const clearServicioActivo = useServicioStore((s) => s.clearServicioActivo);

  // ── Socket: enviar GPS automáticamente (el hook detecta rol TECH) ──
  useSocketTracking({
    idSolicitud: Number(idSolicitud),
    onTecnicoLlego: () => {
      setFase("LLEGO");
    },
  });

  // ── Socket: lifecycle del servicio ──────────────────────────────
  useSocketServicios({
    onCalificacionRecibida: (data) => {
      showSuccess(`¡Calificación recibida: ${data.puntuacion}⭐!`);
      clearServicioActivo();
      setTimeout(() => {
        router.replace("/(tabs)/home");
      }, 1500);
    },
  });

  // ── Iniciar servicio ────────────────────────────────────────────
  const handleIniciar = async () => {
    Alert.alert(
      "Iniciar servicio",
      "¿Confirmas que estás en la ubicación del cliente y deseas iniciar el servicio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Iniciar",
          onPress: async () => {
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
          },
        },
      ],
    );
  };

  // ── Finalizar servicio ──────────────────────────────────────────
  const handleFinalizar = async () => {
    if (!idServicio) return;
    Alert.alert(
      "Finalizar servicio",
      "¿Confirmas que el trabajo ha sido completado?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Finalizar",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await finalizarServicio(idServicio);
              setFase("FINALIZADO");
              showSuccess("Servicio finalizado. Esperando calificación...");
            } catch (err: any) {
              const msg =
                err?.response?.data?.message ??
                "No se pudo finalizar el servicio";
              showError(msg);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  if (!servicioActivo) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#407ee3" />
        <Text style={styles.loadingText}>Cargando datos del servicio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Servicio activo</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation
        showsMyLocationButton
        initialRegion={{
          latitude: servicioActivo.cliente_lat,
          longitude: servicioActivo.cliente_lon,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
      >
        {/* Marcador del cliente (destino) */}
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

      {/* Status card */}
      <View style={styles.statusCard}>
        <View
          style={[styles.statusBadge, { backgroundColor: getFaseColor(fase) }]}
        >
          <Text style={styles.statusText}>{getFaseLabel(fase)}</Text>
        </View>

        {fase === "EN_CAMINO" && (
          <Text style={styles.infoText}>
            Dirígete a la ubicación del cliente
          </Text>
        )}

        {fase === "LLEGO" && (
          <>
            <Text style={styles.infoText}>
              Has llegado a la ubicación del cliente
            </Text>
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
            Esperando calificación del cliente...
          </Text>
        )}
      </View>
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
});
