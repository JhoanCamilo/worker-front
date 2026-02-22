import { Button } from "@/src/components/ui/Button";
import { DateInput } from "@/src/components/ui/DateInput";
import { LabeledInput } from "@/src/components/ui/LabeledInput";
import { PasswordInput } from "@/src/components/ui/PasswordInput";
import { SelectAdvanced } from "@/src/components/ui/SelectAdvanced";
import { useRegisterForm } from "@/src/hooks/useRegisterForm";
import { Ionicons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function RegisterFormScreen() {
  const { fields, onNext } = useRegisterForm();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            marginBottom: 20,
            marginTop: 20,
            textAlign: "center",
          }}
        >
          Datos de usuario
        </Text>

        <LabeledInput
          label="Nombres"
          value={fields.name}
          onChangeText={fields.setName}
        />

        <LabeledInput
          label="Apellidos"
          value={fields.lastName}
          onChangeText={fields.setLastName}
        />

        <SelectAdvanced
          label="Tipo de documento"
          value={fields.documentType}
          onChange={fields.setDocumentType}
          options={[
            { label: "Cédula de ciudadanía", value: 1 },
            { label: "Cédula de extranjería", value: 2 },
            { label: "Pasaporte", value: 3 },
            { label: "NIT", value: 4 },
          ]}
        />

        <LabeledInput
          label="Documento de identidad"
          value={fields.documentNumber}
          onChangeText={fields.setDocumentNumber}
        />

        <LabeledInput
          label="Número de teléfono"
          value={fields.phone}
          onChangeText={fields.setPhone}
        />

        <LabeledInput
          label="Correo electrónico"
          value={fields.email}
          onChangeText={fields.setEmail}
        />

        <DateInput
          label="Fecha de nacimiento"
          value={fields.birthDate}
          onChange={fields.setBirthDate}
        />

        {/* Contraseña */}
        <View
          style={{
            backgroundColor: "#407ee3",
            borderRadius: 10,
            padding: 16,
            marginTop: 16,
          }}
        >
          <Text style={{ color: "#fff", marginBottom: 8 }}>Contraseña</Text>

          <PasswordInput
            placeholder="Contraseña"
            value={fields.password}
            onChangeText={fields.setPassword}
          />

          <PasswordInput
            placeholder="Confirmar contraseña"
            value={fields.confirmedPassword}
            onChangeText={fields.setConfirmedPassword}
          />
        </View>

        <View style={{ marginTop: 24, marginBottom: 10 }}>
          <Button
            title={
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontWeight: "600" }}>Siguiente</Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  style={{ marginLeft: 8 }}
                />
              </View>
            }
            onPress={() => onNext()}
            customStyle={{ backgroundColor: "#f2c70f" }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
