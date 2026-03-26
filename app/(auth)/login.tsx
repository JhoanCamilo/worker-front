import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { useLogin } from "@/src/hooks/useLogin";
import { useToast } from "@/src/hooks/useToast";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import Logo from "../../assets/images/favicon.png";

const version = Constants.expoConfig?.version;

export default function LoginScreen() {
  const router = useRouter();

  const { handleLogin, loading } = useLogin();
  const { success, error } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async () => {
    if (!email || !password) {
      error("Completa todos los campos");
      return;
    }

    try {
      await handleLogin(email, password);
      success("Bienvenido 👋");
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <Image
            source={Logo}
            style={{ width: 500, height: 160, resizeMode: "contain" }}
          />
        </View>

        {/* Inputs */}
        <Input
          placeholder="Correo electrónico"
          value={email}
          onChangeText={(t) => setEmail(t.toLowerCase().trim())}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Input
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Botones */}
        <Button
          title="Iniciar Sesión"
          onPress={onSubmit}
          type="primary"
          disabled={loading}
        />

        <Button
          title="Registrate"
          onPress={() => router.push("/(auth)/register-type")}
          type="secondary"
        />

        {/* Forgot */}
        <Text
          style={{
            textAlign: "center",
            color: "#2563eb",
            marginTop: 8,
            textDecorationLine: "underline",
          }}
        >
          Olvidé mi contraseña
        </Text>

        {/* Version */}
        <Text
          style={{
            textAlign: "center",
            marginTop: 40,
            fontSize: 12,
            color: "#6b7280",
          }}
        >
          Versión {version}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
