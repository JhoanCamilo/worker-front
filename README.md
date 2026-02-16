# Frontend Mobile

Aplicacion mobile construida con **Expo SDK 54**, **React Native** y **TypeScript**. Utiliza **Expo Router** para navegacion basada en archivos y **Zustand** para manejo de estado global.

---

## Inicio rapido

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor de desarrollo
npx expo start
```

Opciones para ejecutar la app:

- **Android**: `npm run android`
- **iOS**: `npm run ios`
- **Web**: `npm run web`

---

## Variables de entorno

Archivo `.env` en la raiz del proyecto:

| Variable                   | Descripcion                                                                            | Ejemplo                     |
| -------------------------- | -------------------------------------------------------------------------------------- | --------------------------- |
| `EXPO_PUBLIC_USE_MOCK_API` | Si es `true`, los servicios usan mocks locales. Si es `false`, llaman al backend real. | `true`                      |
| `EXPO_PUBLIC_API_URL`      | URL base del backend (solo se usa cuando `USE_MOCK_API=false`).                        | `https://api.workerapp.com` |

---

## Estructura del proyecto

```
worker-front/
├── app/                          # Pantallas (Expo Router file-based routing)
│   ├── _layout.tsx               # Root layout: ejecuta useAuthGuard
│   ├── index.tsx                  # Redirect inicial (login o home)
│   ├── (auth)/                   # Grupo: flujo de autenticacion
│   │   ├── _layout.tsx           # Stack + Toast provider
│   │   ├── login.tsx             # Pantalla de login
│   │   ├── register-type.tsx     # Paso 1: seleccion de rol
│   │   ├── register-form.tsx     # Paso 2: datos personales
│   │   └── terms_cond.tsx        # Paso 3: terminos y condiciones
│   ├── (flows)/                  # Grupo: flujos intermedios
│   │   ├── _layout.tsx           # Stack sin header
│   │   └── verification_code.tsx # Verificacion de codigo (tecnicos pendientes)
│   └── (tabs)/                   # Grupo: app principal con tab bar
│       ├── _layout.tsx           # Tab bar (Home, Solicitudes, Perfil)
│       ├── home.tsx              # Pantalla de inicio
│       ├── profile.tsx           # Perfil (pendiente de implementar)
│       └── request.tsx           # Solicitudes (pendiente de implementar)
├── src/
│   ├── components/ui/            # Componentes reutilizables de UI
│   ├── constants/                # Tema y constantes globales
│   ├── hooks/                    # Custom hooks
│   ├── mocks/                    # Datos mock para desarrollo
│   ├── services/                 # Capa de servicios (API + mocks)
│   ├── store/                    # Zustand stores (estado global)
│   ├── types/                    # Interfaces y tipos TypeScript
│   └── utils/                    # Funciones utilitarias
├── assets/                       # Imagenes, fuentes, etc.
├── .env                          # Variables de entorno
└── app.json                      # Configuracion de Expo
```

---

## Navegacion y routing

La app usa **Expo Router** con navegacion basada en archivos. Las rutas se organizan en 3 grupos:

### Grupos de rutas

| Grupo     | Proposito                         | Navigator |
| --------- | --------------------------------- | --------- |
| `(auth)`  | Login y registro                  | `Stack`   |
| `(flows)` | Flujos intermedios (verificacion) | `Stack`   |
| `(tabs)`  | App principal post-login          | `Tabs`    |

### Flujo de navegacion

```
App inicia
  └── index.tsx: Redirect segun token
        ├── Sin token → /(auth)/login
        └── Con token → /(tabs)/home

Login exitoso
  └── useAuthGuard detecta token
        ├── Tecnico pendiente → /(flows)/verification_code
        └── Usuario normal → /(tabs)/home

Registro
  └── register-type → register-form → terms_cond → login
```

### Auth Guard

El hook `useAuthGuard` (ejecutado en `app/_layout.tsx`) protege todas las rutas automaticamente:

1. **Sin token**: redirige a `/login`
2. **Tecnico con estado `pending_review`**: redirige a `/verification_code`
3. **Usuario autenticado**: redirige a `/home`

### Metodos de navegacion

| Necesidad                  | Metodo                |
| -------------------------- | --------------------- |
| Volver una pantalla        | `router.back()`       |
| Flujo normal (push)        | `router.push()`       |
| Reemplazar pantalla actual | `router.replace()`    |
| Salir de un flujo completo | `router.dismissAll()` |

---

## Capa de servicios

Todos los servicios viven en `src/services/` y siguen el mismo patron:

```
src/services/
├── api.ts                # Instancia de Axios (baseURL, interceptors)
├── auth.service.ts       # login(payload) → mock o API
├── auth.mock.ts          # Mock de login con datos locales
├── register.service.ts   # register(payload) → mock o API
└── register.mock.ts      # Mock de registro
```

### Como funciona el switch mock/API

Cada servicio checa la variable de entorno `EXPO_PUBLIC_USE_MOCK_API`:

```typescript
// src/services/auth.service.ts
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_API === "true";

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  if (USE_MOCK) {
    return mockLogin(payload); // Datos locales
  }
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data; // Backend real
}
```

El mismo patron aplica para `register.service.ts`.

### Instancia de Axios (`api.ts`)

- **Base URL**: lee de `EXPO_PUBLIC_API_URL`
- **Timeout**: 10 segundos
- **Request interceptor**: adjunta `Authorization: Bearer {token}` automaticamente desde el auth store
- **Response interceptor**: loguea errores con `console.error`

### Usuarios mock disponibles

| Email              | Password | Rol     | Estado           |
| ------------------ | -------- | ------- | ---------------- |
| `tech@pending.com` | `123456` | Tecnico | `pending_review` |
| `tech@active.com`  | `123456` | Tecnico | `active`         |
| `client@test.com`  | `123456` | Cliente | —                |

### Agregar un nuevo servicio

Para agregar un endpoint nuevo (ejemplo: `orders`):

1. Crear `src/services/orders.mock.ts` con datos de prueba
2. Crear `src/services/orders.service.ts` con el switch mock/API
3. Consumir desde un hook o store

---

## Estado global (Zustand)

### `useAuthStore` — `src/store/auth.store.ts`

Maneja autenticacion y sesion del usuario.

| Propiedad        | Tipo                                  | Descripcion                         |
| ---------------- | ------------------------------------- | ----------------------------------- |
| `token`          | `string \| null`                      | JWT del usuario autenticado         |
| `user`           | `AuthUser \| null`                    | Datos del usuario                   |
| `loading`        | `boolean`                             | Estado de carga durante login       |
| `login(payload)` | `(LoginPayload) => Promise<AuthUser>` | Ejecuta login y guarda token + user |
| `logout()`       | `() => void`                          | Limpia token y user                 |

**Persistencia**: usa `zustand/middleware/persist` con `AsyncStorage`. Los campos `token` y `user` sobreviven reinicios de la app. El campo `loading` NO se persiste.

### `useRegisterStore` — `src/store/register.store.ts`

Acumula datos del formulario de registro a traves de multiples pantallas.

| Propiedad               | Tipo                                 | Descripcion                   |
| ----------------------- | ------------------------------------ | ----------------------------- |
| `payload`               | `Partial<RegisterPayload>`           | Datos acumulados del registro |
| `setRole(role)`         | `(RegisterRole) => void`             | Guarda el rol seleccionado    |
| `setPersonalData(data)` | `(Partial<RegisterPayload>) => void` | Guarda datos personales       |
| `clear()`               | `() => void`                         | Limpia todo el payload        |

**Sin persistencia**: los datos se pierden si el usuario cierra la app durante el registro (comportamiento intencional).

---

## Custom hooks

### `useAuthGuard` — `src/hooks/useAuthGuard.ts`

Proteccion de rutas basada en el estado de autenticacion. Se ejecuta en `app/_layout.tsx`.

```typescript
// Uso (solo en _layout.tsx)
useAuthGuard();
```

**Cuando usar**: exclusivamente en el root layout. No llamar en pantallas individuales.

**Que hace**:

- Espera a que el layout este montado
- Observa cambios en `token`, `user` y `segments`
- Redirige automaticamente segun las reglas de auth

---

### `useLogin` — `src/hooks/useLogin.ts`

Abstrae la logica de login sobre el auth store.

```typescript
const { handleLogin, loading } = useLogin();

await handleLogin("email@test.com", "123456");
```

| Retorno                        | Tipo                                    | Descripcion                               |
| ------------------------------ | --------------------------------------- | ----------------------------------------- |
| `handleLogin(email, password)` | `(string, string) => Promise<AuthUser>` | Ejecuta login, lanza error si falla       |
| `loading`                      | `boolean`                               | `true` mientras el login esta en progreso |

**Cuando usar**: en la pantalla de login. Evita que el componente acceda directamente al store.

---

### `useRegisterForm` — `src/hooks/useRegisterForm.ts`

Encapsula todo el estado y logica del formulario de registro (8 campos, validacion, navegacion).

```typescript
const { fields, onNext } = useRegisterForm();

// En el JSX:
<LabeledInput value={fields.name} onChangeText={fields.setName} />
<Button onPress={onNext} />
```

| Retorno  | Tipo                         | Descripcion                                                                 |
| -------- | ---------------------------- | --------------------------------------------------------------------------- |
| `fields` | Objeto con valores y setters | Contiene `name`, `setName`, `documentType`, `setDocumentType`, etc.         |
| `onNext` | `() => void`                 | Valida el formulario, guarda datos en el register store y navega a terminos |

**Campos en `fields`**:

- `name` / `setName`
- `documentType` / `setDocumentType`
- `documentNumber` / `setDocumentNumber`
- `phone` / `setPhone`
- `email` / `setEmail`
- `birthDate` / `setBirthDate`
- `password` / `setPassword`
- `confirmedPassword` / `setConfirmedPassword`

**Cuando usar**: en `register-form.tsx`. Mantiene la pantalla como componente puramente de UI.

---

### `useToast` — `src/hooks/useToast.ts`

Wrapper sobre `react-native-toast-message` con metodos simplificados.

```typescript
const { success, error, info } = useToast();

success("Operacion exitosa");
error("Algo salio mal");
info("Dato informativo");
```

| Metodo             | Parametro | Descripcion                         |
| ------------------ | --------- | ----------------------------------- |
| `success(message)` | `string`  | Toast verde con titulo "Exito"      |
| `error(message)`   | `string`  | Toast rojo con titulo "Error"       |
| `info(message)`    | `string`  | Toast azul con titulo "Informacion" |

**Cuando usar**: en cualquier pantalla que necesite notificar al usuario. El componente `<Toast />` esta montado en `(auth)/_layout.tsx`.

---

## Componentes UI

Todos los componentes viven en `src/components/ui/`. Son presentacionales (sin logica de negocio).

### `Button`

Boton con variantes primary/secondary.

```tsx
<Button title="Enviar" onPress={handleSubmit} type="primary" />
<Button title="Cancelar" onPress={handleCancel} type="secondary" disabled={loading} />
```

| Prop               | Tipo                       | Default     | Descripcion                                                          |
| ------------------ | -------------------------- | ----------- | -------------------------------------------------------------------- |
| `title`            | `string \| ReactNode`      | requerido   | Texto o JSX del boton                                                |
| `onPress`          | `() => void`               | requerido   | Callback al presionar                                                |
| `type`             | `'primary' \| 'secondary'` | `'primary'` | Primary: fondo azul. Secondary: borde azul, fondo transparente       |
| `disabled`         | `boolean`                  | `false`     | Deshabilita el boton (opacidad 0.7)                                  |
| `customStyle`      | `ViewStyle`                | —           | Override de estilos del contenedor                                   |
| `customTextStyles` | `TextStyle`                | —           | Override de estilos del texto (solo aplica cuando `title` es string) |

**Nota**: cuando `title` es `ReactNode`, el componente renderiza el JSX directamente sin aplicar estilos de texto internos.

---

### `Input`

Input de texto con soporte integrado para mostrar/ocultar contrasena.

```tsx
<Input placeholder="Email" value={email} onChangeText={setEmail} />
<Input placeholder="Contrasena" value={password} onChangeText={setPassword} secureTextEntry />
```

| Prop              | Tipo                     | Default   | Descripcion                                      |
| ----------------- | ------------------------ | --------- | ------------------------------------------------ |
| `value`           | `string`                 | requerido | Valor del input                                  |
| `onChangeText`    | `(text: string) => void` | requerido | Callback al cambiar texto                        |
| `placeholder`     | `string`                 | —         | Texto placeholder                                |
| `secureTextEntry` | `boolean`                | `false`   | Activa modo contrasena con toggle de visibilidad |

**Cuando usar**: en formularios simples (login). Para formularios con label, usar `LabeledInput`. Para campos de contrasena en formularios de registro, usar `PasswordInput`.

---

### `LabeledInput`

Input de texto con label superior. Usa `TextInput` nativo directamente.

```tsx
<LabeledInput label="Nombre completo" value={name} onChangeText={setName} />
```

| Prop              | Tipo                     | Default   | Descripcion                         |
| ----------------- | ------------------------ | --------- | ----------------------------------- |
| `label`           | `string`                 | requerido | Texto del label                     |
| `value`           | `string`                 | requerido | Valor del input                     |
| `onChangeText`    | `(text: string) => void` | requerido | Callback al cambiar texto           |
| `placeholder`     | `string`                 | —         | Texto placeholder                   |
| `secureTextEntry` | `boolean`                | `false`   | Modo contrasena (sin toggle visual) |

**Cuando usar**: en formularios de registro y edicion donde cada campo necesita un label visible.

---

### `PasswordInput`

Input especializado para contrasenas con icono de ojo para toggle de visibilidad.

```tsx
<PasswordInput
  placeholder="Contrasena"
  value={password}
  onChangeText={setPassword}
/>
```

| Prop           | Tipo                     | Default   | Descripcion               |
| -------------- | ------------------------ | --------- | ------------------------- |
| `value`        | `string`                 | requerido | Valor del input           |
| `onChangeText` | `(text: string) => void` | requerido | Callback al cambiar texto |
| `placeholder`  | `string`                 | —         | Texto placeholder         |

**Cuando usar**: en secciones de contrasena del formulario de registro. Usa iconos `Ionicons` (eye/eye-off).

---

### `Select<T>`

Selector tipo radio-card con tipado generico.

```tsx
<Select<number>
  label="Tipo de perfil"
  value={profileType}
  onChange={setProfileType}
  options={[
    { label: "Tecnico", value: 2 },
    { label: "Cliente", value: 3 },
  ]}
/>
```

| Prop       | Tipo                            | Default   | Descripcion             |
| ---------- | ------------------------------- | --------- | ----------------------- |
| `label`    | `string`                        | requerido | Titulo del selector     |
| `value`    | `T \| null`                     | requerido | Valor seleccionado      |
| `options`  | `{ label: string, value: T }[]` | requerido | Opciones disponibles    |
| `onChange` | `(value: T) => void`            | requerido | Callback al seleccionar |

**Cuando usar**: cuando hay 2-4 opciones y se quieren mostrar todas visibles como tarjetas. Para listas largas, usar `SelectAdvanced`.

---

### `SelectAdvanced`

Dropdown con modal y FlatList para listas largas.

```tsx
<SelectAdvanced
  label="Tipo de documento"
  value={documentType}
  onChange={setDocumentType}
  options={[
    { label: "Cedula de ciudadania", value: 1 },
    { label: "Pasaporte", value: 3 },
  ]}
/>
```

| Prop          | Tipo                                 | Default           | Descripcion                   |
| ------------- | ------------------------------------ | ----------------- | ----------------------------- |
| `label`       | `string`                             | requerido         | Titulo del selector           |
| `value`       | `number \| null`                     | requerido         | Valor seleccionado            |
| `options`     | `{ label: string, value: number }[]` | requerido         | Opciones disponibles          |
| `onChange`    | `(value: number) => void`            | requerido         | Callback al seleccionar       |
| `placeholder` | `string`                             | `'Seleccione...'` | Texto cuando no hay seleccion |

**Nota**: a diferencia de `Select<T>`, este componente solo acepta `number` como tipo de valor.

**Cuando usar**: para listas de 4+ opciones que no deben ocupar espacio visual permanente.

---

### `DateInput`

Selector de fecha que usa el DateTimePicker nativo del sistema.

```tsx
<DateInput
  label="Fecha de nacimiento"
  value={birthDate}
  onChange={setBirthDate}
/>
```

| Prop       | Tipo                   | Default   | Descripcion                   |
| ---------- | ---------------------- | --------- | ----------------------------- |
| `label`    | `string`               | requerido | Titulo del campo              |
| `value`    | `Date \| null`         | requerido | Fecha seleccionada            |
| `onChange` | `(date: Date) => void` | requerido | Callback al seleccionar fecha |

**Cuando usar**: en cualquier formulario que requiera seleccion de fecha.

---

## Tipos

### `src/types/auth.types.ts`

```typescript
interface LoginPayload {
  email: string;
  password: string;
}

enum UserRole {
  TECH = 2,
  CLIENT = 3,
}
enum TechStatus {
  PENDING = "pending_review",
  ACTIVE = "active",
}

interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  state?: TechStatus;
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
```

### `src/types/register.ts`

```typescript
type RegisterRole = 2 | 3; // 2 = Technician, 3 = Client

interface RegisterPayload {
  role: RegisterRole;
  name: string;
  documentType: number;
  documentNumber: string;
  phone: string;
  email: string;
  birthDate: string; // formato ISO: "YYYY-MM-DD"
  password: string;
}
```

---

## Utilidades

### `formatDateToISO(date: Date): string` — `src/utils/formaters.ts`

Convierte un objeto `Date` a string en formato `"YYYY-MM-DD"`.

### `validateRegisterForm(data): string | null` — `src/utils/validators.ts`

Valida todos los campos del formulario de registro. Retorna un mensaje de error si hay un campo invalido, o `null` si todo es correcto.

Validaciones aplicadas:

- Todos los campos son obligatorios
- Telefono: solo digitos, 7-15 caracteres
- Email: formato basico `x@x.x`
- Contrasena y confirmacion deben coincidir

---

## Constantes — `src/constants/theme.ts`

Define colores para modo claro/oscuro y familias de fuentes por plataforma. **Nota**: actualmente no esta siendo consumido por los componentes (los estilos usan colores hardcodeados). Pendiente de integracion en proxima iteracion.

---

## Stack tecnologico

| Tecnologia                 | Version | Proposito               |
| -------------------------- | ------- | ----------------------- |
| Expo                       | 54.0    | Framework de desarrollo |
| React Native               | 0.81.5  | UI nativa               |
| TypeScript                 | 5.9     | Tipado estatico         |
| Expo Router                | 6.0     | Navegacion file-based   |
| Zustand                    | 5.0     | Estado global           |
| Axios                      | 1.13    | Cliente HTTP            |
| AsyncStorage               | 2.2     | Persistencia local      |
| react-native-toast-message | 2.3     | Notificaciones toast    |
