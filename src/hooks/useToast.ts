import Toast from 'react-native-toast-message'

export function useToast() {
  const success = (message: string) =>
    Toast.show({
      type: 'success',
      text1: 'Éxito',
      text2: message,
    })

  const error = (message: string) =>
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: message,
    })

  const info = (message: string) =>
    Toast.show({
      type: 'info',
      text1: 'Información',
      text2: message,
    })

  return { success, error, info }
}