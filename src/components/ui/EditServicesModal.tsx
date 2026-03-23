import {
  getCategorias,
  getSubcategorias,
} from "@/src/services/category.service";
import {
  addTechnicianEspecialidades,
  deleteTechnicianEspecialidad,
  getTechnicianEspecialidades,
  TechnicianEspecialidad,
} from "@/src/services/technician.service";
import { useToast } from "@/src/hooks/useToast";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SelectAdvanced, SelectOption } from "./SelectAdvanced";

// Especialidad ya guardada en BD
type SavedItem = TechnicianEspecialidad & { source: "saved" };
// Especialidad nueva, aún no enviada
interface NewItem {
  source: "new";
  tempId: number;
  categoryId: number;
  categoryName: string;
  subcategoryId: number;
  subcategoryName: string;
}
type ListItem = SavedItem | NewItem;

interface Props {
  visible: boolean;
  onClose: () => void;
  onFinish: () => void;
}

let _tempId = 0;

export function EditServicesModal({ visible, onClose, onFinish }: Props) {
  const { success, error } = useToast();

  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [subcategories, setSubcategories] = useState<SelectOption[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);

  // Lista mixta: items de BD + items nuevos no guardados
  const [items, setItems] = useState<ListItem[]>([]);

  // IDs de subcategorías ya presentes (para bloquear duplicados)
  const usedSubIds = new Set(
    items.map((i) => (i.source === "saved" ? i.id_subcategoria : i.subcategoryId)),
  );

  // Cargar categorías y especialidades existentes al abrir
  useEffect(() => {
    if (!visible) return;

    setLoadingCats(true);
    getCategorias()
      .then((data) =>
        setCategories(data.map((c) => ({ label: c.nombre, value: c.id_categoria }))),
      )
      .catch(() => {})
      .finally(() => setLoadingCats(false));

    setLoadingData(true);
    getTechnicianEspecialidades()
      .then((data) =>
        setItems(data.map((e) => ({ ...e, source: "saved" as const }))),
      )
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [visible]);

  // Cargar subcategorías cuando cambia la categoría
  useEffect(() => {
    if (!selectedCatId) {
      setSubcategories([]);
      setSelectedSubId(null);
      return;
    }
    setLoadingSubs(true);
    setSelectedSubId(null);
    getSubcategorias(selectedCatId)
      .then((data) =>
        setSubcategories(
          data.map((s) => ({ label: s.nombre, value: s.id_subcategoria })),
        ),
      )
      .catch(() => {})
      .finally(() => setLoadingSubs(false));
  }, [selectedCatId]);

  const handleAdd = () => {
    if (!selectedCatId || !selectedSubId) return;
    if (usedSubIds.has(selectedSubId)) return; // duplicado

    const catName = categories.find((c) => c.value === selectedCatId)?.label ?? "";
    const subName = subcategories.find((s) => s.value === selectedSubId)?.label ?? "";

    setItems((prev) => [
      ...prev,
      {
        source: "new",
        tempId: ++_tempId,
        categoryId: selectedCatId,
        categoryName: catName,
        subcategoryId: selectedSubId,
        subcategoryName: subName,
      },
    ]);
    setSelectedSubId(null);
  };

  const handleRemove = async (item: ListItem) => {
    if (item.source === "saved") {
      try {
        await deleteTechnicianEspecialidad(item.id_especialidad);
        setItems((prev) =>
          prev.filter(
            (i) => !(i.source === "saved" && i.id_especialidad === item.id_especialidad),
          ),
        );
      } catch {
        error("No se pudo eliminar la especialidad");
      }
    } else {
      setItems((prev) =>
        prev.filter((i) => !(i.source === "new" && i.tempId === item.tempId)),
      );
    }
  };

  const handleFinish = async () => {
    const newOnes = items.filter((i) => i.source === "new") as NewItem[];

    if (newOnes.length > 0) {
      setSaving(true);
      try {
        await addTechnicianEspecialidades(
          newOnes.map((n) => ({
            id_subcategoria: n.subcategoryId,
            experiencia: "",
          })),
        );
        success("Especialidades guardadas correctamente");
      } catch {
        error("No se pudieron guardar las especialidades");
        setSaving(false);
        return;
      }
      setSaving(false);
    }

    resetForm();
    onFinish();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedCatId(null);
    setSelectedSubId(null);
    // Quitar solo los items nuevos (los eliminados de BD ya se eliminaron)
    setItems((prev) => prev.filter((i) => i.source === "saved"));
  };

  const canAdd = !!selectedCatId && !!selectedSubId && !usedSubIds.has(selectedSubId ?? -1);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Gestiona tus especialidades</Text>

          {/* Selectores */}
          {loadingCats ? (
            <ActivityIndicator color="#407ee3" style={{ marginVertical: 12 }} />
          ) : (
            <SelectAdvanced
              label="Categorías"
              placeholder="Seleccione una categoría"
              value={selectedCatId}
              options={categories}
              onChange={(v) => setSelectedCatId(v)}
            />
          )}

          {selectedCatId &&
            (loadingSubs ? (
              <ActivityIndicator color="#407ee3" style={{ marginBottom: 12 }} />
            ) : (
              <SelectAdvanced
                label="Subcategorías"
                placeholder="Seleccione una subcategoría"
                value={selectedSubId}
                options={subcategories}
                onChange={(v) => setSelectedSubId(v)}
              />
            ))}

          {/* Botón Añadir */}
          <TouchableOpacity
            style={[styles.addBtn, !canAdd && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!canAdd}
            activeOpacity={0.8}
          >
            <Text style={styles.addText}>Añadir</Text>
            <FontAwesome5 name="plus" size={15} color="#fff" />
          </TouchableOpacity>

          {/* Lista */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {loadingData ? (
              <ActivityIndicator color="#407ee3" style={{ marginTop: 12 }} />
            ) : items.length === 0 ? (
              <Text style={styles.emptyText}>Aún no has añadido especialidades</Text>
            ) : (
              items.map((item) => {
                const isNew = item.source === "new";
                const catName = isNew ? item.categoryName : (item.categoria ?? "");
                const subName = isNew ? item.subcategoryName : item.subcategoria;
                const key = isNew ? `new-${item.tempId}` : `saved-${item.id_especialidad}`;

                return (
                  <View key={key} style={[styles.chip, isNew && styles.chipNew]}>
                    <View style={styles.chipInfo}>
                      {catName ? (
                        <Text style={styles.chipCategory}>{catName}</Text>
                      ) : null}
                      <Text style={styles.chipSub}>{subName}</Text>
                    </View>
                    <Pressable onPress={() => handleRemove(item)} hitSlop={8}>
                      <FontAwesome5 name="trash" size={18} color="#cc2d2d" />
                    </Pressable>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Botones fijos */}
          <TouchableOpacity
            style={[styles.finishBtn, saving && { opacity: 0.6 }]}
            onPress={handleFinish}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.finishText}>Finalizar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    maxHeight: "90%",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#5e5e5e",
    textAlign: "center",
    marginBottom: 16,
  },
  fieldWrapper: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 5,
  },
  experienciaInput: {
    borderWidth: 1,
    borderColor: "#407ee3",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: "#374151",
    backgroundColor: "#fff",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#407ee3",
    borderRadius: 10,
    paddingVertical: 13,
    marginBottom: 16,
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  list: {
    flexGrow: 0,
    maxHeight: 200,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 13,
    paddingVertical: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  chipNew: {
    borderColor: "#407ee3",
    backgroundColor: "#eff6ff",
  },
  chipInfo: {
    flex: 1,
    marginRight: 8,
  },
  chipCategory: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 2,
  },
  chipSub: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  chipExp: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  finishBtn: {
    backgroundColor: "#f2c70f",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  finishText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: "#cc2d2d",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  cancelText: {
    color: "#cc2d2d",
    fontWeight: "600",
    fontSize: 15,
  },
});
