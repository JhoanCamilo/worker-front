import { Alert } from 'react-native'

export function useAlert() {
  const success = (message: string) =>
    Alert.alert('Éxito', message)

  const error = (message: string) =>
    Alert.alert('Error', message)

  const info = (message: string) =>
    Alert.alert('Información', message)

  return { success, error, info }
}