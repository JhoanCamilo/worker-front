import { useEffect, useState } from "react";
import {
  getTechnicianProfile,
  TechnicianProfile,
} from "@/src/services/technician.service";

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/api\/?$/, "");

function toAbsoluteUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path}`;
}

export function useTechnicianProfile() {
  const [original, setOriginal] = useState<TechnicianProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cityId, setCityId] = useState<number | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    getTechnicianProfile()
      .then((data) => {
        setOriginal(data);
        setPhone(data.telefono ?? "");
        setEmail(data.correo_electronico ?? "");
        setCityId(data.id_ciudad ?? null);
        setPhotoUrl(toAbsoluteUrl(data.url_foto));
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
    photoUrl,
    setPhotoUrl,
    fields: { phone, setPhone, email, setEmail, cityId, setCityId },
    hasChanges,
    handleCancel,
  };
}
