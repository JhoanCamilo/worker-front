import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import * as NavigationBar from "expo-navigation-bar";
import { Slot } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

export default function RootLayout() {
  useAuthGuard();
  usePushNotifications();

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("inset-swipe");
    }

    // Solicitar todos los permisos necesarios al iniciar (instalación/primer inicio)
    // Esto centraliza la solicitud y evita pedir permisos en momentos críticos del flujo.
    const requestInitialPermissions = async () => {
      try {
        // 1. Ubicación (Foreground)
        const { status: locStatus } = await Location.getForegroundPermissionsAsync();
        if (locStatus !== "granted") {
          await Location.requestForegroundPermissionsAsync();
        }

        // 2. Notificaciones Push
        const { status: pushStatus } = await Notifications.getPermissionsAsync();
        if (pushStatus !== "granted") {
          await Notifications.requestPermissionsAsync();
        }
      } catch (err) {
        console.warn("[Layout] Error al solicitar permisos iniciales:", err);
      }
    };

    void requestInitialPermissions();
  }, []);

  return <Slot />;
}
