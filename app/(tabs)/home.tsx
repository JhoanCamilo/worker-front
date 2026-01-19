import { View, Text } from 'react-native'
import { useAuthStore } from '@/src/store/auth.store'

export default function HomeScreen() {
  const user = useAuthStore(state => state.user)

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 20 }}>
        Bienvenido {user?.name}
      </Text>
    </View>
  )
}
