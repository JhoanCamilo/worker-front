import {
  ScrollView,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { LabeledInput } from "@/src/components/ui/LabeledInput";
import { SelectAdvanced } from "@/src/components/ui/SelectAdvanced";
import { DateInput } from "@/src/components/ui/DateInput";
import { PasswordInput } from "@/src/components/ui/PasswordInput";
import { Button } from "@/src/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { validateRegisterForm } from "@/src/utils/validators";
import { formatDateToISO } from "@/src/utils/formaters";
import { useToast } from "@/src/hooks/useToast";
import { useRegisterStore } from '@/src/store/register.store'

export default function RegisterFormScreen() {
  //? Context
  const { setPersonalData } = useRegisterStore()

  const [name, setName] = useState("");
  const [documentType, setDocumentType] = useState<number | null>(null);
  const [documentNumber, setDocumentNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [password, setPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");

  const { error, success } = useToast();

  const onNext = () => {
  const errorMessage = validateRegisterForm({
    name,
    documentType,
    documentNumber,
    phone,
    email,
    birthDate,
    password,
    confirmedPassword,
  })

  if (errorMessage) {
    error(errorMessage)
    return
  }

  // ⬇️ AQUÍ está la clave
  setPersonalData({
    name,
    documentType: documentType!, // ya validado
    documentNumber,
    phone,
    email,
    birthDate: formatDateToISO(birthDate!),      // ya validado
    password,
  })

  success('Datos validados correctamente')

  router.push('/(auth)/terms_cond')
}


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

        <LabeledInput label="Nombre" value={name} onChangeText={setName} />

        <SelectAdvanced
          label="Tipo de documento"
          value={documentType}
          onChange={setDocumentType}
          options={[
            { label: "Cédula de ciudadanía", value: 1 },
            { label: "Cédula de extranjería", value: 2 },
            { label: "Pasaporte", value: 3 },
            { label: "NIT", value: 4 },
          ]}
        />

        <LabeledInput
          label="Documento de identidad"
          value={documentNumber}
          onChangeText={setDocumentNumber}
        />

        <LabeledInput
          label="Número de teléfono"
          value={phone}
          onChangeText={setPhone}
        />

        <LabeledInput
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
        />

        <DateInput
          label="Fecha de nacimiento"
          value={birthDate}
          onChange={setBirthDate}
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
            value={password}
            onChangeText={setPassword}
          />

          <PasswordInput
            placeholder="Confirmar contraseña"
            value={confirmedPassword}
            onChangeText={setConfirmedPassword}
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
