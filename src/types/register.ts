export type RegisterRole = 2 | 3  //? 2 = Technician, 3 = Client

/** Payload interno de la app (campos en inglés) */
export interface RegisterPayload {
  role: RegisterRole

  //? Personal data
  name: string
  lastName: string
  documentType: number
  documentNumber: string
  phone: string
  email: string
  birthDate: string

  //? Security
  password: string
  confirmedPassword: string

  cityId: number
}

/** Contrato exacto de POST /clientes/registro */
export interface ClienteRegistroPayload {
  nombre: string
  apellido: string
  correo_electronico: string
  telefono: string
  contraseña: string
  confirmar_contraseña: string
  num_identificacion: string
  id_tipoDoc: number
  fecha_nacimiento: string
  acepta_terminos: boolean
  id_ciudad: number
}

/** Contrato exacto de POST /tecnicos/registro */
export interface TecnicoRegistroPayload {
  nombre: string
  apellido: string
  correo_electronico: string
  telefono: string
  contraseña: string
  confirmar_contraseña: string
  num_identificacion: string
  id_tipoDoc: number
  fecha_nacimiento: string
  acepta_terminos: boolean
  id_ciudad: number
}
