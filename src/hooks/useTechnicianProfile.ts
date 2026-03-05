import { useEffect, useState } from "react";
import {
  getTechnicianProfile,
  TechnicianProfile,
} from "@/src/services/technician.service";

export function useTechnicianProfile() {
  const [original, setOriginal] = useState<TechnicianProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cityId, setCityId] = useState<number | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    getTechnicianProfile()
      .then((data) => {
        setOriginal(data);
        setPhone(data.telefono);
        setEmail(data.correo_electronico);
        setCityId(data.id_ciudad);
      })
      .finally(() => setLoading(false));
  }, []);

  const hasChanges =
    phone !== (original?.telefono ?? "") ||
    email !== (original?.correo_electronico ?? "") ||
    cityId !== (original?.id_ciudad ?? null) ||
    !!currentPassword ||
    !!newPassword ||
    !!confirmPassword;

  const handleCancel = () => {
    setPhone(original?.telefono ?? "");
    setEmail(original?.correo_electronico ?? "");
    setCityId(original?.id_ciudad ?? null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return {
    loading,
    original,
    fields: {
      phone,
      setPhone,
      email,
      setEmail,
      cityId,
      setCityId,
      currentPassword,
      setCurrentPassword,
      newPassword,
      setNewPassword,
      confirmPassword,
      setConfirmPassword,
    },
    hasChanges,
    handleCancel,
  };
}
