import React from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar,
} from 'react-native'
import { useApp } from '../context/AppContext'
import { aurora, fonts } from '../lib/theme'
import { AuroraBackground } from '../components/Aurora'
import Toast from '../components/Toast'
import { useSafeArea } from '../lib/useSafeArea'
import { rs, formatTimer, shortId, toCollect } from '../lib/utils'
import { useCountdown } from '../lib/useCountdown'
import { navigate } from '../navigation'

export default function ActiveJobScreen() {
  const { selectedOrder: o, timerEndAt, loading, handleComplete, callCustomer, extendTimer } = useApp()
  const timerSeconds = useCountdown(timerEndAt)
  const { headerTop } = useSafeArea()

  // Timer urgency tint
  const tint = timerSeconds < 300
    ? { border: '#f87171', bg: '#fef2f2', text: '#dc2626' }
    : timerSeconds < 900
    ? { border: '#fdba74', bg: '#fff7ed', text: '#ea580c' }
    : { border: '#86efac', bg: '#f0fdf4', text: '#16a34a' }

  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground />
      <StatusBar barStyle="dark-content" />
      <Toast />

      <View style={[styles.topBar, { paddingTop: headerTop }]}>
        <TouchableOpacity onPress={() => navigate('Home')} style={styles.backCircle}><Text style={styles.backChevron}>‹</Text></TouchableOpacity>
        <Text style={styles.topTitle}>Active Job</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }} showsVerticalScrollIndicator={false}>
        {/* Timer */}
        <View style={[styles.timerCard, { borderColor: tint.border, backgroundColor: tint.bg }]}>
          <Text style={{ fontSize: 40 }}>⏱️</Text>
          <Text style={[styles.timerValue, { color: tint.text }]}>{formatTimer(timerSeconds)}</Text>
          <Text style={styles.timerLabel}>Time Remaining</Text>
          {timerSeconds < 300 && timerSeconds > 0 && (
            <Text style={styles.warnText}>⚠️  Less than 5 minutes!</Text>
          )}
          <TouchableOpacity style={styles.extendBtn} onPress={extendTimer} activeOpacity={0.85}>
            <Text style={styles.extendBtnText}>＋ Add 5 minutes</Text>
          </TouchableOpacity>
          <Text style={styles.finishHint}>Finished early? You can complete the job anytime below.</Text>
        </View>

        {o && (
          <>
            <View style={styles.card}>
              <Row label="Order" value={`#${shortId(o.id)}`} mono />
              <Row label="Customer" value={o.customer?.name || '—'} />
              <Row label="To Collect" value={toCollect(o) > 0 ? rs(toCollect(o)) : 'Nothing — prepaid'} pink />
              {o.delivery_address ? (
                <Text style={styles.addr}>📍 {o.delivery_address}</Text>
              ) : null}
            </View>

            {((o.kit_items?.length || 0) > 0 || (o.addon_items?.length || 0) > 0) && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📦 Items Reference</Text>
                {(o.kit_items || []).map((it: any, i: number) => (
                  <View key={`k${i}`} style={styles.checkRow}>
                    <Text style={[styles.checkBox, { color: aurora.pink }]}>✓</Text>
                    <Text style={styles.checkText}>{it.quantity}x {it.name}{it.color ? ` (${it.color})` : ''}</Text>
                  </View>
                ))}
                {(o.addon_items || []).map((it: any, i: number) => (
                  <View key={`a${i}`} style={styles.checkRow}>
                    <Text style={[styles.checkBox, { color: '#a78bfa' }]}>✓</Text>
                    <Text style={styles.checkText}>{it.quantity}x {it.name}{it.color ? ` (${it.color})` : ''}</Text>
                  </View>
                ))}
              </View>
            )}

            {o.customer?.phone && (
              <TouchableOpacity style={styles.callBtn} onPress={() => callCustomer(o.customer?.phone)} activeOpacity={0.85}>
                <Text style={styles.callBtnText}>📞  Call Customer</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <TouchableOpacity
          style={styles.completeBtn}
          disabled={loading || !o}
          onPress={() => o && handleComplete(o.id)}
          activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.completeBtnText}>✓  Complete Decoration</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

function Row({ label, value, pink, mono }: { label: string; value: string; pink?: boolean; mono?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, pink && { color: aurora.pink, fontWeight: '800' }, mono && { fontVariant: ['tabular-nums'] }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 10 },
  backCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  backChevron: { fontSize: 22, color: '#4b5563', fontWeight: '700' },
  topTitle: { fontSize: 17, fontWeight: '800', color: '#1f2937', fontFamily: fonts.display },

  timerCard: { borderWidth: 2, borderRadius: 22, paddingVertical: 28, alignItems: 'center' },
  timerValue: { fontSize: 44, fontWeight: '900', marginTop: 6 },
  timerLabel: { fontSize: 13, color: aurora.textFaint, marginTop: 2 },
  warnText: { fontSize: 12, fontWeight: '800', color: '#dc2626', marginTop: 8 },
  extendBtn: { marginTop: 14, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: '#f9a8d4', backgroundColor: '#fff' },
  extendBtnText: { color: aurora.pink, fontWeight: '800', fontSize: 14 },
  finishHint: { fontSize: 11, color: aurora.textFaint, marginTop: 8, textAlign: 'center' },

  card: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowLabel: { fontSize: 13, color: aurora.textFaint },
  rowValue: { fontSize: 13.5, color: '#374151', fontWeight: '600' },
  addr: { fontSize: 12, color: '#6b7280', marginTop: 8, lineHeight: 18, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 8 },

  cardTitle: { fontSize: 14, fontWeight: '800', color: '#374151', marginBottom: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  checkBox: { fontSize: 14 },
  checkText: { fontSize: 12.5, color: '#4b5563', flex: 1 },

  callBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 14, paddingVertical: 14 },
  callBtnText: { color: '#16a34a', fontWeight: '800', fontSize: 14.5 },

  completeBtn: { backgroundColor: '#22c55e', borderRadius: 18, paddingVertical: 16, alignItems: 'center', shadowColor: '#16a34a', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  completeBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
})
