import React, { useEffect } from 'react'
import { Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApp } from '../context/AppContext'

const TOAST_CONFIG = {
  success: { bg: '#16a34a', border: '#22c55e', icon: '✅' },
  error:   { bg: '#dc2626', border: '#ef4444', icon: '❌' },
  info:    { bg: '#6366f1', border: '#818cf8', icon: 'ℹ️'  },
}

export default function Toast() {
  const { toast } = useApp()
  const insets = useSafeAreaInsets()
  const translateY = useSharedValue(-120)
  const opacity    = useSharedValue(0)

  useEffect(() => {
    if (toast) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 280 })
      opacity.value    = withTiming(1, { duration: 200 })
    } else {
      translateY.value = withTiming(-120, { duration: 300 })
      opacity.value    = withTiming(0, { duration: 300 })
    }
  }, [toast])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity:   opacity.value,
  }))

  if (!toast && opacity.value === 0) return null

  const cfg = TOAST_CONFIG[toast?.type as keyof typeof TOAST_CONFIG] || TOAST_CONFIG.info

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 12, backgroundColor: cfg.bg, borderColor: cfg.border },
        animStyle,
      ]}>
      <Text style={styles.icon}>{cfg.icon}</Text>
      <Text style={styles.text} numberOfLines={3}>{toast?.msg}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', left: 16, right: 16, zIndex: 9999,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, paddingVertical: 13, paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 12,
  },
  icon: { fontSize: 18 },
  text: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 14, lineHeight: 20 },
})
