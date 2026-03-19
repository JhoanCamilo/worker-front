import { useEffect, useState } from "react";
import { ClientProfile, getClientProfile } from "@/src/services/client.service";

export function useClientProfile() {
  const [original, setOriginal] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cityId, setCityId] = useState<number | null>(null);

  useEffect(() => {
    getClientProfile()
      .then((data) => {
        setOriginal(data);
        setPhone(data.telefono ?? "");
        setEmail(data.correo_electronico ?? "");
        setCityId(data.id_ciudad ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const hasChanges =
    phone !== (original?.telefono ?? "") ||
    email !== (original?.correo_electronico ?? "") ||
    cityId !== (original?.id_ciudad ?? null);

  const handleCancel = () => {
    setPhone(original?.telefono ?? "");
    setEmail(original?.correo_electronico ?? "");
    setCityId(original?.id_ciudad ?? null);
  };

  return {
    loading,
    original,
    fields: { phone, setPhone, email, setEmail, cityId, setCityId },
    hasChanges,
    handleCancel,
  };
}
