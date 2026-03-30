import { SolicitudDisponibleModal } from "@/src/components/ui/SolicitudDisponibleModal";
import { useSocketCotizaciones } from "@/src/hooks/useSocketCotizaciones";
import { useSocketSolicitudes } from "@/src/hooks/useSocketSolicitudes";
import { useToast } from "@/src/hooks/useToast";
import {
    logRealtimeEvento,
    logRealtimeNavegacion,
} from "@/src/services/realtime-log.service";
import { getSolicitudDetalle } from "@/src/services/solicitud.service";
import {
    getTechnicianEstadoActual,
    updateDisponibilidad,
} from "@/src/services/technician.service";
import { useAuthStore } from "@/src/store/auth.store";
import { useNotificacionStore } from "@/src/store/notificacion.store";
import { useServicioStore } from "@/src/store/servicio.store";
import { useTecnicoEstadoStore } from "@/src/store/tecnico-estado.store";
import { NuevaSolicitudPayload } from "@/src/types/socket.types";
import { extraerCoordenadas } from "@/src/utils/coordinates";
import { normalizeCotizacionAceptada } from "@/src/utils/cotizacionAceptada";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, AppState, Text, TouchableOpacity, View } from "react-native";

const TAB_BG = "#407ee3";
const ACTIVE = "#f2c70f";
const INACTIVE = "rgba(0,0,0,0.5)";

function HeaderTitle() {
  const user = useAuthStore((state) => state.user);
  return (
    <Text>
      <Text style={{ color: "#fff", fontSize: 18 }}>Bienvenido, </Text>
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
        {user?.name ?? "Técnico"}
      </Text>
    </Text>
  );
}

function NotificationBell() {
  const router = useRouter();
  const noLeidas = useNotificacionStore((s) => s.noLeidas);

  return (
    <TouchableOpacity
      onPress={() => router.push("/(flows)/notificaciones" as never)}
      style={{ marginRight: 14 }}
    >
      <Ionicons name="notifications" size={24} color="#fff" />
      {noLeidas > 0 && (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -6,
            backgroundColor: "#cc2d2d",
            borderRadius: 9,
            minWidth: 18,
            height: 18,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
            {noLeidas > 99 ? "99+" : noLeidas}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function TechnicianLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { success: showSuccess, error: showError } = useToast();

  const disponible = useAuthStore((s) => s.user?.disponible ?? false);
  const updateUser = useAuthStore((s) => s.updateUser);
  const setServicioActivo = useServicioStore((s) => s.setServicioActivo);
  const clearServicioActivo = useServicioStore((s) => s.clearServicioActivo);
  const setEstadoActual = useTecnicoEstadoStore((s) => s.setEstadoActual);
  const [solicitudActiva, setSolicitudActiva] =
    useState<NuevaSolicitudPayload | null>(null);
  const [estadoInicialListo, setEstadoInicialListo] = useState(false);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // ── Rehidratación fría de estado técnico (solo una vez al montar) ──
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Forzar disponible = false al montar (el técnico activa manualmente)
        try {
          await updateDisponibilidad(false);
        } catch {
          // Si falla el PUT, igual continuamos con la rehidratación
        }
        if (cancelled) return;

        const estado = await getTechnicianEstadoActual();
        if (cancelled) return;

        updateUser({ disponible: estado.disponibilidad.disponible_inmediato });
        setEstadoActual({
          disponibilidad: estado.disponibilidad,
          citasProximasAsignadas: estado.citas_proximas_asignadas ?? [],
          solicitudInmediataPendiente: estado.solicitud_inmediata_pendiente,
        });

        if (estado.servicio_activo) {
          try {
            const detalle = await getSolicitudDetalle(
              estado.servicio_activo.id_solicitud,
            );
            if (cancelled) return;

            const coords = extraerCoordenadas(detalle);
            if (coords) {
              setServicioActivo({
                id_servicio: estado.servicio_activo.id_servicio,
                id_solicitud: estado.servicio_activo.id_solicitud,
                id_tecnico: 0,
                id_estado: estado.servicio_activo.id_estado,
                valor_total: 0,
                valor_cotizacion: 0,
                cliente_lat: coords.lat,
                cliente_lon: coords.lon,
              });
            }
          } catch {
            // Fallback de pantalla maneja rehidratación por id_solicitud
          }

          if (pathnameRef.current !== "/(flows)/servicio-activo") {
            router.replace({
              pathname: "/(flows)/servicio-activo",
              params: {
                idSolicitud: String(estado.servicio_activo.id_solicitud),
                idServicio: String(estado.servicio_activo.id_servicio),
              },
            });
          }

          setSolicitudActiva(null);
        } else {
          clearServicioActivo();

          const pendiente = estado.solicitud_inmediata_pendiente;
          if (pendiente?.solicitud?.id_solicitud) {
            setSolicitudActiva({
              id_solicitud: pendiente.solicitud.id_solicitud,
              id_cliente: 0,
              id_subcategoria: 0,
              subcategoria: "Servicio",
              descripcion: pendiente.solicitud.descripcion,
              tipo_solicitud:
                pendiente.solicitud.tipo_servicio === "INMEDIATO"
                  ? "INMEDIATA"
                  : "PROGRAMADA",
              prioridad: (pendiente.solicitud.prioridad as any) ?? "MEDIA",
              direccion_servicio: pendiente.solicitud.direccion_servicio,
              distancia_metros: 0,
              priority_score: pendiente.priority_score,
            });
          } else {
            setSolicitudActiva(null);
          }
        }
      } catch (err) {
        console.warn("[layout/técnico] Error cargando estado-actual:", err);
      } finally {
        if (!cancelled) setEstadoInicialListo(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── AppState: prompt technician when returning from background ──
  const appStateRef = useRef(AppState.currentState);
  const backgroundAtRef = useRef<number | null>(null);
  const servicioActivo = useServicioStore((s) => s.servicioActivo);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      // Track when we go to background
      if (nextState === "background") {
        backgroundAtRef.current = Date.now();
      }

      // Only prompt when coming back from REAL background (not just screen off)
      // Require at least 30 seconds in background to avoid spam
      if (
        appStateRef.current === "background" &&
        nextState === "active" &&
        disponible
      ) {
        const elapsed = backgroundAtRef.current
          ? Date.now() - backgroundAtRef.current
          : 0;
        if (elapsed >= 30_000) {
          // If there's an active service, don't ask to deactivate
          if (servicioActivo) {
            // silently continue — can't deactivate during a service
          } else {
            Alert.alert(
              "¿Sigues disponible?",
              "Estuviste fuera de la app. ¿Deseas seguir recibiendo solicitudes?",
              [
                {
                  text: "Desactivar",
                  style: "destructive",
                  onPress: () => {
                    updateDisponibilidad(false)
                      .then(() => updateUser({ disponible: false }))
                      .catch(() => {});
                  },
                },
                { text: "Sí, continuar", style: "default" },
              ],
            );
          }
        }
        backgroundAtRef.current = null;
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [disponible, updateUser, servicioActivo]);

  useSocketSolicitudes({
    enabled: estadoInicialListo && disponible,
    onNuevaSolicitud: (data) => {
      console.log("[socket] Nueva solicitud recibida →", data);
      void logRealtimeEvento({
        canal: "WS",
        evento: "server:nueva_solicitud",
        idSolicitud: data.id_solicitud,
      });
      setSolicitudActiva(data);
    },
    onSolicitudCancelada: ({ id_solicitud }) => {
      console.log("[socket] Solicitud cancelada →", id_solicitud);
      if (solicitudActiva?.id_solicitud === id_solicitud) {
        setSolicitudActiva(null);
      }
    },
  });

  // ── Socket: resultado de cotizaciones enviadas ────────────────
  useSocketCotizaciones({
    onCotizacionAceptada: (data) => {
      console.log("[socket] ✅ Cotización aceptada →", data);

      const payload = normalizeCotizacionAceptada(data);
      if (!payload) {
        showError("No se pudo procesar la cotización aceptada");
        return;
      }

      if (payload.destinoLogico === "AGENDA") {
        showSuccess("¡Cotización aceptada! Servicio agendado.");
        try {
          router.push("/(technician)/schedule");
          void logRealtimeNavegacion({
            canal: "WS",
            evento: "server:cotizacion_aceptada",
            pantallaDestino: "/(technician)/schedule",
            resultado: "ok",
            idSolicitud: payload.idSolicitud,
            idTecnico: payload.idTecnico,
          });
        } catch (err: any) {
          void logRealtimeNavegacion({
            canal: "WS",
            evento: "server:cotizacion_aceptada",
            pantallaDestino: "/(technician)/schedule",
            resultado: "error",
            idSolicitud: payload.idSolicitud,
            idTecnico: payload.idTecnico,
            error: err?.message ?? "navigation_error",
          });
        }
        return;
      }

      getSolicitudDetalle(payload.idSolicitud)
        .then((solicitud) => {
          console.log("[layout] Solicitud detalle:", JSON.stringify(solicitud));

          // ── INMEDIATA: ir al mapa de servicio activo ──────────
          const coords = extraerCoordenadas(solicitud);

          if (!coords) {
            console.warn(
              "[layout] ⚠️ No se pudieron extraer coordenadas del cliente",
            );
            showError("No se pudo obtener la ubicación del servicio");
            return;
          }

          showSuccess("¡Cotización aceptada! Dirígete al cliente.");

          setServicioActivo({
            id_servicio: payload.idServicio ?? 0,
            id_solicitud: payload.idSolicitud,
            id_tecnico: payload.idTecnico ?? 0,
            id_estado: solicitud.id_estado,
            valor_total: 0,
            valor_cotizacion: 0,
            cliente_lat: coords.lat,
            cliente_lon: coords.lon,
          });

          router.push({
            pathname: "/(flows)/servicio-activo",
            params: {
              idSolicitud: String(payload.idSolicitud),
              ...(payload.idServicio === null
                ? {}
                : { idServicio: String(payload.idServicio) }),
            },
          });
          void logRealtimeNavegacion({
            canal: "WS",
            evento: "server:cotizacion_aceptada",
            pantallaDestino: "/(flows)/servicio-activo",
            resultado: "ok",
            idSolicitud: payload.idSolicitud,
            idTecnico: payload.idTecnico,
          });
        })
        .catch((err) => {
          console.warn("[layout] Error al obtener solicitud:", err);
          showError("No se pudo cargar los datos del servicio");
        });
    },
    onCotizacionRechazada: (data) => {
      console.log("[socket] ❌ Cotización rechazada →", data);
      showError("Tu cotización fue rechazada. Vuelves a estar disponible.");
      // Reactivar disponibilidad — el técnico ya no está esperando respuesta
      updateDisponibilidad(true)
        .then(() => updateUser({ disponible: true }))
        .catch(() => updateUser({ disponible: true }));
    },
  });

  const handleVerDetalles = () => {
    if (!solicitudActiva) return;
    const id = solicitudActiva.id_solicitud;
    setSolicitudActiva(null);
    try {
      router.push({
        pathname: "/(flows)/tecnico-solicitud",
        params: { id: String(id) },
      });
      void logRealtimeNavegacion({
        canal: "WS",
        evento: "server:nueva_solicitud",
        pantallaDestino: "/(flows)/tecnico-solicitud",
        resultado: "ok",
        idSolicitud: id,
      });
    } catch (err: any) {
      void logRealtimeNavegacion({
        canal: "WS",
        evento: "server:nueva_solicitud",
        pantallaDestino: "/(flows)/tecnico-solicitud",
        resultado: "error",
        idSolicitud: id,
        error: err?.message ?? "navigation_error",
      });
    }
  };

  const handleRechazar = () => {
    console.log("[solicitud] Rechazada →", solicitudActiva?.id_solicitud);
    setSolicitudActiva(null);
  };

  return (
    <>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: TAB_BG,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitle: () => <HeaderTitle />,
          headerRight: () => <NotificationBell />,
          headerLeft:
            route.name !== "home"
              ? () => (
                  <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ marginLeft: 12 }}
                  >
                    <Ionicons name="chevron-back" size={26} color="#fff" />
                  </TouchableOpacity>
                )
              : undefined,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: TAB_BG,
            borderTopWidth: 0,
            height: 80,
            paddingBottom: 30,
            paddingTop: 8,
          },
          tabBarActiveTintColor: ACTIVE,
          tabBarInactiveTintColor: INACTIVE,
        })}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="home" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="calendar" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="settings-sharp" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="person" size={24} color={color} />
            ),
          }}
        />
      </Tabs>

      <SolicitudDisponibleModal
        visible={!!solicitudActiva}
        solicitud={solicitudActiva}
        onVerDetalles={handleVerDetalles}
        onRechazar={handleRechazar}
      />
    </>
  );
}
