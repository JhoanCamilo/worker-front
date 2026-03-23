import { getSolicitudDetalle, SolicitudDetalle } from "@/src/services/solicitud.service";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function TecnicoSolicitudScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [solicitud, setSolicitud] = useState<SolicitudDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [cotizacionVisible, setCotizacionVisible] = useState(false);
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (!id) return;
    getSolicitudDetalle(Number(id))
      .then(setSolicitud)
      .finally(() => setLoading(false));
  }, [id]);

  const handleRechazar = () => {
    router.replace("/(technician)/home");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#407ee3" />
      </View>
    );
  }

  if (!solicitud) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No se pudo cargar la solicitud.</Text>
      </View>
    );
  }

  const categoria = solicitud.subcategoria.Categorium.nombre;
  const subcategoria = solicitud.subcategoria.nombre;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles de la solicitud</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Título */}
        <Text style={styles.pageTitle}>Detalles de la solicitud</Text>

        {/* Subtítulo categoría - subcategoría */}
        <Text style={styles.subtitle}>{categoria} - {subcategoria}</Text>

        {/* Campos de solo lectura */}
        <InfoField label="Descripción" value={solicitud.descripcion} />
        <InfoField label="Tipo de servicio" value={solicitud.tipo_servicio} />
        <InfoField label="Prioridad" value={solicitud.prioridad} />
      </ScrollView>

      {/* Botones fijos */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cotizarBtn}
          onPress={() => setCotizacionVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.cotizarText}>Enviar cotización</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rechazarBtn}
          onPress={handleRechazar}
          activeOpacity={0.8}
        >
          <Text style={styles.rechazarText}>Rechazar</Text>
        </TouchableOpacity>
      </View>

      {/* Modal cotización */}
      <Modal visible={cotizacionVisible} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setCotizacionVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Envíe su cotización al cliente</Text>

            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Valor cotización</Text>
              <TextInput
                value={valor}
                onChangeText={setValor}
                keyboardType="decimal-pad"
                placeholder="Ej: 80000"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>

            <TouchableOpacity style={styles.enviarBtn} activeOpacity={0.8}>
              <Text style={styles.enviarText}>Enviar</Text>
              <FontAwesome6 name="file-invoice-dollar" size={16} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelarBtn}
              onPress={() => setCotizacionVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoField}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: "#6b7280", fontSize: 15 },

  // Header
  header: {
    backgroundColor: "#407ee3",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    justifyContent: "space-between",
  },
  backBtn: { width: 36, alignItems: "flex-start" },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },

  // Contenido
  scroll: { padding: 24, paddingBottom: 40 },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#3061b2",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#5e5e5e",
    textAlign: "center",
    marginBottom: 24,
  },
  infoField: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 12,
  },
  infoLabel: { fontSize: 12, color: "#9ca3af", marginBottom: 4 },
  infoValue: { fontSize: 15, color: "#111827" },

  // Botones fijos
  footer: {
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cotizarBtn: {
    backgroundColor: "#407ee3",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  cotizarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  rechazarBtn: {
    borderWidth: 1.5,
    borderColor: "#cc2d2d",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  rechazarText: { color: "#cc2d2d", fontSize: 16, fontWeight: "600" },

  // Modal cotización
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    fontSize: 25,
    fontWeight: "700",
    color: "#3061b2",
    textAlign: "center",
    marginBottom: 8,
  },
  fieldWrapper: { gap: 6 },
  inputLabel: { fontSize: 14, color: "#5e5e5e" },
  input: {
    borderWidth: 1,
    borderColor: "#407ee3",
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: "#111827",
  },
  enviarBtn: {
    backgroundColor: "#407ee3",
    borderRadius: 10,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  enviarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancelarBtn: {
    borderWidth: 1.5,
    borderColor: "#cc2d2d",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelarText: { color: "#cc2d2d", fontSize: 15, fontWeight: "600" },
});
