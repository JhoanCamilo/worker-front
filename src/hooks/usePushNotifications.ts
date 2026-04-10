import { useToast } from "@/src/hooks/useToast";
import {
    getNotificaciones,
    registrarPushToken,
} from "@/src/services/notificacion.service";
import {
    logRealtimeEvento,
    logRealtimeNavegacion,
} from "@/src/services/realtime-log.service";
import { useAuthStore } from "@/src/store/auth.store";
import { useNotificacionStore } from "@/src/store/notificacion.store";
import { normalizeCotizacionAceptada } from "@/src/utils/cotizacionAceptada";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

// Configure how notifications are shown when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers for push notifications, sends the token to the backend,
 * and sets up foreground + tap listeners.
 * Call this ONCE in the root layout after the user is authenticated.
 */
export function usePushNotifications() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const registered = useRef(false);
  const { success: showSuccess, info: showInfo } = useToast();

  const navigateWithLog = (
    evento: string,
    pantallaDestino: string,
    action: () => void,
    idSolicitud?: unknown,
    idTecnico?: unknown,
  ) => {
    try {
      action();
      void logRealtimeNavegacion({
        canal: "PUSH",
        evento,
        pantallaDestino,
        resultado: "ok",
        idSolicitud,
        idTecnico,
      });
    } catch (err: any) {
      void logRealtimeNavegacion({
        canal: "PUSH",
        evento,
        pantallaDestino,
        resultado: "error",
        idSolicitud,
        idTecnico,
        error: err?.message ?? "navigation_error",
      });
    }
  };

  const toScalarId = (value: unknown): string | null => {
    if (typeof value === "number" && Number.isFinite(value))
      return String(value);
    if (typeof value === "string" && value.trim().length > 0) return value;
    return null;
  };

  // Register push token when user is authenticated
  useEffect(() => {
    if (!token || registered.current) return;

    (async () => {
      try {
        // Physical device check
        if (!Device.isDevice) {
          console.log("[push] Skipping — not a physical device");
          return;
        }

        // Get current notification permissions
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted") {
          console.log("[push] Permission not granted, skipping registration");
          return;
        }

        // Android notification channel
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#407ee3",
          });
        }

        // Get token and register with backend
        const pushToken = await Notifications.getExpoPushTokenAsync({
          projectId: "2a0af14e-160b-42ec-88ae-8455a1f33d4f",
        });

        console.log("[push] Token:", pushToken.data);
        await registrarPushToken(pushToken.data);
        registered.current = true;
        console.log("[push] Token registered with backend");
      } catch (err) {
        console.error("[push] Setup error:", err);
      }
    })();
  }, [token]);

  // Fetch unread count on login
  const setNoLeidas = useNotificacionStore((s) => s.setNoLeidas);
  const incrementNoLeidas = useNotificacionStore((s) => s.incrementNoLeidas);
  useEffect(() => {
    if (!token) return;
    getNotificaciones(1, 1)
      .then((res) => setNoLeidas(res?.no_leidas ?? 0))
      .catch(() => {});
  }, [token, setNoLeidas]);

  // Listen for notifications received while app is in foreground
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data;
        const tipo = data?.tipo as string | undefined;
        console.log("[push] Notification received in foreground:", tipo);
        void logRealtimeEvento({
          canal: "PUSH",
          evento: tipo ?? "UNKNOWN",
          idSolicitud:
            (data as any)?.id_solicitud ?? (data as any)?.datos?.id_solicitud,
          idTecnico:
            (data as any)?.id_tecnico ?? (data as any)?.datos?.id_tecnico,
        });
        incrementNoLeidas();

        if (tipo === "COTIZACION_RECIBIDA" || tipo === "COTIZACIONES_LISTAS") {
          showInfo("Tienes nuevas cotizaciones disponibles");
        } else if (tipo === "SERVICIO_COMPLETADO") {
          showSuccess("¡Tu servicio ha finalizado!");
        } else if (tipo === "SERVICIO_INICIADO") {
          showInfo("El técnico ha iniciado el servicio");
        }
      },
    );

    return () => subscription.remove();
  }, [incrementNoLeidas, showInfo, showSuccess]);

  // Listen for notification taps (when user taps a notification)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log("[push] Notification tapped:", data);
        void logRealtimeEvento({
          canal: "PUSH",
          evento: String((data as any)?.tipo ?? "UNKNOWN"),
          idSolicitud:
            (data as any)?.id_solicitud ?? (data as any)?.datos?.id_solicitud,
          idTecnico:
            (data as any)?.id_tecnico ?? (data as any)?.datos?.id_tecnico,
          detalles: { accion: "tap" },
        });

        // Navigate based on notification type
        if (data?.tipo) {
          handleNotificationNavigation(data as Record<string, unknown>);
        }
      },
    );

    return () => subscription.remove();
  }, []);

  const handleNotificationNavigation = (data: Record<string, unknown>) => {
    const tipo = data.tipo as string;
    // Backend envía los IDs dentro de data.datos (nested) — extraer de ambos niveles
    const datos = (data.datos ?? {}) as Record<string, unknown>;

    switch (tipo) {
      case "NUEVA_SOLICITUD": {
        const idSolicitud = toScalarId(data.id_solicitud ?? datos.id_solicitud);
        if (idSolicitud) {
          navigateWithLog(
            tipo,
            "/(flows)/tecnico-solicitud",
            () => {
              router.push({
                pathname: "/(flows)/tecnico-solicitud",
                params: { id: idSolicitud },
              });
            },
            idSolicitud,
            data.id_tecnico ?? datos.id_tecnico,
          );
        }
        break;
      }
      case "COTIZACION_RECIBIDA":
      case "COTIZACIONES_LISTAS": {
        const idSolicitud = toScalarId(data.id_solicitud ?? datos.id_solicitud);
        if (idSolicitud) {
          navigateWithLog(
            tipo,
            "/(flows)/cotizaciones",
            () => {
              router.push({
                pathname: "/(flows)/cotizaciones",
                params: { idSolicitud },
              });
            },
            idSolicitud,
          );
        }
        break;
      }
      case "SERVICIO_COMPLETADO": {
        const idServicio = toScalarId(data.id_servicio ?? datos.id_servicio);
        const idSolicitud = toScalarId(data.id_solicitud ?? datos.id_solicitud);
        if (idServicio) {
          navigateWithLog(
            tipo,
            "/(flows)/calificar",
            () => {
              router.push({
                pathname: "/(flows)/calificar",
                params: { idServicio },
              });
            },
            idSolicitud,
          );
        } else if (idSolicitud) {
          // Fallback: push solo trae id_solicitud, navegar a calificar con lo que tengamos
          navigateWithLog(
            tipo,
            "/(flows)/calificar",
            () => {
              router.push({
                pathname: "/(flows)/calificar",
                params: { idServicio: idSolicitud },
              });
            },
            idSolicitud,
          );
        }
        break;
      }
      case "COTIZACION_ACEPTADA": {
        const normalized = normalizeCotizacionAceptada(data);
        if (!normalized) break;

        if (normalized.destinoLogico === "AGENDA") {
          navigateWithLog(
            tipo,
            "/(technician)/schedule",
            () => router.push("/(technician)/schedule" as never),
            normalized.idSolicitud,
            normalized.idTecnico,
          );
          break;
        }

        navigateWithLog(
          tipo,
          "/(flows)/servicio-activo",
          () => {
            router.replace({
              pathname: "/(flows)/servicio-activo",
              params: {
                idSolicitud: String(normalized.idSolicitud),
                idServicio: String(normalized.idServicio ?? 0),
              },
            });
          },
          normalized.idSolicitud,
          normalized.idTecnico,
        );
        break;
      }
      case "SERVICIO_INICIADO": {
        const idSolicitud = toScalarId(data.id_solicitud ?? datos.id_solicitud);
        if (idSolicitud) {
          navigateWithLog(
            tipo,
            "/(flows)/tracking-cliente",
            () => {
              router.push({
                pathname: "/(flows)/tracking-cliente",
                params: { idSolicitud },
              });
            },
            idSolicitud,
          );
        }
        break;
      }
      case "CALIFICACION_RECIBIDA": {
        navigateWithLog(tipo, "/(technician)/profile", () =>
          router.push("/(technician)/profile" as never),
        );
        break;
      }
      default:
        navigateWithLog(tipo, "/(flows)/notificaciones", () =>
          router.push("/(flows)/notificaciones" as never),
        );
        break;
    }
  };
}
