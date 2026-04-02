import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useServicioStore } from "@/src/store/servicio.store";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ClientHomeScreen() {
  const router = useRouter();
  const servicioActivo = useServicioStore((s) => s.servicioActivo);

  return (
    <View style={styles.container}>
      {/* Botones */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.helpButton}
          activeOpacity={0.8}
          onPress={() => router.push({ pathname: "/service-category", params: { modo: "INMEDIATA" } })}
        >
          <Text style={styles.helpText}>Necesito ayuda ahora</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.scheduleButton}
          activeOpacity={0.8}
          onPress={() => router.push({ pathname: "/service-category", params: { modo: "PROGRAMADA" } })}
        >
          <Ionicons name="calendar" size={20} color="#000" />
          <Text style={styles.scheduleText}>Agendar servicio</Text>
        </TouchableOpacity>
      </View>

      {/* Return to active service banner */}
      {servicioActivo && (
        <TouchableOpacity
          style={styles.activeServiceBanner}
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: "/(flows)/tracking-cliente",
              params: {
                idSolicitud: String(servicioActivo.id_solicitud),
                idServicio: String(servicioActivo.id_servicio),
              },
            })
          }
        >
          <Ionicons name="map" size={24} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.activeServiceTitle}>Servicio en progreso</Text>
            <Text style={styles.activeServiceText}>Toca aquí para volver al mapa</Text>
          </View>
        </TouchableOpacity>
      )}

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
  activeServiceBanner: {
    backgroundColor: "#10b981",
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeServiceTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  activeServiceText: {
    color: "#fff",
    fontSize: 13,
    marginTop: 2,
  },
});
