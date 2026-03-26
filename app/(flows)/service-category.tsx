import { ApiCategoria, getCategorias } from "@/src/services/category.service";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ServiceCategoryScreen() {
  const router = useRouter();
  const { modo } = useLocalSearchParams<{ modo: string }>();
  const [categories, setCategories] = useState<ApiCategoria[]>([]);
  const [loading, setLoading] = useState(true);

  const esInmediata = modo === "INMEDIATA";

  useEffect(() => {
    getCategorias()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (cat: ApiCategoria) => {
    router.push({
      pathname: "/service-subcategory",
      params: { categoryId: cat.id_categoria, categoryName: cat.nombre, modo: modo ?? "INMEDIATA" },
    });
  };

  return (
    <View style={styles.screen}>
      {/* Header amarillo con back */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topBarText}>
          {esInmediata ? "Servicio inmediato" : "Agendar servicio"}
        </Text>
        <View style={{ width: 34 }} />
      </View>

      {/* Título */}
      <Text style={styles.title}>¿Qué tipo de servicio necesitas?</Text>

      {/* Lista de categorías (scrollable) */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color="#407ee3" style={{ marginTop: 24 }} />
        ) : (
          categories.map((cat) => (
            <TouchableOpacity
              key={cat.id_categoria}
              style={styles.categoryBtn}
              onPress={() => handleSelect(cat)}
              activeOpacity={0.75}
            >
              <Text style={styles.categoryText}>{cat.nombre}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Botón fijo */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.8}
          onPress={() => router.replace("/(tabs)/home")}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    color: "#000",
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 12,
  },
  categoryBtn: {
    borderWidth: 1.5,
    borderColor: "#407ee3",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  categoryBtnSelected: {
    backgroundColor: "#407ee3",
  },
  categoryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#407ee3",
  },
  categoryTextSelected: {
    color: "#fff",
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
