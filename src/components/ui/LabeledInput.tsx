import { View, Text, TextInput } from 'react-native'

interface Props {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  secureTextEntry?: boolean
}

export function LabeledInput({
  label,
  ...props
}: Props) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          marginBottom: 6,
          fontSize: 14,
          color: '#374151'
        }}
      >
        {label}
      </Text>

      <TextInput
        {...props}
        style={{
          borderWidth: 1,
          borderColor: '#d1d5db',
          borderRadius: 8,
          paddingHorizontal: 12,
          height: 44,
          backgroundColor: '#FFFFFF'
        }}
      />
    </View>
  )
}