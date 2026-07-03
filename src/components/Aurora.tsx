// ════════════════════════════════════════════════════════════════════
// AURORA reusable components (decorator mobile).
//   <AuroraBackground/> — full-bleed aurora gradient behind content.
//   <GradientView/>     — generic gradient surface (headers / hero tiles).
//   <GlassCard/>        — semi-transparent glass surface card.
//   <GradientButton/>   — primary CTA with an iridescent gradient fill.
// ════════════════════════════════════════════════════════════════════

import React from 'react'
import {
  View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, GestureResponderEvent,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { aurora, glass, glassStrong } from '../lib/theme'

type GradientTuple = readonly [string, string, ...string[]]

/** Full-bleed aurora gradient. Place as the first child of a flex:1 container. */
export function AuroraBackground({
  variant = 'bg',
  style,
}: {
  variant?: 'bg' | 'bgPeach' | 'bgBlush'
  style?: StyleProp<ViewStyle>
}) {
  const colors: GradientTuple =
    variant === 'bgPeach' ? aurora.bgPeach : variant === 'bgBlush' ? aurora.bgBlush : aurora.bg
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents="none"
    />
  )
}

/** Generic gradient surface (used for headers / hero tiles). */
export function GradientView({
  colors = aurora.header,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
  children,
}: {
  colors?: GradientTuple
  start?: { x: number; y: number }
  end?: { x: number; y: number }
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}) {
  return (
    <LinearGradient colors={colors} start={start} end={end} style={style}>
      {children}
    </LinearGradient>
  )
}

/** Glass card surface. */
export function GlassCard({
  children,
  style,
  strong,
}: {
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
  strong?: boolean
}) {
  return <View style={[strong ? glassStrong : glass, style]}>{children}</View>
}

/** Primary CTA with an iridescent gradient fill. */
export function GradientButton({
  children,
  onPress,
  disabled,
  style,
  colors = aurora.primary,
  activeOpacity = 0.9,
}: {
  children?: React.ReactNode
  onPress?: (e: GestureResponderEvent) => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  colors?: GradientTuple
  activeOpacity?: number
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
      style={[styles.btnBase, { opacity: disabled ? 0.55 : 1 }, style]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btnBase: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
})
