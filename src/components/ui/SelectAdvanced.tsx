import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'

export interface SelectOption {
  label: string
  value: number
}

interface Props {
  label: string
  placeholder?: string
  value: number | null
  options: SelectOption[]
  onChange: (value: number) => void
}

export function SelectAdvanced({
  label,
  placeholder = 'Seleccione...',
  value,
  options,
  onChange,
}: Props) {
  const [visible, setVisible] = useState(false)

  const selected = options.find(o => o.value === value)

  return (
    <>
      <Text style={{ marginBottom: 6 }}>{label}</Text>

      <Pressable
        onPress={() => setVisible(true)}
        style={{
          borderWidth: 1,
          borderColor: '#d1d5db',
          borderRadius: 8,
          paddingHorizontal: 12,
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fff',
          marginBottom: 14
        }}
      >
        <Text style={{ color: selected ? '#000' : '#9ca3af' }}>
          {selected?.label || placeholder}
        </Text>

        <Ionicons name="chevron-down" size={18} color="#6b7280" />
      </Pressable>

      {/* MODAL */}
      <Modal visible={visible} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
          }}
          onPress={() => setVisible(false)}
        >
          <View
            style={{
              marginHorizontal: 24,
              backgroundColor: '#fff',
              borderRadius: 12,
              maxHeight: '60%',
            }}
          >
            <FlatList
              data={options}
              keyExtractor={item => item.value.toString()}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value)
                    setVisible(false)
                  }}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#e5e7eb',
                  }}
                >
                  <Text>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  )
}