import { View, TextInput, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'

interface Props {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
}

export function PasswordInput({
  value,
  onChangeText,
  placeholder,
}: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#fff',
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={!visible}
        style={{ flex: 1 }}
      />

      <Pressable onPress={() => setVisible(!visible)}>
        <Ionicons
          name={visible ? 'eye-off' : 'eye'}
          size={20}
          color="#6b7280"
        />
      </Pressable>
    </View>
  )
}