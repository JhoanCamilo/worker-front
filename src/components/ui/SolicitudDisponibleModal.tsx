import { NuevaSolicitudPayload } from "@/src/types/socket.types";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  solicitud: NuevaSolicitudPayload | null;
  onVerDetalles: () => void;
  onRechazar: () => void;
}

export function SolicitudDisponibleModal({
  visible,
  solicitud,
  onVerDetalles,
  onRechazar,
}: Props) {
  if (!solicitud) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Solicitud de servicio disponible</Text>

          <TouchableOpacity style={styles.verBtn} onPress={onVerDetalles} activeOpacity={0.8}>
            <Text style={styles.verText}>Ver detalles</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rechazarBtn} onPress={onRechazar} activeOpacity={0.8}>
            <Text style={styles.rechazarText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  verBtn: {
    backgroundColor: "#407ee3",
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: "center",
  },
  verText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  rechazarBtn: {
    borderWidth: 1.5,
    borderColor: "#cc2d2d",
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: "center",
  },
  rechazarText: {
    color: "#cc2d2d",
    fontSize: 18,
    fontWeight: "600",
  },
});
