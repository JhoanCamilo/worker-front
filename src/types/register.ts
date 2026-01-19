export type RegisterRole = 2 | 3  //? 2 = Client, 3 = Technician

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
