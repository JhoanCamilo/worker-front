import { useEffect, useState } from "react";
import { getCiudades } from "@/src/services/city.service";
import { SelectOption } from "@/src/components/ui/SelectAdvanced";

export function useCities() {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCiudades()
      .then((data) =>
        setOptions(data.map((c) => ({ label: c.nombre_ciudad, value: c.id_ciudad })))
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { options, loading };
}
