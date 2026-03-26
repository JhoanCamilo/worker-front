import { useToast } from "@/src/hooks/useToast";
import { crearCotizacion } from "@/src/services/cotizacion.service";
import {
    getSolicitudDetalle,
    SolicitudDetalle,
} from "@/src/services/solicitud.service";
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
  const { success, error: showError } = useToast();

  const [solicitud, setSolicitud] = useState<SolicitudDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [cotizacionVisible, setCotizacionVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [valor, setValor] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tiempoEstimado, setTiempoEstimado] = useState("");

  useEffect(() => {
    if (!id) return;
    getSolicitudDetalle(Number(id))
      .then(setSolicitud)
      .finally(() => setLoading(false));
  }, [id]);

  const handleRechazar = () => {
    router.replace("/(technician)/home");
  };

  const handleEnviarCotizacion = async () => {
    if (!id || !valor) {
      showError("Ingresa el valor de la cotización");
      return;
    }

    setSending(true);
    try {
      await crearCotizacion({
        id_solicitud: Number(id),
        valor_cotizacion: Number(valor),
        descripcion: descripcion || "Servicio técnico",
        tiempo_estimado: tiempoEstimado || "Por definir",
      });
      success("Cotización enviada correctamente");
      setCotizacionVisible(false);
      router.replace("/(technician)/home");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "No se pudo enviar la cotización";
      showError(msg);
    } finally {
      setSending(false);
    }
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
  const esProgramada = solicitud.tipo_servicio === "PROGRAMADA";

  const formatFecha = (iso: string): string => {
    const d = new Date(iso);
    const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const meses = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const hora = d.getHours();
    const min = String(d.getMinutes()).padStart(2, "0");
    const ampm = hora >= 12 ? "PM" : "AM";
    const hora12 = hora % 12 || 12;
    return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]} - ${hora12}:${min} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[styles.header, esProgramada && { backgroundColor: "#f59e0b" }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={esProgramada ? "#000" : "#fff"}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, esProgramada && { color: "#000" }]}>
          {esProgramada ? "Servicio programado" : "Detalles de la solicitud"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Banner agendamiento */}
        {esProgramada && (
          <View style={styles.scheduleBanner}>
            <Ionicons name="calendar" size={22} color="#f59e0b" />
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduleBannerTitle}>
                SERVICIO PROGRAMADO
              </Text>
              {solicitud.fecha_programada && (
                <Text style={styles.scheduleBannerDate}>
                  {formatFecha(solicitud.fecha_programada)}
                </Text>
              )}
              <Text style={styles.scheduleBannerWarn}>
                Si aceptas, te comprometes a estar disponible en esa fecha y
                hora
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.pageTitle}>Detalles de la solicitud</Text>
        <Text style={styles.subtitle}>
          {categoria} - {subcategoria}
        </Text>

        <InfoField label="Descripción" value={solicitud.descripcion} />
        <InfoField
          label="Tipo de servicio"
          value={esProgramada ? "Programado (Agendamiento)" : "Inmediato"}
        />
        <InfoField label="Prioridad" value={solicitud.prioridad} />
        {solicitud.direccion_servicio && (
          <InfoField label="Dirección" value={solicitud.direccion_servicio} />
        )}
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
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setCotizacionVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              Envíe su cotización al cliente
            </Text>

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

            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Descripción del trabajo</Text>
              <TextInput
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Describe brevemente el trabajo"
                placeholderTextColor="#9ca3af"
                style={[
                  styles.input,
                  { height: 80, textAlignVertical: "top", paddingTop: 12 },
                ]}
                multiline
              />
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.inputLabel}>Tiempo estimado</Text>
              <TextInput
                value={tiempoEstimado}
                onChangeText={setTiempoEstimado}
                placeholder="Ej: 2 horas"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              style={[styles.enviarBtn, sending && { opacity: 0.6 }]}
              activeOpacity={0.8}
              onPress={handleEnviarCotizacion}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.enviarText}>Enviar</Text>
                  <FontAwesome6
                    name="file-invoice-dollar"
                    size={16}
                    color="#fff"
                  />
                </>
              )}
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

function InfoField({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
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

  scroll: { padding: 24, paddingBottom: 40 },
  scheduleBanner: {
    flexDirection: "row",
    backgroundColor: "#fffbeb",
    borderWidth: 1.5,
    borderColor: "#f59e0b",
    borderRadius: 10,
    padding: 14,
    gap: 12,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  scheduleBannerTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#b45309",
    letterSpacing: 0.5,
  },
  scheduleBannerDate: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginTop: 2,
  },
  scheduleBannerWarn: {
    fontSize: 12,
    color: "#92400e",
    marginTop: 4,
    lineHeight: 16,
  },
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
