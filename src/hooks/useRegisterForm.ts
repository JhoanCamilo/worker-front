import { useState } from "react";
import { router } from "expo-router";
import {
  validateRegisterForm,
  validateName,
  validateLastName,
  validateDocumentNumber,
  validatePhone,
  validatePassword,
  checkPassword,
  PasswordChecks,
} from "@/src/utils/validators";
import { formatDateToISO } from "@/src/utils/formaters";
import { useRegisterStore } from "@/src/store/register.store";
import { useToast } from "@/src/hooks/useToast";

export function useRegisterForm() {
  const { setPersonalData, payload } = useRegisterStore();
  const { error, success } = useToast();
  const role = payload.role;

  const [name, setNameRaw] = useState("");
  const [lastName, setLastNameRaw] = useState("");
  const [documentType, setDocumentType] = useState<number | null>(null);
  const [documentNumber, setDocumentNumberRaw] = useState("");
  const [phone, setPhoneRaw] = useState("");
  const [email, setEmailRaw] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [password, setPasswordRaw] = useState("");
  const [confirmedPassword, setConfirmedPasswordRaw] = useState("");
  const [cityId, setCityId] = useState<number | null>(null);

  // Campos tocados (para mostrar errores solo después de primera interacción)
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  // Setters con tracking de "touched"
  const setName = (v: string) => { setNameRaw(v); touch("name"); };
  const setLastName = (v: string) => { setLastNameRaw(v); touch("lastName"); };
  const setDocumentNumber = (v: string) => { setDocumentNumberRaw(v); touch("documentNumber"); };
  const setPhone = (v: string) => { setPhoneRaw(v); touch("phone"); };
  const setEmail = (v: string) => { setEmailRaw(v); touch("email"); };
  const setPassword = (v: string) => { setPasswordRaw(v); touch("password"); };
  const setConfirmedPassword = (v: string) => { setConfirmedPasswordRaw(v); touch("confirmedPassword"); };

  // Errores en tiempo real (solo si el campo fue tocado)
  const fieldErrors = {
    name: touched.name ? validateName(name) : null,
    lastName: touched.lastName ? validateLastName(lastName) : null,
    documentNumber: touched.documentNumber ? validateDocumentNumber(documentNumber) : null,
    phone: touched.phone ? validatePhone(phone) : null,
    email: touched.email
      ? (!email.trim()
          ? "El correo electrónico es obligatorio"
          : !/^\S+@\S+\.\S+$/.test(email)
          ? "El correo electrónico no es válido"
          : null)
      : null,
    password: touched.password ? validatePassword(password) : null,
    confirmedPassword: touched.confirmedPassword
      ? (!confirmedPassword
          ? "Confirme la contraseña"
          : password !== confirmedPassword
          ? "Las contraseñas no coinciden"
          : null)
      : null,
  };

  // Checklist de requisitos de contraseña (siempre activo cuando se ha tocado)
  const passwordChecks: PasswordChecks = checkPassword(password);
  const showPasswordChecks = touched.password && password.length > 0;

  const onNext = () => {
    // Marcar todos los campos como tocados para mostrar todos los errores
    setTouched({
      name: true,
      lastName: true,
      documentNumber: true,
      phone: true,
      email: true,
      password: true,
      confirmedPassword: true,
    });

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
    fieldErrors,
    passwordChecks,
    showPasswordChecks,
    onNext,
  };
}
