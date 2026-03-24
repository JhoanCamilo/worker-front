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
  role?: number
  cityId?: number | null
}

// ── Validadores individuales ──────────────────────────────────────────────────

export function validateName(name: string): string | null {
  if (!name.trim()) return 'El nombre es obligatorio'
  if (/\d/.test(name)) return 'El nombre no puede contener números'
  return null
}

export function validateLastName(lastName: string): string | null {
  if (!lastName.trim()) return 'El apellido es obligatorio'
  if (/\d/.test(lastName)) return 'El apellido no puede contener números'
  return null
}

export function validateDocumentNumber(doc: string): string | null {
  if (!doc.trim()) return 'El documento de identidad es obligatorio'
  if (!/^\d{6,12}$/.test(doc)) return 'La cédula debe tener entre 6 y 12 dígitos'
  return null
}

export function validatePhone(phone: string): string | null {
  if (!phone.trim()) return 'El número de teléfono es obligatorio'
  if (!/^\d+$/.test(phone)) return 'El teléfono solo debe contener dígitos'
  if (phone.length < 10) return 'El teléfono debe tener mínimo 10 dígitos'
  return null
}

export interface PasswordChecks {
  minLength: boolean
  hasUppercase: boolean
  hasNumber: boolean
  hasSpecial: boolean
}

export function checkPassword(password: string): PasswordChecks {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/.test(password),
  }
}

export function validatePassword(password: string): string | null {
  if (!password) return 'La contraseña es obligatoria'
  const c = checkPassword(password)
  if (!c.minLength) return 'La contraseña debe tener al menos 8 caracteres'
  if (!c.hasUppercase) return 'Debe contener al menos una mayúscula'
  if (!c.hasNumber) return 'Debe contener al menos un número'
  if (!c.hasSpecial) return 'Debe contener al menos un carácter especial'
  return null
}

// ── Validación completa del formulario ────────────────────────────────────────

export function validateRegisterForm(data: RegisterFormData): string | null {
  const nameErr = validateName(data.name)
  if (nameErr) return nameErr

  const lastNameErr = validateLastName(data.lastName)
  if (lastNameErr) return lastNameErr

  if (!data.documentType) return 'Seleccione un tipo de documento'

  const docErr = validateDocumentNumber(data.documentNumber)
  if (docErr) return docErr

  const phoneErr = validatePhone(data.phone)
  if (phoneErr) return phoneErr

  if (!data.email.trim()) return 'El correo electrónico es obligatorio'
  if (!/^\S+@\S+\.\S+$/.test(data.email)) return 'El correo electrónico no es válido'

  if (!data.birthDate) return 'La fecha de nacimiento es obligatoria'

  const passErr = validatePassword(data.password)
  if (passErr) return passErr

  if (!data.confirmedPassword) return 'Confirme la contraseña'
  if (data.password !== data.confirmedPassword) return 'Las contraseñas no coinciden'

  if (!data.cityId) return 'Seleccione una ciudad'

  return null
}
