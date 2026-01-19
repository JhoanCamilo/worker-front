import { View, Text, Pressable } from 'react-native'

interface Option<T> {
  label: string
  value: T
}

interface SelectProps<T> {
  label: string
  value: T | null
  options: Option<T>[]
  onChange: (value: T) => void
}

export function Select<T>({
  label,
  value,
  options,
  onChange,
}: SelectProps<T>) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          marginBottom: 6,
          fontSize: 14,
          fontWeight: '500',
        }}
      >
        {label}
      </Text>

      {options.map(option => {
        const selected = value === option.value

        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            style={{
              borderWidth: 1.5,
              borderColor: selected ? '#3b82f6' : '#d1d5db',
              borderRadius: 8,
              padding: 14,
              marginBottom: 10,
              backgroundColor: selected ? '#eff6ff' : '#fff',
            }}
          >
            <Text
              style={{
                color: selected ? '#1d4ed8' : '#111827',
                fontWeight: selected ? '600' : '400',
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}