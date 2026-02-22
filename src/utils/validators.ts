export interface RegisterFormData {
  name: string
  lastName: string
  documentType: number | null
  documentNumber: string
  phone: string
  email: string
  birthDate: Date | null
  password: string
  confirmedPassword: string
}

export function validateRegisterForm(data: RegisterFormData): string | null {
  if (!data.name.trim()) return 'El nombre es obligatorio'

  if (!data.lastName.trim()) return 'El apellido es obligatorio'

  if (!data.documentType)
    return 'Seleccione un tipo de documento'

  if (!data.documentNumber.trim())
    return 'El documento de identidad es obligatorio'

  if (!data.phone.trim())
    return 'El número de teléfono es obligatorio'

  if (!/^\d{7,15}$/.test(data.phone))
    return 'El número de teléfono no es válido'

  if (!data.email.trim())
    return 'El correo electrónico es obligatorio'

  if (!/^\S+@\S+\.\S+$/.test(data.email))
    return 'El correo electrónico no es válido'

  if (!data.birthDate)
    return 'La fecha de nacimiento es obligatoria'

  if (!data.password)
    return 'La contraseña es obligatoria'

  if (!data.confirmedPassword)
    return 'Confirme la contraseña'

  if (data.password !== data.confirmedPassword)
    return 'Las contraseñas no coinciden'

  return null
}
