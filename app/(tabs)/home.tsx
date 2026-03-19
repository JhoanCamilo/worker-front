import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ClientHomeScreen() {
  return (
    <View style={styles.container}>
      {/* Botones */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.helpButton} activeOpacity={0.8}>
          <Text style={styles.helpText}>
            ¿Cómo podemos ayudarte el día de hoy?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.scheduleButton} activeOpacity={0.8}>
          <Ionicons name="calendar" size={20} color="#000" />
          <Text style={styles.scheduleText}>Agendar Servicio</Text>
        </TouchableOpacity>
      </View>

      {/* Body con logo de fondo */}
      <View style={styles.body}>
        <Image
          source={require("@/assets/images/favicon.png")}
          style={styles.bgLogo}
          resizeMode="contain"
        />
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
    position: "absolute",
    width: 220,
    height: 220,
    opacity: 0.15,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  helpButton: {
    backgroundColor: "#407ee3",
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  helpText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  scheduleButton: {
    backgroundColor: "#f2c70f",
    borderRadius: 10,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  scheduleText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "600",
  },
});
