import {
  ApiSubcategoria,
  getSubcategorias,
} from "@/src/services/category.service";
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

export default function ServiceSubcategoryScreen() {
  const router = useRouter();
  const { categoryId, categoryName, modo } = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
    modo: string;
  }>();

  const [subcategories, setSubcategories] = useState<ApiSubcategoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) return;
    getSubcategorias(Number(categoryId))
      .then(setSubcategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categoryId]);

  const handleSelect = (sub: ApiSubcategoria) => {
    router.push({
      pathname: "/service-detail",
      params: {
        categoryId,
        categoryName,
        subcategoryId: String(sub.id_subcategoria),
        subcategoryName: sub.nombre,
        modo: modo ?? "INMEDIATA",
      },
    });
  };

  const handleSkip = () => {
    router.push({
      pathname: "/service-detail",
      params: { categoryId, categoryName, subcategoryId: "", subcategoryName: "", modo: modo ?? "INMEDIATA" },
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
          {categoryName}
        </Text>
        {/* Spacer para centrar el texto */}
        <View style={{ width: 34 }} />
      </View>

      {/* Título y descripción */}
      <Text style={styles.title}>¿Qué servicio necesitas?</Text>
      <Text style={styles.subtitle}>
        Selecciona el servicio que mejor describa lo que necesitas. Si no estás
        seguro, puedes omitir este paso.
      </Text>

      {/* Lista de subcategorías (scrollable) */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color="#407ee3" style={{ marginTop: 24 }} />
        ) : (
          subcategories.map((sub) => (
            <TouchableOpacity
              key={sub.id_subcategoria}
              style={styles.itemBtn}
              onPress={() => handleSelect(sub)}
              activeOpacity={0.75}
            >
              <Text style={styles.itemText}>{sub.nombre}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Botones fijos */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.skipBtn}
          activeOpacity={0.8}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>

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
    fontSize: 15,
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
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: 28,
    marginBottom: 16,
    lineHeight: 19,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 12,
  },
  itemBtn: {
    borderWidth: 1.5,
    borderColor: "#407ee3",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  itemText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#407ee3",
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
  skipBtn: {
    backgroundColor: "#f2c70f",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  skipText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
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
