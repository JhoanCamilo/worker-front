import {
  ClienteRegistroPayload,
  RegisterPayload,
  TecnicoRegistroPayload,
} from "@/src/types/register";
import { api } from "./api";
import { mockRegister } from "./register.mock";

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_API === "true";

export async function registerCliente(
  payload: RegisterPayload,
): Promise<{ message: string }> {
  if (USE_MOCK) {
    return mockRegister(payload);
  }

  if (payload.role === 2) {
    const apiPayload: TecnicoRegistroPayload = {
      nombre: payload.name,
      apellido: payload.lastName,
      correo_electronico: payload.email,
      telefono: payload.phone,
      contraseña: payload.password,
      confirmar_contraseña: payload.confirmedPassword,
      num_identificacion: payload.documentNumber,
      id_tipoDoc: payload.documentType,
      fecha_nacimiento: payload.birthDate,
      acepta_terminos: true,
      id_ciudad: payload.cityId ?? 1,
    };

    const { data } = await api.post<{ message: string }>(
      "/tecnicos/registro",
      apiPayload,
    );
    return data;
  }

  const apiPayload: ClienteRegistroPayload = {
    nombre: payload.name,
    apellido: payload.lastName,
    correo_electronico: payload.email,
    telefono: payload.phone,
    contraseña: payload.password,
    confirmar_contraseña: payload.confirmedPassword,
    num_identificacion: payload.documentNumber,
    id_tipoDoc: payload.documentType,
    fecha_nacimiento: payload.birthDate,
    acepta_terminos: true,
    id_ciudad: payload.cityId,
  };

  const { data } = await api.post<{ message: string }>(
    "/clientes/registro",
    apiPayload,
  );
  return data;
}
