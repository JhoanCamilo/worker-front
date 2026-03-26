import { useSocketCotizaciones } from "@/src/hooks/useSocketCotizaciones";
import { useSocketSolicitudes } from "@/src/hooks/useSocketSolicitudes";
import {
    cancelarSolicitud,
    createSolicitudInmediata,
    createSolicitudProgramada,
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
    modo: string;
    fechaProgramada: string;
  }>();

  const esProgramada = params.modo === "PROGRAMADA";

  const [idSolicitud, setIdSolicitud] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cotizacionCount, setCotizacionCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(120); // 2 minutos
  const navigatedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const parseNumberParam = (value?: string) => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const getSolicitudErrorMessage = (err: any) => {
    const apiData = err?.response?.data;
    const detail = Array.isArray(apiData?.errors)
      ? apiData.errors[0]?.msg || apiData.errors[0]?.message
      : undefined;

    if (!apiData?.message) {
      return "No se pudo crear la solicitud.";
    }
    if (detail) {
      return `${apiData.message}: ${detail}`;
    }
    return apiData.message;
  };

  // ── Crear solicitud al montar ───────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const crear = async () => {
      try {
        // Si no hay coords del formulario, obtener ubicación actual
        let lat = parseNumberParam(params.lat);
        let lon = parseNumberParam(params.lon);

        const hasCoords = lat !== undefined && lon !== undefined;
        if (!hasCoords) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({});
            lat = loc.coords.latitude;
            lon = loc.coords.longitude;
          }
        }

        if (lat === undefined || lon === undefined) {
          setError("No se pudo obtener la ubicación para la solicitud.");
          return;
        }

        const finalLat: number = lat;
        const finalLon: number = lon;

        const direccion = [params.address, params.complement]
          .filter(Boolean)
          .join(", ");
        const idSubcategoria = parseNumberParam(params.subcategoryId);
        const descripcion = params.description?.trim() || "Sin descripción";

        const base = {
          ...(idSubcategoria !== undefined ? { id_subcategoria: idSubcategoria } : {}),
          descripcion,
          latitud: finalLat,
          longitud: finalLon,
          prioridad: "MEDIA" as const,
          ...(direccion ? { direccion } : {}),
        };

        console.log("[cliente] 📍 Coords enviadas →", {
          latitud: lat,
          longitud: lon,
        });

        let res;
        if (esProgramada && params.fechaProgramada) {
          const payload = { ...base, fecha_programada: params.fechaProgramada };
          console.log("[solicitud] POST /solicitudes/programada →", payload);
          res = await createSolicitudProgramada(payload);
        } else {
          console.log("[solicitud] POST /solicitudes/inmediata →", base);
          res = await createSolicitudInmediata(base);
        }

        if (cancelled) return;

        setIdSolicitud(res.id_solicitud);
        console.log(
          `[solicitud] ✅ Creada. id: ${res.id_solicitud} | técnicos notificados: ${res.tecnicos_notificados}`,
        );
      } catch (err: any) {
        if (cancelled) return;
        const msg = getSolicitudErrorMessage(err);
        console.error("[solicitud] ❌ Error:", msg);
        setError(msg);
      }
    };

    crear();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Timer cuenta regresiva 5 minutos ────────────────────────
  useEffect(() => {
    if (!idSolicitud || error) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Fallback: si el backend no emitió cotizaciones_listas, navegar igual
          goToCotizaciones(idSolicitud);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSolicitud, error]);

  const goToCotizaciones = (solId: number) => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    router.replace({
      pathname: "/(flows)/cotizaciones",
      params: { idSolicitud: String(solId) },
    });
  };

  // ── Socket: escuchar asignación ─────────────────────────────
  useSocketSolicitudes({
    idSolicitud: idSolicitud ?? undefined,
    onSolicitudAsignada: (data) => {
      console.log("[socket] ✅ Solicitud asignada →", data);
      // Solo navegar si la ventana de cotizaciones ya cerró
      // (esto ocurre cuando el backend asigna directamente)
      goToCotizaciones(data.id_solicitud);
    },
    onSolicitudCancelada: (data) => {
      console.log("[socket] Cancelada externamente →", data);
      setError("La solicitud fue cancelada.");
    },
  });

  // ── Socket: escuchar cotizaciones (ventana 5min / 5 cotizaciones) ──
  useSocketCotizaciones({
    idSolicitud: idSolicitud ?? undefined,
    onNuevaCotizacion: (data) => {
      setCotizacionCount((prev) => prev + 1);
      console.log("[socket] Nueva cotización recibida →", data);
    },
    onCotizacionesListas: (data) => {
      console.log(
        "[socket] Cotizaciones listas →",
        data.razon,
        "total:",
        data.total_cotizaciones,
      );
      goToCotizaciones(data.id_solicitud);
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

  let searchingTitle = "Buscando técnicos\ndisponibles";
  if (cotizacionCount > 0) {
    searchingTitle = "Recibiendo\ncotizaciones";
  } else if (esProgramada) {
    searchingTitle = "Buscando técnicos\npara tu servicio";
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{searchingTitle}</Text>

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

          {/* Contador de cotizaciones */}
          {cotizacionCount > 0 ? (
            <Text style={styles.cotizacionCount}>
              {cotizacionCount}{" "}
              {cotizacionCount === 1
                ? "cotización recibida"
                : "cotizaciones recibidas"}
            </Text>
          ) : (
            <Text style={styles.waitingText}>
              Esperando cotizaciones de técnicos cercanos...
            </Text>
          )}

          {/* Timer */}
          {secondsLeft > 0 && idSolicitud && (
            <Text style={styles.timerText}>
              Tiempo restante: {Math.floor(secondsLeft / 60)}:
              {String(secondsLeft % 60).padStart(2, "0")}
            </Text>
          )}

          <Text style={styles.infoText}>
            {esProgramada
              ? "Recibirás cotizaciones de técnicos disponibles\npara la fecha que seleccionaste"
              : "Recibirás hasta 5 cotizaciones o se te mostrarán\nlas disponibles en 2 minutos"}
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
  cotizacionCount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10b981",
    textAlign: "center",
    marginBottom: 8,
  },
  waitingText: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 32,
  },
  timerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#407ee3",
    textAlign: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 32,
    marginBottom: 16,
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
