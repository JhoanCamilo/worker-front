import { useState } from "react";
import { router } from "expo-router";
import { validateRegisterForm } from "@/src/utils/validators";
import { formatDateToISO } from "@/src/utils/formaters";
import { useRegisterStore } from "@/src/store/register.store";
import { useToast } from "@/src/hooks/useToast";

export function useRegisterForm() {
  const { setPersonalData, payload } = useRegisterStore();
  const { error, success } = useToast();
  const role = payload.role;

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [documentType, setDocumentType] = useState<number | null>(null);
  const [documentNumber, setDocumentNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [password, setPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [cityId, setCityId] = useState<number | null>(null);

  const onNext = () => {
    const errorMessage = validateRegisterForm({
      name,
      lastName,
      documentType,
      documentNumber,
      phone,
      email,
      birthDate,
      password,
      confirmedPassword,
      role,
      cityId,
    });

    if (errorMessage) {
      error(errorMessage);
      return;
    }

    setPersonalData({
      name,
      lastName,
      documentType: documentType!,
      documentNumber,
      phone,
      email,
      birthDate: formatDateToISO(birthDate!),
      password,
      confirmedPassword,
      cityId: cityId!,
    });

    success("Datos validados correctamente");
    router.push("/(auth)/terms_cond");
  };

  return {
    role,
    fields: {
      name,
      setName,
      lastName,
      setLastName,
      documentType,
      setDocumentType,
      documentNumber,
      setDocumentNumber,
      phone,
      setPhone,
      email,
      setEmail,
      birthDate,
      setBirthDate,
      password,
      setPassword,
      confirmedPassword,
      setConfirmedPassword,
      cityId,
      setCityId,
    },
    onNext,
  };
}
