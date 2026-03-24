import { Button } from "@/src/components/ui/Button";
import { DateInput } from "@/src/components/ui/DateInput";
import { LabeledInput } from "@/src/components/ui/LabeledInput";
import { PasswordInput } from "@/src/components/ui/PasswordInput";
import { SelectAdvanced } from "@/src/components/ui/SelectAdvanced";
import { useCities } from "@/src/hooks/useCities";
import { useRegisterForm } from "@/src/hooks/useRegisterForm";
import { PasswordChecks } from "@/src/utils/validators";
import { Ionicons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";

function PasswordChecklist({ checks }: { checks: PasswordChecks }) {
  const items: { key: keyof PasswordChecks; label: string }[] = [
    { key: "minLength", label: "Mínimo 8 caracteres" },
    { key: "hasUppercase", label: "Al menos una mayúscula" },
    { key: "hasNumber", label: "Al menos un número" },
    { key: "hasSpecial", label: "Al menos un carácter especial" },
  ];

  return (
    <View style={{ marginTop: 6, marginBottom: 4 }}>
      {items.map(({ key, label }) => (
        <View
          key={key}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}
        >
          <Ionicons
            name={checks[key] ? "checkmark-circle" : "close-circle"}
            size={14}
            color={checks[key] ? "#4ade80" : "#f87171"}
            style={{ marginRight: 6 }}
          />
          <Text style={{ fontSize: 12, color: checks[key] ? "#4ade80" : "#f87171" }}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function RegisterFormScreen() {
  const { fields, fieldErrors, passwordChecks, showPasswordChecks, onNext } =
    useRegisterForm();
  const { options: cityOptions, loading: loadingCities } = useCities();

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
          error={fieldErrors.name}
        />

        <LabeledInput
          label="Apellidos"
          value={fields.lastName}
          onChangeText={fields.setLastName}
          error={fieldErrors.lastName}
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
          keyboardType="numeric"
          error={fieldErrors.documentNumber}
        />

        <LabeledInput
          label="Número de teléfono"
          value={fields.phone}
          onChangeText={fields.setPhone}
          keyboardType="phone-pad"
          error={fieldErrors.phone}
        />

        <LabeledInput
          label="Correo electrónico"
          value={fields.email}
          onChangeText={fields.setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={fieldErrors.email}
        />

        <DateInput
          label="Fecha de nacimiento"
          value={fields.birthDate}
          onChange={fields.setBirthDate}
        />

        <SelectAdvanced
          label="Ciudad"
          placeholder={loadingCities ? "Cargando ciudades..." : "Seleccione una ciudad"}
          value={fields.cityId}
          onChange={fields.setCityId}
          options={cityOptions}
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

          {showPasswordChecks && (
            <PasswordChecklist checks={passwordChecks} />
          )}

          <PasswordInput
            placeholder="Confirmar contraseña"
            value={fields.confirmedPassword}
            onChangeText={fields.setConfirmedPassword}
          />

          {fieldErrors.confirmedPassword ? (
            <Text style={{ fontSize: 12, color: "#fca5a5", marginTop: -6, marginBottom: 4 }}>
              {fieldErrors.confirmedPassword}
            </Text>
          ) : null}
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
