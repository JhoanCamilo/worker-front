import { useSocketServicios } from "@/src/hooks/useSocketServicios";
import { useToast } from "@/src/hooks/useToast";
import { useNotificacionStore } from "@/src/store/notificacion.store";
import { useAuthStore } from "@/src/store/auth.store";
import { useServicioStore } from "@/src/store/servicio.store";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";

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
  const navigatingToCalificar = useServicioStore((s) => s.navigatingToCalificar);

  const [completionModal, setCompletionModal] = useState<{
    visible: boolean;
    idServicio: number;
    valorTotal: number;
  }>({ visible: false, idServicio: 0, valorTotal: 0 });

  // ── Socket: recibir eventos del servicio (finalización, etc.) ──
  // Si el cliente ya está siendo dirigido desde tracking-cliente, omitir el modal
  useSocketServicios({
    onServicioFinalizado: (data) => {
      console.log("[client/layout] Servicio finalizado →", data);
      if (navigatingToCalificar) return;
      setCompletionModal({
        visible: true,
        idServicio: data.id_servicio,
        valorTotal: data.valor_total || (data as any).datos?.valor_total || 0,
      });
    },
  });

  const handleGoToCalificar = () => {
    const { idServicio, valorTotal } = completionModal;
    setCompletionModal({ ...completionModal, visible: false });
    router.push({
      pathname: "/(flows)/calificar",
      params: {
        idServicio: String(idServicio),
        valorTotal: String(valorTotal),
      },
    });
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

      {/* ── Modal de Finalización de Servicio ── */}
      <Modal
        visible={completionModal.visible}
        transparent
        animationType="fade"
      >
        <View style={layoutStyles.modalOverlay}>
          <View style={layoutStyles.modalContainer}>
            <View style={layoutStyles.iconCircle}>
              <Ionicons name="checkmark-done-circle" size={50} color="#10b981" />
            </View>
            <Text style={layoutStyles.modalTitle}>¡Servicio Finalizado!</Text>
            <Text style={layoutStyles.modalText}>
              El técnico ha marcado el servicio como completado. Por favor confirma el pago y califica tu experiencia.
            </Text>
            
            <TouchableOpacity 
              style={layoutStyles.confirmBtn}
              onPress={handleGoToCalificar}
            >
              <Text style={layoutStyles.confirmBtnText}>Ver detalles y calificar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const layoutStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  modalText: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmBtn: {
    backgroundColor: "#407ee3",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
