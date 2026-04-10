import { useToast } from "@/src/hooks/useToast";
import { updateDisponibilidad } from "@/src/services/technician.service";
import { useAuthStore } from "@/src/store/auth.store";
import { useServicioStore } from "@/src/store/servicio.store";
import { useTecnicoEstadoStore } from "@/src/store/tecnico-estado.store";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function TechnicianHomeScreen() {
  const router = useRouter();
  const updateUser = useAuthStore((state) => state.updateUser);
  const active = useAuthStore((state) => state.user?.disponible ?? false);
  const servicioActivo = useServicioStore((s) => s.servicioActivo);
  const solicitudPendiente = useTecnicoEstadoStore(
    (s) => s.solicitudInmediataPendiente,
  );
  const citasProximas = useTecnicoEstadoStore((s) => s.citasProximasAsignadas);

  const [loading, setLoading] = useState(false);
  const { error } = useToast();

  const handleToggle = async () => {
    // Si está activo y quiere desactivarse, verificar servicio en curso
    if (active && servicioActivo) {
      Alert.alert(
        "Servicio en curso",
        "Tienes un servicio en ejecución. No puedes desactivarte hasta que lo finalices.",
      );
      return;
    }

    const next = !active;
    setLoading(true);
    try {
      let coords: { latitud: number; longitud: number } | undefined;

      if (next) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          coords = {
            latitud: loc.coords.latitude,
            longitud: loc.coords.longitude,
          };
          console.log("[técnico] Coords →", coords);
        } else {
          console.warn("[técnico] Permiso de ubicación denegado");
        }
      }

      await updateDisponibilidad(next, coords);
      updateUser({ disponible: next });
    } catch {
      error("No se pudo actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Body con logo de fondo */}
      <View style={styles.body}>
        <Image
          source={require("@/assets/images/favicon.png")}
          style={styles.bgLogo}
          resizeMode="contain"
        />
      </View>

      {/* Botón de estado */}
      <View style={styles.footer}>
        {servicioActivo ? (
          <TouchableOpacity
            style={[styles.pendingCta, { borderColor: "#10b981", backgroundColor: "#ecfdf5" }]}
            activeOpacity={0.85}
            onPress={() =>
              router.replace({
                pathname: "/(flows)/servicio-activo",
                params: {
                  idSolicitud: String(servicioActivo.id_solicitud),
                  idServicio: String(servicioActivo.id_servicio),
                },
              })
            }
          >
            <Text style={[styles.pendingCtaTitle, { color: "#047857" }]}>
              Servicio activo en progreso
            </Text>
            <Text style={[styles.pendingCtaText, { color: "#065f46" }]} numberOfLines={1}>
              Toca para volver a la pantalla del servicio
            </Text>
          </TouchableOpacity>
        ) : solicitudPendiente?.solicitud?.id_solicitud ? (
          <TouchableOpacity
            style={styles.pendingCta}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/(flows)/tecnico-solicitud",
                params: {
                  id: String(solicitudPendiente.solicitud.id_solicitud),
                },
              })
            }
          >
            <Text style={styles.pendingCtaTitle}>
              Solicitud inmediata pendiente
            </Text>
            <Text style={styles.pendingCtaText} numberOfLines={1}>
              {solicitudPendiente.solicitud.descripcion}
            </Text>
          </TouchableOpacity>
        ) : null}

        {!servicioActivo && !solicitudPendiente && citasProximas.length > 0 ? (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>
              Tienes {citasProximas.length} cita(s) próxima(s)
            </Text>
            <Text style={styles.summaryText} numberOfLines={1}>
              Próxima:{" "}
              {new Date(citasProximas[0].fecha_cita).toLocaleString("es-CO")}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.statusButton,
            { backgroundColor: active ? "#14c681" : "#9ca3af" },
          ]}
          onPress={handleToggle}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.statusText}>
              {active ? "Estado: Activo" : "Estado: Inactivo"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bgLogo: {
    width: 220,
    height: 220,
    opacity: 0.15,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  pendingCta: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: 10,
    padding: 12,
  },
  pendingCtaTitle: {
    color: "#92400e",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  pendingCtaText: {
    color: "#78350f",
    fontSize: 12,
  },
  summaryBox: {
    backgroundColor: "#eef2ff",
    borderRadius: 10,
    padding: 12,
  },
  summaryTitle: {
    color: "#3730a3",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  summaryText: {
    color: "#4338ca",
    fontSize: 12,
  },
  statusButton: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  statusText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
