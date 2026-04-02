import { Ionicons } from "@expo/vector-icons";
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

function formatFecha(iso: string): string {
  const d = new Date(iso);
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const hora = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  const ampm = hora >= 12 ? "PM" : "AM";
  const hora12 = hora % 12 || 12;
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]} - ${hora12}:${min} ${ampm}`;
}

export function SolicitudDisponibleModal({
  visible,
  solicitud,
  onVerDetalles,
  onRechazar,
}: Props) {
  if (!solicitud) return null;

  const esProgramada = solicitud.tipo_solicitud === "PROGRAMADA";
  const distKm = (solicitud.distancia_metros / 1000).toFixed(1);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {esProgramada ? "Servicio programado disponible" : "Solicitud de servicio disponible"}
          </Text>

          {/* Categoría y distancia (dirección oculta hasta aceptar cotización) */}
          <Text style={styles.category}>
            {typeof solicitud.subcategoria === 'string' 
              ? solicitud.subcategoria 
              : (solicitud.subcategoria as any)?.nombre || "Servicio"}
          </Text>
          <Text style={styles.distance}>A {distKm} km de tu ubicación</Text>

          {/* Banner programado */}
          {esProgramada && (
            <View style={styles.scheduleBanner}>
              <Ionicons name="calendar" size={18} color="#f59e0b" />
              <View style={{ flex: 1 }}>
                {solicitud.fecha_programada && (
                  <Text style={styles.scheduleDate}>
                    {formatFecha(solicitud.fecha_programada)}
                  </Text>
                )}
                <Text style={styles.scheduleWarn}>
                  Si aceptas, te comprometes a atender ese día y hora
                </Text>
              </View>
            </View>
          )}

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
    marginBottom: 4,
  },
  category: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  distance: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 8,
  },
  scheduleBanner: {
    flexDirection: "row",
    backgroundColor: "#fffbeb",
    borderWidth: 1.5,
    borderColor: "#f59e0b",
    borderRadius: 8,
    padding: 12,
    gap: 10,
    alignItems: "flex-start",
  },
  scheduleDate: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  scheduleWarn: {
    fontSize: 11,
    color: "#92400e",
    marginTop: 2,
    lineHeight: 15,
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
