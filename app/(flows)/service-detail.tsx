import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
  const { categoryId, categoryName, subcategoryId, subcategoryName } = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
    subcategoryId: string;
    subcategoryName: string;
  }>();

  const [address, setAddress] = useState("");
  const [complement, setComplement] = useState("");
  const [description, setDescription] = useState("");
  const [useLocation, setUseLocation] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

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
        <Text style={styles.topBarText}>Datos de la solicitud</Text>
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
        {/* Dirección */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>¿Donde?</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Escribe tu dirección"
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />
        </View>

        {/* Complemento */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>Complemento (apt x, torre x)</Text>
          <TextInput
            value={complement}
            onChangeText={setComplement}
            placeholder="Ej: Apto 301, Torre B"
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />
        </View>

        {/* Checkbox ubicación */}
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

        {/* Descripción */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>
            Danos una breve descripción de tu problema
          </Text>
          <TextInput
            value={description}
            onChangeText={(t) => setDescription(t.slice(0, 250))}
            placeholder="Describe brevemente el problema..."
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
            style={styles.textarea}
          />
          <Text style={styles.charCount}>{description.length}/250</Text>
        </View>
      </ScrollView>

      {/* Botones fijos */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.requestBtn}
          activeOpacity={0.8}
          onPress={() =>
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
              },
            })
          }
        >
          <Text style={styles.requestText}>Solicitar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.8}
          onPress={() => router.replace("/(tabs)/home")}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
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
  input: {
    borderWidth: 1.5,
    borderColor: "#407ee3",
    borderRadius: 5,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: "#5e5e5e",
    backgroundColor: "#fff",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
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
    color: "#5e5e5e",
    backgroundColor: "#fff",
  },
  charCount: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "right",
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
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
});
