import { Pressable, Text, TextStyle, ViewStyle } from 'react-native'
import { ReactNode } from 'react'

interface ButtonProps {
  title: string | ReactNode
  onPress: () => void
  type?: 'primary' | 'secondary'
  disabled?: boolean
  customStyle?: ViewStyle
  customTextStyles?: TextStyle
}

export function Button({
  title,
  onPress,
  type = 'primary',
  disabled = false,
  customStyle,
  customTextStyles
}: ButtonProps) {
  const isPrimary = type === 'primary'

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          backgroundColor: isPrimary ? '#3b82f6' : 'transparent',
          borderWidth: isPrimary ? 0 : 1.5,
          borderColor: '#3b82f6',
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          opacity: disabled ? 0.7 : 1,
        },
        customStyle,
      ]}
    >
      {typeof title === 'string' ? (
        <Text
          style={[
            {
              color: isPrimary ? '#fff' : '#3b82f6',
              fontWeight: '600',
            },
            customTextStyles
          ]}>
          {title}
        </Text>
      ) : (
        title
      )}
    </Pressable>
  )
}