/**
 * HapticButton — AnimatedPressable with haptic feedback + press-scale spring.
 */
import React from 'react'
import { Pressable, ViewStyle, StyleProp } from 'react-native'
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable) as any

interface HapticButtonProps {
  onPress?: () => void
  onLongPress?: () => void
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
  disabled?: boolean
  impact?: 'light' | 'medium' | 'heavy' | 'none' | 'selection'
  scaleTo?: number
}

export default function HapticButton({
  onPress,
  onLongPress,
  style,
  children,
  disabled,
  impact = 'medium',
  scaleTo = 0.96,
}: HapticButtonProps) {
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(scaleTo, { damping: 20, stiffness: 400 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 350 })
  }

  const handlePress = () => {
    if (disabled) return
    try {
      if (impact === 'selection') {
        Haptics.selectionAsync()
      } else if (impact !== 'none') {
        const type =
          impact === 'light'  ? Haptics.ImpactFeedbackStyle.Light
          : impact === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Medium
        Haptics.impactAsync(type)
      }
    } catch {}
    onPress?.()
  }

  const handleLongPress = () => {
    if (disabled) return
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning) } catch {}
    onLongPress?.()
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      style={[style, animStyle, disabled && { opacity: 0.5 }]}
    >
      {children}
    </AnimatedPressable>
  )
}
