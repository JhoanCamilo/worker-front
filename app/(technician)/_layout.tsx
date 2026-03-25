import { SolicitudDisponibleModal } from "@/src/components/ui/SolicitudDisponibleModal";
import { useSocketSolicitudes } from "@/src/hooks/useSocketSolicitudes";
import { useAuthStore } from "@/src/store/auth.store";
import { NuevaSolicitudPayload } from "@/src/types/socket.types";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity } from "react-native";

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

export default function TechnicianLayout() {
  const router = useRouter();

  const disponible = useAuthStore((s) => s.user?.disponible ?? false);
  const [solicitudActiva, setSolicitudActiva] = useState<NuevaSolicitudPayload | null>(null);

  useSocketSolicitudes({
    enabled: disponible,
    onNuevaSolicitud: (data) => {
      console.log("[socket] Nueva solicitud recibida →", data);
      setSolicitudActiva(data);
    },
    onSolicitudCancelada: ({ id_solicitud }) => {
      console.log("[socket] Solicitud cancelada →", id_solicitud);
      // Cerrar el modal si la solicitud activa fue cancelada
      if (solicitudActiva?.id_solicitud === id_solicitud) {
        setSolicitudActiva(null);
      }
    },
  });

  const handleVerDetalles = () => {
    if (!solicitudActiva) return;
    const id = solicitudActiva.id_solicitud;
    setSolicitudActiva(null);
    router.push({ pathname: "/tecnico-solicitud", params: { id: String(id) } });
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
