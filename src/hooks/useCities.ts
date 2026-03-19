import { useEffect, useState } from "react";
import { getCiudades } from "@/src/services/city.service";
import { SelectOption } from "@/src/components/ui/SelectAdvanced";

export function useCities() {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getCiudades()
      .then((data) =>
        setOptions(data.map((c) => ({ label: c.nombre_ciudad, value: c.id_ciudad })))
      )
      .catch((err) => {
        const msg = err?.response?.data?.message ?? err?.message ?? "Error al cargar ciudades";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  return { options, loading, error };
}
