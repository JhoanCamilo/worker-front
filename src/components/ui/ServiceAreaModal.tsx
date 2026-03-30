import { useCities } from "@/src/hooks/useCities";
import { getTechnicianCities } from "@/src/services/technician.service";
import { useEffect, useRef, useState } from "react";
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

type CoverageMode = "km" | "cities" | null;

interface Props {
  visible: boolean;
  onClose: () => void;
  onFinish: (
    data: { mode: "km"; km: number } | { mode: "cities"; cityIds: number[] },
  ) => void;
  initialKm?: number;
}

export function ServiceAreaModal({ visible, onClose, onFinish, initialKm }: Props) {
  const { options: allCities, loading: loadingCities, error: citiesError } = useCities();

  const [mode, setMode] = useState<CoverageMode>(null);
  const [km, setKm] = useState(initialKm != null ? String(initialKm) : "");
  const [selectedCities, setSelectedCities] = useState<Set<number>>(new Set());
  const [baseCityId, setBaseCityId] = useState<number | null>(null);
  const [loadingTechCities, setLoadingTechCities] = useState(false);

  // Snapshot de las ciudades ya guardadas para resetear al cancelar
  const savedCitiesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!visible) return;

    // Sincronizar km con el valor del store cada vez que se abre el modal
    if (initialKm != null) setKm(String(initialKm));

    setLoadingTechCities(true);
    getTechnicianCities()
      .then((data) => {
        setBaseCityId(data.ciudad_base.id_ciudad);
        const existing = new Set(
          data.ciudades_adicionales.map((c) => c.id_ciudad),
        );
        savedCitiesRef.current = existing;
        setSelectedCities(new Set(existing));
      })
      .catch(() => {})
      .finally(() => setLoadingTechCities(false));
  }, [visible, initialKm]);

  // Ciudades disponibles: todas excepto la ciudad base del técnico
  const availableCities = allCities.filter((c) => c.value !== baseCityId);

  const handleCancel = () => {
    setMode(null);
    setKm(initialKm != null ? String(initialKm) : "");
    setSelectedCities(new Set(savedCitiesRef.current));
    onClose();
  };

  const handleFinish = () => {
    if (mode === "km") {
      onFinish({ mode: "km", km: parseFloat(km) });
    } else if (mode === "cities") {
      onFinish({ mode: "cities", cityIds: Array.from(selectedCities) });
    }
  };

  const toggleCity = (id: number) => {
    setSelectedCities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isLoading = loadingCities || loadingTechCities;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Título */}
            <Text style={styles.title}>
              Seleccione su rango de cobertura para prestar sus servicios
            </Text>

            {/* Radio buttons */}
            <RadioOption
              label="Por rango en kilómetros"
              selected={mode === "km"}
              onPress={() => setMode("km")}
            />
            <RadioOption
              label="Cobertura por ciudades"
              selected={mode === "cities"}
              onPress={() => setMode("cities")}
            />

            {/* Formulario: kilómetros */}
            {mode === "km" && (
              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>
                  Establezca un rango en kilómetros para recibir solicitudes
                </Text>
                <TextInput
                  value={km}
                  onChangeText={setKm}
                  keyboardType="decimal-pad"
                  placeholder="Ej: 15.5"
                  placeholderTextColor="#4b5563"
                  style={styles.kmInput}
                />
                <Text style={styles.inputHint}>
                  Puede cambiar este dato en cualquier momento
                </Text>
              </View>
            )}

            {/* Formulario: ciudades */}
            {mode === "cities" && (
              <View style={styles.formSection}>
                {isLoading ? (
                  <ActivityIndicator
                    color="#407ee3"
                    style={{ marginTop: 12 }}
                  />
                ) : citiesError ? (
                  <Text style={styles.errorText}>{citiesError}</Text>
                ) : (
                  availableCities.map((city) => {
                    const checked = selectedCities.has(city.value);
                    return (
                      <Pressable
                        key={city.value}
                        style={styles.cityRow}
                        onPress={() => toggleCity(city.value)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            checked && styles.checkboxChecked,
                          ]}
                        >
                          {checked && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={styles.cityLabel}>{city.label}</Text>
                      </Pressable>
                    );
                  })
                )}
              </View>
            )}
          </ScrollView>

          {/* Botones transversales */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
              <Text style={styles.finishText}>Finalizar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function RadioOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.radioRow} onPress={onPress}>
      <View style={styles.radioOuter}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
  },
  title: {
    fontSize: 14,
    color: "#5e5e5e",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  // Radio
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#407ee3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#407ee3",
  },
  radioLabel: {
    fontSize: 14,
    color: "#5e5e5e",
  },
  // Formulario km
  formSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 14,
    color: "#5e5e5e",
    marginBottom: 8,
  },
  kmInput: {
    borderWidth: 1,
    borderColor: "#407ee3",
    borderRadius: 5,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: "#5e5e5e",
    backgroundColor: "#fff",
  },
  inputHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#407ee3",
    fontWeight: "700",
  },
  // Ciudades
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#407ee3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: "#407ee3",
    borderColor: "#407ee3",
  },
  checkmark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
  },
  cityLabel: {
    fontSize: 14,
    color: "#5e5e5e",
  },
  errorText: {
    fontSize: 13,
    color: "#f13d3d",
    textAlign: "center",
    marginTop: 12,
  },
  // Botones
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  finishBtn: {
    flex: 1,
    backgroundColor: "#f2c70f",
    borderRadius: 5,
    paddingVertical: 13,
    alignItems: "center",
  },
  finishText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#f13d3d",
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelText: {
    color: "#f13d3d",
    fontWeight: "600",
    fontSize: 14,
  },
});
