import { useSocketServicios } from "@/src/hooks/useSocketServicios";
import { useSocketTracking } from "@/src/hooks/useSocketTracking";
import { useToast } from "@/src/hooks/useToast";
import { useServicioStore } from "@/src/store/servicio.store";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

type Estado = "EN_CAMINO" | "CERCA" | "LLEGO" | "EN_SERVICIO" | "FINALIZADO";

export default function TrackingClienteScreen() {
  const { idSolicitud, idServicio } = useLocalSearchParams<{
    idSolicitud: string;
    idServicio: string;
  }>();
  const router = useRouter();
  const { success: showSuccess } = useToast();

  const mapRef = useRef<MapView>(null);
  const [estado, setEstado] = useState<Estado>("EN_CAMINO");
  const [distanciaMetros, setDistanciaMetros] = useState<number | null>(null);

  const servicioActivo = useServicioStore((s) => s.servicioActivo);
  const updateTecnicoLocation = useServicioStore(
    (s) => s.updateTecnicoLocation,
  );
  const clearServicioActivo = useServicioStore((s) => s.clearServicioActivo);

  // ── Socket: recibir GPS del técnico ───────────────────────────
  useSocketTracking({
    idSolicitud: Number(idSolicitud),
    onUbicacion: (data) => {
      updateTecnicoLocation(data.latitud, data.longitud);
      setDistanciaMetros(data.distancia_restante_metros);

      if (mapRef.current && servicioActivo?.cliente_lat) {
        mapRef.current.fitToCoordinates(
          [
            {
              latitude: servicioActivo.cliente_lat,
              longitude: servicioActivo.cliente_lon,
            },
            { latitude: data.latitud, longitude: data.longitud },
          ],
          {
            edgePadding: { top: 120, right: 60, bottom: 300, left: 60 },
            animated: true,
          },
        );
      }
    },
    onTecnicoCerca: () => {
      setEstado("CERCA");
      showSuccess("El técnico está cerca (menos de 500m)");
    },
    onTecnicoLlego: () => {
      setEstado("LLEGO");
      showSuccess("¡El técnico ha llegado!");
    },
  });

  // ── Socket: lifecycle del servicio ────────────────────────────
  useSocketServicios({
    onServicioIniciado: () => {
      setEstado("EN_SERVICIO");
      // Mostrar brevemente que inició, luego enviar al home
      // El cliente recibirá push notification cuando el servicio finalice
      setTimeout(() => {
        clearServicioActivo();
        router.replace("/(tabs)/home");
      }, 3000);
    },
    onServicioFinalizado: (data) => {
      // Fallback: si el cliente aún está en esta pantalla
      setEstado("FINALIZADO");
      setTimeout(() => {
        clearServicioActivo();
        router.replace({
          pathname: "/(flows)/calificar",
          params: {
            idServicio: String(data.id_servicio),
            valorTotal: String(data.valor_total ?? 0),
          },
        });
      }, 1500);
    },
  });

  if (!servicioActivo) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#407ee3" />
        <Text style={styles.loadingText}>Conectando con el técnico...</Text>
      </View>
    );
  }

  const distanciaStr =
    distanciaMetros != null
      ? distanciaMetros < 1000
        ? `${Math.round(distanciaMetros)}m`
        : `${(distanciaMetros / 1000).toFixed(1)}km`
      : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seguimiento en vivo</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: servicioActivo.cliente_lat,
          longitude: servicioActivo.cliente_lon,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
      >
        {/* Marcador del cliente */}
        <Marker
          coordinate={{
            latitude: servicioActivo.cliente_lat,
            longitude: servicioActivo.cliente_lon,
          }}
          title="Tu ubicación"
        >
          <View style={styles.markerClient}>
            <Ionicons name="home" size={20} color="#fff" />
          </View>
        </Marker>

        {/* Marcador del técnico */}
        {servicioActivo.tecnico_lat != null &&
          servicioActivo.tecnico_lon != null && (
            <Marker
              coordinate={{
                latitude: servicioActivo.tecnico_lat,
                longitude: servicioActivo.tecnico_lon,
              }}
              title="Técnico"
            >
              <View style={styles.markerTech}>
                <MaterialIcons name="engineering" size={20} color="#fff" />
              </View>
            </Marker>
          )}
      </MapView>

      {/* Status card */}
      <View style={styles.statusCard}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(estado) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(estado)}</Text>
        </View>

        {(estado === "EN_CAMINO" || estado === "CERCA") && (
          <Text style={styles.distanceText}>
            Distancia: {distanciaStr ?? "Calculando..."}
          </Text>
        )}

        {estado === "LLEGO" && (
          <Text style={styles.infoText}>El técnico está en tu ubicación</Text>
        )}

        {estado === "EN_SERVICIO" && (
          <>
            <Text style={styles.infoText}>
              El técnico ha iniciado el trabajo
            </Text>
            <Text style={styles.subInfoText}>
              Te notificaremos cuando el servicio finalice
            </Text>
          </>
        )}

        {estado === "FINALIZADO" && (
          <Text style={styles.infoText}>Redirigiendo a calificación...</Text>
        )}
      </View>
    </View>
  );
}

function getStatusColor(estado: Estado): string {
  switch (estado) {
    case "EN_CAMINO":
      return "#407ee3";
    case "CERCA":
      return "#f2c70f";
    case "LLEGO":
      return "#10b981";
    case "EN_SERVICIO":
      return "#8b5cf6";
    case "FINALIZADO":
      return "#6b7280";
  }
}

function getStatusLabel(estado: Estado): string {
  switch (estado) {
    case "EN_CAMINO":
      return "Técnico en camino";
    case "CERCA":
      return "Técnico cerca";
    case "LLEGO":
      return "¡Tu técnico ha llegado!";
    case "EN_SERVICIO":
      return "Servicio en progreso";
    case "FINALIZADO":
      return "Servicio finalizado";
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
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
  markerTech: {
    backgroundColor: "#f2c70f",
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
  distanceText: { fontSize: 14, color: "#374151" },
  infoText: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  subInfoText: { fontSize: 12, color: "#9ca3af", textAlign: "center" },
});
