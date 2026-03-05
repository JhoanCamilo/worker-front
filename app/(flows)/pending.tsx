import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PendingScreen() {
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Favicon como fondo absoluto */}
      <Image
        source={require("@/assets/images/favicon.png")}
        style={styles.bgLogo}
        resizeMode="contain"
      />

      {/* Contenido sobre el fondo */}
      <Text style={styles.title}>Cuenta en revisión</Text>

      <Text style={styles.message}>
        Su perfil está siendo validado administrativamente, se le notificará el
        cambio de su estado.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
  },
  bgLogo: {
    position: "absolute",
    width: 280,
    height: 280,
    opacity: 0.1,
    alignSelf: "center",
    top: "35%",
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 30,
    textAlign: "center",
    color: "#3061b2",
  },
  message: {
    textAlign: "center",
    fontSize: 15,
    color: "#374151",
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
