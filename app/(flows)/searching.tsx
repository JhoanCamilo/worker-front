import { useSocketSolicitudes } from "@/src/hooks/useSocketSolicitudes";
import {
  cancelarSolicitud,
  createSolicitudInmediata,
} from "@/src/services/solicitud.service";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SearchingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
    subcategoryId: string;
    subcategoryName: string;
    address: string;
    complement: string;
    description: string;
    lat: string;
    lon: string;
  }>();

  const [idSolicitud, setIdSolicitud] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Animación radar ─────────────────────────────────────────
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // ── Crear solicitud al montar ───────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const crear = async () => {
      try {
        // Si no hay coords del formulario, obtener ubicación actual
        let lat = params.lat ? Number(params.lat) : null;
        let lon = params.lon ? Number(params.lon) : null;

        if (!lat || !lon) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({});
            lat = loc.coords.latitude;
            lon = loc.coords.longitude;
          }
        }

        if (!lat || !lon) {
          setError("No se pudo obtener la ubicación para la solicitud.");
          return;
        }

        const payload = {
          id_subcategoria: params.subcategoryId ? Number(params.subcategoryId) : null,
          descripcion: params.description || "",
          latitud: lat,
          longitud: lon,
          prioridad: "MEDIA" as const,
        };

        console.log("[cliente] 📍 Coords enviadas →", { latitud: lat, longitud: lon });
        console.log("[solicitud] Enviando POST /solicitudes/inmediata →", payload);

        const res = await createSolicitudInmediata(payload);

        if (cancelled) return;

        setIdSolicitud(res.id_solicitud);
        console.log(`[solicitud] ✅ Creada. id: ${res.id_solicitud} | técnicos notificados: ${res.tecnicos_notificados}`);
      } catch (err: any) {
        if (cancelled) return;
        const msg = err?.response?.data?.message ?? "No se pudo crear la solicitud.";
        console.error("[solicitud] ❌ Error:", msg);
        setError(msg);
      }
    };

    crear();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Socket: escuchar asignación ─────────────────────────────
  useSocketSolicitudes({
    idSolicitud: idSolicitud ?? undefined,
    onSolicitudAsignada: (data) => {
      console.log("[socket] ✅ Solicitud asignada →", data);
      // TODO: navegar a pantalla de cotizaciones
    },
    onSolicitudCancelada: (data) => {
      console.log("[socket] Cancelada externamente →", data);
    },
  });

  // ── Cancelar ────────────────────────────────────────────────
  const handleCancel = async () => {
    if (idSolicitud) {
      try {
        await cancelarSolicitud(idSolicitud);
        console.log("[solicitud] Cancelada por el usuario. id:", idSolicitud);
      } catch {
        console.warn("[solicitud] No se pudo cancelar en el servidor.");
      }
    }
    router.replace("/(tabs)/home");
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Buscando técnicos{"\n"}disponibles</Text>

      <View style={styles.iconWrapper}>
        {error ? (
          <MaterialIcons name="error-outline" size={100} color="#ef4444" />
        ) : (
          <Animated.View style={{ transform: [{ rotate }] }}>
            <MaterialIcons name="radar" size={140} color="#407ee3" />
          </Animated.View>
        )}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          <Text style={styles.subtitle}>
            {params.categoryName}
            {params.subcategoryName ? ` · ${params.subcategoryName}` : ""}
          </Text>
          <Text style={styles.address} numberOfLines={2}>
            {params.address}
          </Text>
        </>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.8}
          onPress={handleCancel}
        >
          <Text style={styles.cancelText}>Cancelar solicitud</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 80,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#5e5e5e",
    textAlign: "center",
    lineHeight: 38,
    paddingHorizontal: 32,
  },
  iconWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: 6,
    paddingHorizontal: 32,
  },
  address: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  footer: {
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 50,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: "#cc2d2d",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#cc2d2d",
  },
});
