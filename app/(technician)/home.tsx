import { updateDisponibilidad } from "@/src/services/technician.service";
import { useToast } from "@/src/hooks/useToast";
import { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TechnicianHomeScreen() {
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const { error } = useToast();

  const handleToggle = async () => {
    const next = !active;
    setLoading(true);
    try {
      await updateDisponibilidad(next);
      setActive(next);
    } catch {
      error("No se pudo actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
          onPress={handleToggle}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.statusText}>
              {active ? "Estado: Activo" : "Estado: Inactivo"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
