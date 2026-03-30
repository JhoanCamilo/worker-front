import { createSolicitudProgramada } from "@/src/services/solicitud.service";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { categoryId, categoryName, subcategoryId, subcategoryName, modo } = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
    subcategoryId: string;
    subcategoryName: string;
    modo: string;
  }>();

  const esProgramada = modo === "PROGRAMADA";

  const [address, setAddress] = useState("");
  const [complement, setComplement] = useState("");
  const [description, setDescription] = useState("");
  const [useLocation, setUseLocation] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [addressError, setAddressError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);

  // ── Agendamiento ──────────────────────────────────────────────
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateError, setDateError] = useState(false);

  // ── Modal de confirmación (solo PROGRAMADA) ───────────────────
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const screenTitle =
    subcategoryName
      ? `${categoryName} - ${subcategoryName}`
      : categoryName ?? "";

  const handleLocationToggle = async () => {
    if (useLocation) {
      setUseLocation(false);
      return;
    }

    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Activa los permisos de ubicación para usar esta función.",
        );
        setLoadingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      const [place] = await Location.reverseGeocodeAsync(loc.coords);
      if (place) {
        const parts = [
          place.street,
          place.streetNumber,
          place.district,
          place.city,
        ].filter(Boolean);
        setAddress(parts.join(", "));
      }
      setUseLocation(true);
    } catch {
      Alert.alert("Error", "No se pudo obtener la ubicación.");
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) {
      // Mantener la hora si ya se seleccionó antes
      const updated = scheduledDate ? new Date(scheduledDate) : new Date();
      updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setScheduledDate(updated);
      setDateError(false);
      // Mostrar picker de hora después de seleccionar fecha
      setTimeout(() => setShowTimePicker(true), 300);
    }
  };

  const handleTimeChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(false);
    if (selected && scheduledDate) {
      const updated = new Date(scheduledDate);
      updated.setHours(selected.getHours(), selected.getMinutes());
      setScheduledDate(updated);
    }
  };

  const formatDate = (date: Date): string => {
    const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const dia = dias[date.getDay()];
    const numDia = date.getDate();
    const mes = meses[date.getMonth()];
    const hora = date.getHours();
    const min = String(date.getMinutes()).padStart(2, "0");
    const ampm = hora >= 12 ? "PM" : "AM";
    const hora12 = hora % 12 || 12;
    return `${dia} ${numDia} ${mes} - ${hora12}:${min} ${ampm}`;
  };

  // ── Crear solicitud programada directamente ───────────────────
  const handleSubmitProgramada = async () => {
    setSubmitting(true);
    try {
      let lat = coords?.lat;
      let lon = coords?.lon;

      if (lat === undefined || lon === undefined) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
        }
      }

      if (lat === undefined || lon === undefined) {
        Alert.alert("Error", "No se pudo obtener la ubicación para la solicitud.");
        setSubmitting(false);
        return;
      }

      const direccion = [address, complement].filter(Boolean).join(", ");
      const idSubcategoria = subcategoryId ? Number(subcategoryId) : undefined;
      const descripcion = description.trim() || "Sin descripción";

      const payload = {
        ...(idSubcategoria ? { id_subcategoria: idSubcategoria } : {}),
        descripcion,
        latitud: lat,
        longitud: lon,
        prioridad: "MEDIA" as const,
        ...(direccion ? { direccion } : {}),
        fecha_programada: scheduledDate!.toISOString(),
      };

      console.log("[solicitud] POST /solicitudes/programada →", payload);
      const res = await createSolicitudProgramada(payload);
      console.log(`[solicitud] Programada creada. id: ${res.id_solicitud} | técnicos: ${res.tecnicos_notificados}`);

      setShowSuccessModal(true);
    } catch (err: any) {
      const apiData = err?.response?.data;
      const detail = Array.isArray(apiData?.errors)
        ? apiData.errors[0]?.msg || apiData.errors[0]?.message
        : undefined;
      const msg = apiData?.message
        ? detail ? `${apiData.message}: ${detail}` : apiData.message
        : "No se pudo crear la solicitud.";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    let hasError = false;

    if (!address.trim() && !useLocation) {
      setAddressError(true);
      hasError = true;
    }
    if (!description.trim()) {
      setDescriptionError(true);
      hasError = true;
    }
    if (esProgramada && !scheduledDate) {
      setDateError(true);
      hasError = true;
    }

    if (hasError) return;
    // Validar que la fecha sea al menos 2 horas en el futuro
    if (esProgramada && scheduledDate) {
      const minTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
      if (scheduledDate < minTime) {
        Alert.alert("Fecha muy cercana", "El servicio programado debe ser al menos 2 horas en el futuro.");
        return;
      }
    }

    if (esProgramada) {
      // Crear solicitud aquí y mostrar modal
      handleSubmitProgramada();
      return;
    }

    // Solo para INMEDIATA → ir a searching
    router.push({
      pathname: "/searching",
      params: {
        categoryId: categoryId ?? "",
        categoryName: categoryName ?? "",
        subcategoryId: subcategoryId ?? "",
        subcategoryName: subcategoryName ?? "",
        address,
        complement,
        description,
        lat: coords ? String(coords.lat) : "",
        lon: coords ? String(coords.lon) : "",
        modo: "INMEDIATA",
      },
    });
  };

  const handleSuccessAccept = () => {
    setShowSuccessModal(false);
    router.replace("/(tabs)/home");
  };

  // Fecha mínima: mañana
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  minDate.setHours(7, 0, 0, 0);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header amarillo */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topBarText}>
          {esProgramada ? "Agendar servicio" : "Datos de la solicitud"}
        </Text>
        <View style={{ width: 34 }} />
      </View>

      {/* Título dinámico */}
      <Text style={styles.title}>{screenTitle}</Text>

      {/* Formulario scrollable */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Fecha y hora (solo programada) */}
        {esProgramada && (
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>¿Para cuándo lo necesitas? <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={[styles.dateBtn, dateError && styles.inputError]}
              activeOpacity={0.7}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#407ee3" />
              <Text style={[styles.dateText, !scheduledDate && { color: "#6b7280" }]}>
                {scheduledDate ? formatDate(scheduledDate) : "Selecciona fecha y hora"}
              </Text>
            </TouchableOpacity>
            {dateError && (
              <Text style={styles.errorText}>Debes seleccionar fecha y hora</Text>
            )}
            <Text style={styles.scheduleHint}>
              Al agendar, el técnico se compromete a atenderte en la fecha y hora seleccionada
            </Text>
          </View>
        )}

        {/* Dirección */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>¿Dónde necesitas el servicio? <Text style={styles.required}>*</Text></Text>
          <TextInput
            value={address}
            onChangeText={(t) => { setAddress(t); setAddressError(false); }}
            placeholder="Ej: Calle 5 #23-45, Barrio San Fernando"
            placeholderTextColor="#4b5563"
            style={[styles.input, addressError && styles.inputError]}
          />
          {addressError && (
            <Text style={styles.errorText}>Debes ingresar una dirección o usar tu ubicación</Text>
          )}

          {/* Checkbox ubicación — debajo del campo de dirección */}
          <Pressable
            style={styles.checkRow}
            onPress={handleLocationToggle}
            disabled={loadingLocation}
          >
            <View style={[styles.checkbox, useLocation && styles.checkboxOn]}>
              {useLocation && <Ionicons name="checkmark" size={14} color="#fff" />}
              {loadingLocation && !useLocation && (
                <Ionicons name="sync" size={12} color="#407ee3" />
              )}
            </View>
            <Text style={styles.checkLabel}>Usar mi ubicación actual</Text>
          </Pressable>
        </View>

        {/* Complemento */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>Complemento (apt x, torre x)</Text>
          <TextInput
            value={complement}
            onChangeText={setComplement}
            placeholder="Ej: Apto 301, Torre B"
            placeholderTextColor="#4b5563"
            style={styles.input}
          />
        </View>

        {/* Descripción */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>
            Danos una breve descripción de tu problema <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            value={description}
            onChangeText={(t) => { setDescription(t.slice(0, 250)); setDescriptionError(false); }}
            placeholder="Ej: Se dañó la tubería del lavamanos y gotea"
            placeholderTextColor="#4b5563"
            multiline
            textAlignVertical="top"
            style={[styles.textarea, descriptionError && styles.inputError]}
          />
          {descriptionError && (
            <Text style={styles.errorText}>La descripción es obligatoria</Text>
          )}
          <Text style={styles.charCount}>{description.length}/250</Text>
        </View>

        {/* Botones dentro del scroll para evitar que se monten sobre inputs */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.requestBtn, submitting && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.requestText}>
                {esProgramada ? "Agendar" : "Solicitar"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.8}
            onPress={() => router.replace("/(tabs)/home")}
            disabled={submitting}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date/Time pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={scheduledDate ?? minDate}
          mode="date"
          minimumDate={minDate}
          onChange={handleDateChange}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={scheduledDate ?? new Date()}
          mode="time"
          is24Hour={false}
          onChange={handleTimeChange}
        />
      )}

      {/* Modal de éxito — PROGRAMADA */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessAccept}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="checkmark-circle" size={56} color="#10b981" />
            </View>

            <Text style={styles.modalTitle}>Solicitud agendada</Text>

            <Text style={styles.modalMsg}>
              Tu solicitud ha sido enviada a los técnicos disponibles para la fecha seleccionada.
            </Text>

            <View style={styles.modalDateRow}>
              <Ionicons name="calendar" size={18} color="#407ee3" />
              <Text style={styles.modalDateText}>
                {scheduledDate ? formatDate(scheduledDate) : ""}
              </Text>
            </View>

            <Text style={styles.modalInfoText}>
              Recibirás una notificación cuando los técnicos envíen sus cotizaciones. Podrás revisarlas desde la campanita de notificaciones.
            </Text>

            <TouchableOpacity
              style={styles.modalAcceptBtn}
              activeOpacity={0.8}
              onPress={handleSuccessAccept}
            >
              <Text style={styles.modalAcceptText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topBar: {
    backgroundColor: "#f2c70f",
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 34,
  },
  topBarText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
    color: "#000",
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
    fontWeight: "500",
  },
  required: {
    color: "#cc2d2d",
    fontWeight: "700",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#407ee3",
    borderRadius: 5,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#cc2d2d",
  },
  errorText: {
    fontSize: 12,
    color: "#cc2d2d",
    marginTop: 4,
  },
  dateBtn: {
    borderWidth: 1.5,
    borderColor: "#407ee3",
    borderRadius: 5,
    paddingHorizontal: 12,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
  },
  dateText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  scheduleHint: {
    fontSize: 11,
    color: "#f59e0b",
    marginTop: 6,
    fontWeight: "500",
    lineHeight: 16,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#407ee3",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxOn: {
    backgroundColor: "#407ee3",
    borderColor: "#407ee3",
  },
  checkLabel: {
    fontSize: 14,
    color: "#374151",
  },
  textarea: {
    borderWidth: 1.5,
    borderColor: "#407ee3",
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingTop: 10,
    height: 120,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  charCount: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 4,
  },
  footer: {
    paddingTop: 20,
    paddingBottom: 40,
    gap: 12,
  },
  requestBtn: {
    backgroundColor: "#407ee3",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  requestText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: "#cc2d2d",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#cc2d2d",
  },

  // ── Modal de éxito ──────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 28,
    width: "100%",
    alignItems: "center",
  },
  modalIconCircle: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 10,
    textAlign: "center",
  },
  modalMsg: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  modalDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  modalDateText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#407ee3",
  },
  modalInfoText: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
  modalAcceptBtn: {
    backgroundColor: "#407ee3",
    borderRadius: 10,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
  },
  modalAcceptText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
