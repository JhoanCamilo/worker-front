import { useAuthStore } from "@/src/store/auth.store";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TechnicianHomeScreen() {
  const user = useAuthStore((state) => state.user);
  const [active, setActive] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          <Text style={styles.headerGreeting}>Bienvenido, </Text>
          <Text style={styles.headerName}>{user?.name ?? "Técnico"}</Text>
        </Text>
      </View>

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
        <TouchableOpacity
          style={[
            styles.statusButton,
            { backgroundColor: active ? "#14c681" : "#9ca3af" },
          ]}
          onPress={() => setActive((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Text style={styles.statusText}>
            {active ? "Estado: Activo" : "Estado: Inactivo"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#0a7ea4",
  },
  headerText: {
    fontSize: 18,
  },
  headerGreeting: {
    fontSize: 25,
    color: "#0a7ea4",
  },
  headerName: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#11181C",
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
