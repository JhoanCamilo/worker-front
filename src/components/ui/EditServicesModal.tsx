import {
  getCategorias,
  getSubcategorias,
} from "@/src/services/category.service";
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

interface Specialty {
  categoryId: number;
  categoryName: string;
  subcategoryId: number;
  subcategoryName: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onFinish: (specialties: Specialty[]) => void;
}

export function EditServicesModal({ visible, onClose, onFinish }: Props) {
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [subcategories, setSubcategories] = useState<SelectOption[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  // Cargar categorías al abrir
  useEffect(() => {
    if (!visible) return;
    setLoadingCats(true);
    getCategorias()
      .then((data) =>
        setCategories(
          data.map((c) => ({ label: c.nombre, value: c.id_categoria })),
        ),
      )
      .catch(() => {})
      .finally(() => setLoadingCats(false));
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

    const catName =
      categories.find((c) => c.value === selectedCatId)?.label ?? "";
    const subName =
      subcategories.find((s) => s.value === selectedSubId)?.label ?? "";

    const alreadyAdded = specialties.some(
      (s) =>
        s.categoryId === selectedCatId && s.subcategoryId === selectedSubId,
    );
    if (alreadyAdded) return;

    setSpecialties((prev) => [
      ...prev,
      {
        categoryId: selectedCatId,
        categoryName: catName,
        subcategoryId: selectedSubId,
        subcategoryName: subName,
      },
    ]);
  };

  const handleRemove = (subId: number) => {
    setSpecialties((prev) => prev.filter((s) => s.subcategoryId !== subId));
  };

  const handleClose = () => {
    setSelectedCatId(null);
    setSelectedSubId(null);
    setSpecialties([]);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Título */}
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
            style={[
              styles.addBtn,
              (!selectedCatId || !selectedSubId) && styles.addBtnDisabled,
            ]}
            onPress={handleAdd}
            disabled={!selectedCatId || !selectedSubId}
            activeOpacity={0.8}
          >
            <Text style={styles.addText}>Añadir</Text>
            <FontAwesome5 name="plus" size={15} color="#fff" />
          </TouchableOpacity>

          {/* Lista de especialidades añadidas */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {specialties.length === 0 ? (
              <Text style={styles.emptyText}>
                Aún no has añadido especialidades
              </Text>
            ) : (
              specialties.map((item) => (
                <View
                  key={`${item.categoryId}-${item.subcategoryId}`}
                  style={styles.chip}
                >
                  <View style={styles.chipInfo}>
                    <Text style={styles.chipCategory}>{item.categoryName}</Text>
                    <Text style={styles.chipSub}>{item.subcategoryName}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleRemove(item.subcategoryId)}
                    hitSlop={8}
                  >
                    <FontAwesome5 name="trash" size={18} color="#cc2d2d" />
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>

          {/* Botones fijos */}
          <TouchableOpacity
            style={styles.finishBtn}
            onPress={() => onFinish(specialties)}
            activeOpacity={0.8}
          >
            <Text style={styles.finishText}>Finalizar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleClose}
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
    maxHeight: "85%",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#5e5e5e",
    textAlign: "center",
    marginBottom: 16,
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
  chipInfo: {
    flex: 1,
    marginRight: 8,
  },
  chipCategory: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 2,
  },
  chipSub: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
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
