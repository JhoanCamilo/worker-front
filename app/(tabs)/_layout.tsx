import { useSocketServicios } from "@/src/hooks/useSocketServicios";
import { useToast } from "@/src/hooks/useToast";
import { useNotificacionStore } from "@/src/store/notificacion.store";
import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

const TAB_BG = "#407ee3";
const ACTIVE = "#f2c70f";
const INACTIVE = "rgba(0,0,0,0.5)";

function HeaderTitle() {
  const user = useAuthStore((state) => state.user);
  return (
    <Text>
      <Text style={{ color: "#fff", fontSize: 18 }}>Bienvenido, </Text>
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
        {user?.name ?? "Usuario"}
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

export default function TabsLayout() {
  const router = useRouter();
  const { success: showSuccess } = useToast();

  // ── Socket: recibir eventos del servicio (finalización, etc.) ──
  useSocketServicios({
    onServicioFinalizado: (data) => {
      console.log("[client/layout] Servicio finalizado →", data);
      showSuccess("¡El servicio ha finalizado! Califica al técnico.");
      router.push({
        pathname: "/(flows)/calificar",
        params: {
          idServicio: String(data.id_servicio),
          valorTotal: String(data.valor_total ?? 0),
        },
      });
    },
  });

  return (
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
  );
}
