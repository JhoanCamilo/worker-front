import { View, Text, Pressable } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  label: string
  value: Date | null
  onChange: (date: Date) => void
}

export function DateInput({ label, value, onChange }: Props) {
  const [show, setShow] = useState(false)

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ marginBottom: 6 }}>{label}</Text>

      <Pressable
        onPress={() => setShow(true)}
        style={{
          borderWidth: 1,
          borderColor: '#d1d5db',
          borderRadius: 8,
          paddingHorizontal: 12,
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff'
        }}
      >
        <Text>
          {value
            ? value.toLocaleDateString()
            : 'Selecciona una fecha'}
        </Text>

        <Ionicons name="calendar" size={18} color="#6b7280" />
      </Pressable>

      {show && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShow(false)
            if (selectedDate) onChange(selectedDate)
          }}
        />
      )}
    </View>
  )
}