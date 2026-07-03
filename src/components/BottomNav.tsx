import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeArea } from '../lib/useSafeArea'
import { navigationRef } from '../navigation'

type Tab = 'Home' | 'Calendar' | 'Earnings' | 'Profile'

const ITEMS = [
  { icon: '🏠', label: 'Dashboard', screen: 'Home'     as const },
  { icon: '📅', label: 'Calendar',  screen: 'Calendar' as const },
  { icon: '💰', label: 'Earnings',  screen: 'Earnings' as const },
  { icon: '👤', label: 'Profile',   screen: 'Profile'  as const },
] as const

interface BottomNavProps {
  active: Tab
  pendingBadge?: number
}

export default function BottomNav({ active, pendingBadge = 0 }: BottomNavProps) {
  const { navBottom } = useSafeArea()

  // reset() for instant, lag-free tab switching — stack stays [Home] or [Home, Screen].
  const goTo = (screen: Tab) => {
    if (screen === active) return
    if (screen === 'Home') {
      navigationRef.current?.reset({ index: 0, routes: [{ name: 'Home' }] })
    } else {
      navigationRef.current?.reset({ index: 1, routes: [{ name: 'Home' }, { name: screen }] })
    }
  }

  return (
    <View style={[styles.container, { paddingBottom: navBottom + 4 }]}>
      <View style={styles.nav}>
        {ITEMS.map(item => {
          const isActive = item.screen === active
          const badge = item.screen === 'Home' ? pendingBadge : 0
          return (
            <TouchableOpacity key={item.screen} style={styles.item} onPress={() => goTo(item.screen)} activeOpacity={0.8}>
              <View style={[styles.pill, isActive && styles.pillActive]}>
                <View style={{ position: 'relative' }}>
                  <Text style={[styles.icon, isActive && styles.iconActive]}>{item.icon}</Text>
                  {badge > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#c2185b',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 16,
  },
  nav: { flexDirection: 'row', paddingTop: 8 },
  item: { flex: 1, alignItems: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  pillActive: { backgroundColor: '#fdf2f8' },
  icon: { fontSize: 18 },
  iconActive: { fontSize: 20 },
  label: { fontSize: 10, color: '#b0b0b0', fontWeight: '600' },
  labelActive: { color: '#ec4899', fontWeight: '800' },
  badge: { position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },
})
