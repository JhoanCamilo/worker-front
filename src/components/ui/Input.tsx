import { View, TextInput, TextInputProps, Pressable, Text } from 'react-native'
import { useState } from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';

interface InputProps extends Omit<TextInputProps, 'style'> {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  secureTextEntry?: boolean
}

export function Input({
  secureTextEntry,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = secureTextEntry

  return (
    <View
      style={{
        borderWidth: 1.5,
        borderColor: '#8f8f8f',
        borderRadius: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
      }}
    >
      <TextInput
        placeholderTextColor="#6b7280"
        {...props}
        secureTextEntry={isPassword && !showPassword}
        style={{
          flex: 1,
          height: 44,
          color: '#111827',
        }}
      />

      {isPassword && (
        <Pressable onPress={() => setShowPassword(!showPassword)}>
          <Text style={{ color: '#3b82f6', fontWeight: '500' }}>
            {showPassword ? <AntDesign name="eye-invisible" size={24} color='#3b82f6' /> : <AntDesign name="eye" size={24} color='#3b82f6' />}
          </Text>
        </Pressable>
      )}
    </View>
  )
}
