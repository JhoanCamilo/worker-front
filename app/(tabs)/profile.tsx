import { PasswordInput } from "@/src/components/ui/PasswordInput";
import { SelectAdvanced } from "@/src/components/ui/SelectAdvanced";
import { useClientProfile } from "@/src/hooks/useClientProfile";
import { usePasswordChange } from "@/src/hooks/usePasswordChange";
import { useCities } from "@/src/hooks/useCities";
import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.readonlyBox}>
        <Text style={styles.readonlyText}>{value || "—"}</Text>
      </View>
    </View>
  );
}

function EditableField({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "email-address" | "phone-pad";
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={styles.editableInput}
      />
    </View>
  );
}

export default function ClientProfileScreen() {
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const { loading, original, fields, hasChanges, handleCancel } =
    useClientProfile();
  const { options: cityOptions, loading: loadingCities } = useCities();

  const pw = usePasswordChange(async () => {
    await logout();
    router.replace("/login");
  });

  const resetRef = useRef({ profile: handleCancel, password: pw.handleCancel });
  resetRef.current = { profile: handleCancel, password: pw.handleCancel };

  useFocusEffect(
    useCallback(() => {
      return () => {
        resetRef.current.profile();
        resetRef.current.password();
      };
    }, [])
  );

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#407ee3" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Mi perfil</Text>

        {/* ── Datos personales ── */}
        <SectionTitle title="Datos personales" />

        <ReadonlyField
          label="Nombre"
          value={`${original?.nombre ?? ""} ${original?.apellido ?? ""}`.trim()}
        />
        <EditableField
          label="Teléfono"
          value={fields.phone}
          onChangeText={fields.setPhone}
          keyboardType="phone-pad"
        />
        <EditableField
          label="Correo electrónico"
          value={fields.email}
          onChangeText={fields.setEmail}
          keyboardType="email-address"
        />
        <SelectAdvanced
          label="Ciudad"
          placeholder={loadingCities ? "Cargando ciudades..." : "Seleccione una ciudad"}
          value={fields.cityId}
          onChange={fields.setCityId}
          options={cityOptions}
        />
        <ReadonlyField
          label="Fecha de nacimiento"
          value={original?.fecha_nacimiento ?? ""}
        />
        <ReadonlyField
          label="Número de documento"
          value={original?.num_identificacion ?? ""}
        />

        {hasChanges && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={() => {}}
            >
              <Text style={styles.actionButtonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={[styles.actionButtonText, { color: "#374151" }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Seguridad ── */}
        <SectionTitle title="Seguridad" />

        <View style={styles.securityBox}>
          <Text style={styles.securityTitle}>Cambiar contraseña</Text>

          <PasswordInput
            placeholder="Contraseña actual"
            value={pw.fields.currentPassword}
            onChangeText={pw.fields.setCurrentPassword}
          />
          <PasswordInput
            placeholder="Nueva contraseña"
            value={pw.fields.newPassword}
            onChangeText={pw.fields.setNewPassword}
          />
          <PasswordInput
            placeholder="Confirmar contraseña"
            value={pw.fields.confirmPassword}
            onChangeText={pw.fields.setConfirmPassword}
          />

          {pw.hasChanges && (
            <View style={styles.pwActionRow}>
              <TouchableOpacity
                style={[styles.pwButton, styles.pwSave]}
                onPress={pw.handleSave}
                disabled={pw.loading}
              >
                {pw.loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.pwSaveText}>Guardar contraseña</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pwButton, styles.pwCancel]}
                onPress={pw.handleCancel}
                disabled={pw.loading}
              >
                <Text style={styles.pwCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Salir ── */}
        <SectionTitle title="Salir" />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#000",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  fieldWrapper: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
  },
  readonlyBox: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  readonlyText: {
    color: "#6b7280",
    fontSize: 14,
  },
  editableInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#111827",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#407ee3",
  },
  cancelButton: {
    backgroundColor: "#e5e7eb",
  },
  actionButtonText: {
    fontWeight: "600",
    fontSize: 15,
    color: "#fff",
  },
  securityBox: {
    backgroundColor: "#407ee3",
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
  },
  securityTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 12,
  },
  pwActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  pwButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: "center",
  },
  pwSave: {
    backgroundColor: "#f2c70f",
  },
  pwCancel: {
    backgroundColor: "#e5e7eb",
  },
  pwSaveText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },
  pwCancelText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 4,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
