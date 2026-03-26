import { crearCalificacion } from "@/src/services/calificacion.service";
import { useToast } from "@/src/hooks/useToast";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CalificarScreen() {
  const { idServicio } = useLocalSearchParams<{ idServicio: string }>();
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToast();

  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
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
      router.replace("/(tabs)/home");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "No se pudo enviar la calificación";
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 36 }} />
        <Text style={styles.headerTitle}>Calificar servicio</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>¿Cómo fue tu experiencia?</Text>
        <Text style={styles.subtitle}>
          Tu opinión nos ayuda a mejorar el servicio
        </Text>

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
          placeholderTextColor="#9ca3af"
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
          onPress={handleSubmit}
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
          onPress={() => router.replace("/(tabs)/home")}
        >
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    backgroundColor: "#407ee3",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },

  content: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },

  title: { fontSize: 22, fontWeight: "700", color: "#1f2937" },
  subtitle: { fontSize: 14, color: "#6b7280", textAlign: "center" },

  starsRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 12,
  },

  ratingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
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
    marginTop: 8,
  },

  submitBtn: {
    backgroundColor: "#407ee3",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
    marginTop: 8,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  skipBtn: {
    paddingVertical: 12,
  },
  skipText: { color: "#9ca3af", fontSize: 14 },
});
