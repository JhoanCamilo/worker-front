import { crearCalificacion } from "@/src/services/calificacion.service";
import { confirmarPagoServicio, getServicioDetalle } from "@/src/services/servicio.service";
import { useServicioStore } from "@/src/store/servicio.store";
import { useToast } from "@/src/hooks/useToast";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Screen = "payment" | "rating";

export default function CalificarScreen() {
  const { idServicio, valorTotal } = useLocalSearchParams<{
    idServicio: string;
    valorTotal?: string;
  }>();
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToast();
  const clearServicioActivo = useServicioStore((s) => s.clearServicioActivo);
  const setNavigatingToCalificar = useServicioStore((s) => s.setNavigatingToCalificar);

  // Forzamos "payment" si existe idServicio, para que el cliente vea el resumen antes
  const [screen, setScreen] = useState<Screen>(idServicio ? "payment" : "rating");
  const [valorTotalNum, setValorTotalNum] = useState<number | null>(
    valorTotal ? Number(valorTotal) : null
  );
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Resetear el flag de navegación al montar esta pantalla
  useEffect(() => {
    setNavigatingToCalificar(false);
  }, []);

  // ── Cargar precio si no vino en los parámetros ──────────────
  useEffect(() => {
    if (idServicio && valorTotalNum === null) {
      setLoadingPrice(true);
      getServicioDetalle(Number(idServicio))
        .then((s) => setValorTotalNum(s.valor_total ?? 0))
        .catch(() => setValorTotalNum(0))
        .finally(() => setLoadingPrice(false));
    }
  }, [idServicio]);

  // Solo saltar pago si valor es estrictamente 0 o nulo Y no estamos en flujo de cierre
  const skipPayment = valorTotalNum !== null && valorTotalNum <= 0;

  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitRating = async () => {
    if (puntuacion === 0) {
      showError("Selecciona una calificación");
      return;
    }

    setSubmitting(true);
    try {
      await crearCalificacion({
        id_servicio: Number(idServicio),
        puntuacion,
        comentario: comentario.trim() || undefined,
      });
      showSuccess("¡Gracias por tu calificación!");
      clearServicioActivo();
      router.replace({ pathname: "/(tabs)/schedule", params: { modo: "garantias" } });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "No se pudo enviar la calificación";
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPay = async () => {
    try {
      await confirmarPagoServicio(Number(idServicio));
      setScreen("rating");
    } catch {
      showError("Error al notificar confirmación de pago. Intenta de nuevo.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={{ width: 36 }} />
        <Text style={styles.headerTitle}>
          {screen === "payment" ? "Confirmar pago" : "Calificar"}
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (!skipPayment && screen === "rating") {
              setScreen("payment");
            }
          }}
          style={{ width: 36, alignItems: "flex-end" }}
        >
          {!skipPayment && screen === "rating" && (
            <Ionicons name="chevron-back" size={24} color="#407ee3" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPadding}
      >
        {screen === "payment" ? (
          loadingPrice ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#407ee3" />
              <Text style={styles.loadingText}>Cargando información de pago...</Text>
            </View>
          ) : (
            <PaymentConfirmScreen
              valorTotal={valorTotalNum || 0}
              onConfirm={handleConfirmPay}
              onSkip={() => setScreen("rating")}
            />
          )
        ) : (
          <RatingScreen
            puntuacion={puntuacion}
            setPuntuacion={setPuntuacion}
            comentario={comentario}
            setComentario={setComentario}
            submitting={submitting}
            onSubmit={handleSubmitRating}
            onSkip={() => { clearServicioActivo(); router.replace({ pathname: "/(tabs)/schedule", params: { modo: "garantias" } }); }}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface PaymentConfirmScreenProps {
  valorTotal: number;
  onConfirm: () => void;
  onSkip: () => void;
}

function PaymentConfirmScreen({
  valorTotal,
  onConfirm,
  onSkip,
}: PaymentConfirmScreenProps) {
  return (
    <>
      <Text style={styles.title}>Confirmar pago</Text>
      <Text style={styles.subtitle}>
        El técnico registró el siguiente cobro por el servicio:
      </Text>

      <View style={styles.cotizacionBox}>
        <Text style={styles.cotizacionLabel}>Monto del servicio</Text>
        <Text style={styles.cotizacionValue}>
          ${valorTotal.toLocaleString("es-CO")}
        </Text>
      </View>

      <View style={styles.warrantyBox}>
        <Ionicons name="shield-checkmark" size={20} color="#16a34a" />
        <View style={{ flex: 1 }}>
          <Text style={styles.warrantyTitle}>Garantía incluida</Text>
          <Text style={styles.warrantyDesc}>
            Este servicio incluye 30 días de garantía a partir de la fecha de finalización.
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.continueBtn} onPress={onConfirm}>
        <Text style={styles.continueBtnText}>Confirmar y calificar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
        <Text style={styles.skipText}>Omitir</Text>
      </TouchableOpacity>
    </>
  );
}

interface RatingScreenProps {
  puntuacion: number;
  setPuntuacion: (v: number) => void;
  comentario: string;
  setComentario: (v: string) => void;
  submitting: boolean;
  onSubmit: () => void;
  onSkip: () => void;
}

function RatingScreen({
  puntuacion,
  setPuntuacion,
  comentario,
  setComentario,
  submitting,
  onSubmit,
  onSkip,
}: RatingScreenProps) {
  return (
    <>
      <Text style={styles.title}>¿Cómo fue tu experiencia?</Text>
      <Text style={styles.subtitle}>Tu opinión nos ayuda a mejorar</Text>

      {/* Stars */}
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setPuntuacion(star)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={star <= puntuacion ? "star" : "star-outline"}
              size={44}
              color="#f2c70f"
            />
          </TouchableOpacity>
        ))}
      </View>

      {puntuacion > 0 && (
        <Text style={styles.ratingLabel}>{getRatingLabel(puntuacion)}</Text>
      )}

      {/* Comment */}
      <TextInput
        style={styles.input}
        placeholder="Comentario opcional..."
        placeholderTextColor="#4b5563"
        value={comentario}
        onChangeText={setComentario}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, puntuacion === 0 && { opacity: 0.5 }]}
        activeOpacity={0.8}
        onPress={onSubmit}
        disabled={submitting || puntuacion === 0}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Enviar calificación</Text>
        )}
      </TouchableOpacity>

      {/* Skip */}
      <TouchableOpacity
        style={styles.skipBtn}
        activeOpacity={0.7}
        onPress={onSkip}
      >
        <Text style={styles.skipText}>Omitir</Text>
      </TouchableOpacity>
    </>
  );
}

function getRatingLabel(rating: number): string {
  switch (rating) {
    case 1:
      return "Muy malo";
    case 2:
      return "Malo";
    case 3:
      return "Regular";
    case 4:
      return "Bueno";
    case 5:
      return "Excelente";
    default:
      return "";
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTitle: { color: "#407ee3", fontSize: 17, fontWeight: "700" },

  content: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },

  title: { fontSize: 22, fontWeight: "700", color: "#1f2937" },
  subtitle: { fontSize: 14, color: "#6b7280", textAlign: "left", marginTop: 8 },

  // ── Payment Screen Styles ──
  cotizacionBox: {
    backgroundColor: "#f0f9ff",
    borderLeftWidth: 4,
    borderLeftColor: "#407ee3",
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    marginBottom: 24,
  },
  cotizacionLabel: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
  cotizacionValue: { fontSize: 24, fontWeight: "700", color: "#407ee3" },

  continueBtn: {
    backgroundColor: "#407ee3",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  continueBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // ── Rating Screen Styles ──
  starsRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 20,
    justifyContent: "center",
  },

  ratingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: 12,
  },

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#374151",
    minHeight: 100,
    marginTop: 16,
    marginBottom: 16,
  },

  submitBtn: {
    backgroundColor: "#407ee3",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  skipBtn: {
    paddingVertical: 12,
    marginTop: 12,
    alignItems: "center",
  },
  skipText: { color: "#9ca3af", fontSize: 14 },

  // ── Warranty Box ──
  warrantyBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  warrantyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16a34a",
    marginBottom: 2,
  },
  warrantyDesc: {
    fontSize: 12,
    color: "#15803d",
    lineHeight: 17,
  },
  centerLoading: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#6b7280",
  },
});
