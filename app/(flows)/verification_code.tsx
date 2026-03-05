import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function VerificationCodeScreen() {
  const [code, setCode] = useState("");
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const onCancel = () => {
    logout(); // 🔥 elimina token + user
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ height: "100%", padding: 15 }}>
      <Text
        style={{
          fontSize: 25,
          fontWeight: "700",
          marginBottom: 20,
          marginTop: 40,
          textAlign: "center",
          color: "#3061b2",
        }}
      >
        Código de verificación
      </Text>
      <Text
        style={{
          marginBottom: 20,
          textAlign: "center",
          fontSize: 15,
        }}
      >
        Hemos enviado un código de verificación a tu correo electrónico
        registrado.
      </Text>
      <Input value={code} onChangeText={setCode} />
      <Button
        title="Aceptar"
        onPress={onCancel}
        customStyle={{ backgroundColor: "#f2c70f" }}
        customTextStyles={{ color: "#000", fontSize: 15 }}
      />

      <TouchableOpacity style={styles.logoutButton} onPress={onCancel}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 12,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
