import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useState } from 'react'
import { useToast } from '@/src/hooks/useToast'
import { Input } from '@/src/components/ui/Input'
import { Button } from '@/src/components/ui/Button'
import { useLogin } from '@/src/features/auth/auth.hooks'
import Logo from '@/assets/images/favicon.png'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'

const version = Constants.expoConfig?.version

export default function LoginScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { handleLogin } = useLogin()
  const { success, error } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = async () => {
    if (!email || !password) {
      error('Completa todos los campos')
      return
    }

    try {
      setLoading(true)
      await handleLogin(email, password)
      success('Bienvenido 👋')
    } catch (err: any) {
      error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Image
            source={Logo}
            style={{ width: 500, height: 160, resizeMode: 'contain' }}
          />
        </View>

        {/* Inputs */}
        <Input
          placeholder="Usuario"
          value={email}
          onChangeText={setEmail}
        />

        <Input
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Botones */}
        <Button
          title="Iniciar Sesión"
          onPress={onSubmit}
          type="primary"
          disabled={loading}
        />

        <Button
          title="Registrate"
          onPress={() => router.push('/(auth)/register-type')}
          type="secondary"
        />

        {/* Forgot */}
        <Text
          style={{
            textAlign: 'center',
            color: '#2563eb',
            marginTop: 8,
            textDecorationLine: 'underline',
          }}
        >
          Olvidé mi contraseña
        </Text>

        {/* Version */}
        <Text
          style={{
            textAlign: 'center',
            marginTop: 40,
            fontSize: 12,
            color: '#6b7280',
          }}
        >
          Versión {version}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}