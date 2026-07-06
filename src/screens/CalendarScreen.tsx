import React from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native'
import { useApp } from '../context/AppContext'
import { aurora, fonts } from '../lib/theme'
import { AuroraBackground } from '../components/Aurora'
import BottomNav from '../components/BottomNav'
import Toast from '../components/Toast'
import { useSafeArea } from '../lib/useSafeArea'
import { rs, shortId, toCollect, slotWindow } from '../lib/utils'

function statusColor(s: string) {
  return s === 'delivered' ? { bg: '#dcfce7', text: '#16a34a' } : { bg: '#fce7f3', text: '#db2777' }
}
function shiftMonth(month: string, delta: number) {
  const d = new Date(month + '-01')
  d.setMonth(d.getMonth() + delta)
  return d.toISOString().slice(0, 7)
}

export default function CalendarScreen() {
  const { calendarData, calMonth, setCalMonth, openOrderDetail } = useApp()
  const { headerTop } = useSafeArea()

  const calOrders: any[] = calendarData?.orders || []
  const grouped: Record<string, any[]> = {}
  calOrders.forEach((o) => {
    const d = o.delivery_slot?.date
    if (d) (grouped[d] = grouped[d] || []).push(o)
  })
  const sortedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b))

  const monthLabel = new Date(calMonth + '-01').toLocaleDateString('en', { month: 'long', year: 'numeric' })

  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground />
      <StatusBar barStyle="dark-content" />
      <Toast />

      <View style={[styles.head, { paddingTop: headerTop }]}>
        <Text style={styles.title}>My Calendar</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {/* Month switcher */}
        <View style={styles.monthRow}>
          <TouchableOpacity style={styles.navCircle} onPress={() => setCalMonth(shiftMonth(calMonth, -1))}><Text style={styles.navChevron}>‹</Text></TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity style={styles.navCircle} onPress={() => setCalMonth(shiftMonth(calMonth, 1))}><Text style={styles.navChevron}>›</Text></TouchableOpacity>
        </View>

        {sortedDates.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 28 }}>📅</Text>
            <Text style={styles.emptyText}>No bookings this month</Text>
          </View>
        ) : sortedDates.map((date) => (
          <View key={date} style={{ marginBottom: 14 }}>
            <Text style={styles.dateLabel}>
              {new Date(date).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
            {grouped[date].sort((a, b) => (a.delivery_slot?.hour || 0) - (b.delivery_slot?.hour || 0)).map((o) => {
              const c = statusColor(o.delivery_status)
              return (
                <TouchableOpacity key={o.id} style={styles.listCard} activeOpacity={0.8} onPress={() => openOrderDetail(o.id)}>
                  <View style={styles.clockIcon}><Text style={{ fontSize: 16 }}>🕐</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{slotWindow(o.delivery_slot)}</Text>
                    <Text style={styles.listSub}>#{shortId(o.id)} • Collect {rs(toCollect(o))}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: c.bg }]}><Text style={[styles.statusPillText, { color: c.text }]}>{o.delivery_status}</Text></View>
                </TouchableOpacity>
              )
            })}
          </View>
        ))}
      </ScrollView>

      <BottomNav active="Calendar" />
    </View>
  )
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 18, paddingBottom: 8 },
  title: { fontSize: 19, fontWeight: '800', color: '#1f2937', fontFamily: fonts.display },

  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  navChevron: { fontSize: 20, color: '#4b5563', fontWeight: '700' },
  monthLabel: { fontSize: 15.5, fontWeight: '800', color: '#374151' },

  emptyCard: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 18, paddingVertical: 30, alignItems: 'center', gap: 8 },
  emptyText: { color: aurora.textFaint, fontSize: 13 },

  dateLabel: { fontSize: 13, fontWeight: '800', color: aurora.pink, marginBottom: 6 },
  listCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  clockIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fce7f3', alignItems: 'center', justifyContent: 'center' },
  listTitle: { fontSize: 13.5, fontWeight: '700', color: '#374151' },
  listSub: { fontSize: 11.5, color: aurora.textFaint, marginTop: 2 },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusPillText: { fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
})
