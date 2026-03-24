import { View, Text, TextInput, TextInputProps } from 'react-native'

interface Props extends TextInputProps {
  label: string
  error?: string | null
}

export function LabeledInput({ label, error, ...props }: Props) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ marginBottom: 6, fontSize: 14, color: '#374151' }}>
        {label}
      </Text>

      <TextInput
        placeholderTextColor="#9ca3af"
        {...props}
        style={{
          borderWidth: 1,
          borderColor: error ? '#f13d3d' : '#d1d5db',
          borderRadius: 8,
          paddingHorizontal: 12,
          height: 44,
          backgroundColor: '#FFFFFF',
          color: '#111827',
        }}
      />

      {error ? (
        <Text style={{ marginTop: 4, fontSize: 12, color: '#f13d3d' }}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}
