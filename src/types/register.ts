export type RegisterRole = 2 | 3  //? 2 = Technician, 3 = Client

export interface RegisterPayload {
  role: RegisterRole

  //? Personal data
  name: string
  documentType: number
  documentNumber: string
  phone: string
  email: string
  birthDate: string

  //? Security
  password: string
}
