import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { useAuthStore } from "@/src/store/auth.store";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

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
    </View>
  );
}
