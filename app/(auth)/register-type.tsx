import { View, Text } from 'react-native'
import { useState } from 'react'
import { Select } from '@/src/components/ui/Select'
import { Button } from '@/src/components/ui/Button'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useToast } from '@/src/hooks/useToast'
import { useRegisterStore } from '@/src/store/register.store'
import { RegisterRole } from '@/src/types/register'

export default function RegisterTypeScreen() {
  const router = useRouter()
  const { error } = useToast()

  const [profileType, setProfileType] = useState<RegisterRole | null>(null)

  const onNext = () => {
    if (!profileType) {
      error('Seleccione un tipo de perfil')
      return
    }

    useRegisterStore.getState().setRole(profileType)
    router.push('/(auth)/register-form')
  }

  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        justifyContent: 'center',
      }}
    >
      {/* Título */}
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          marginBottom: 32,
          textAlign: 'center',
        }}
      >
        Seleccione el tipo de perfil con el que desea registrarse
      </Text>

      {/* Select */}
      <Select
        label="Tipo perfil"
        value={profileType}
        onChange={setProfileType}
        options={[
          { label: 'Técnico', value: 2 },
          { label: 'Cliente', value: 3 },
        ]}
      />

      {/* Botón */}
      <Button
        title={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#000', fontWeight: '600' }}>
              Siguiente
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color="#000"
              style={{ marginLeft: 8 }}
            />
          </View>
        }
        onPress={onNext}
        type="primary"
        customStyle={{
          backgroundColor: '#f2c70f',
        }}
      />
    </View>
  )
}
