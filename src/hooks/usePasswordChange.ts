import { useState } from "react";
import { changePassword } from "@/src/services/auth.service";
import { useToast } from "@/src/hooks/useToast";

export function usePasswordChange(onSuccess?: () => void) {
  const { error, success } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const hasChanges = !!currentPassword && !!newPassword && !!confirmPassword;

  const handleCancel = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSave = async () => {
    if (newPassword !== confirmPassword) return error("Las contraseñas no coinciden");

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      success("Contraseña actualizada correctamente");
      handleCancel();
      onSuccess?.();
    } catch (err: any) {
      const apiData = err?.response?.data;
      const message =
        apiData?.errors?.[0] ??
        apiData?.message ??
        "No se pudo actualizar la contraseña";
      error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    fields: { currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword },
    hasChanges,
    loading,
    handleCancel,
    handleSave,
  };
}
