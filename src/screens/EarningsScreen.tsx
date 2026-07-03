import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StatusBar,
} from 'react-native'
import { useApp } from '../context/AppContext'
import { aurora, fonts } from '../lib/theme'
import { AuroraBackground } from '../components/Aurora'
import BottomNav from '../components/BottomNav'
import Toast from '../components/Toast'
import { useSafeArea } from '../lib/useSafeArea'
import { rs } from '../lib/utils'

export default function EarningsScreen() {
  const { earnings, depositCash, loading } = useApp()
  const { headerTop } = useSafeArea()
  const e = earnings || ({} as any)
  const cashPending = e.cash_pending || 0

  const [showDeposit, setShowDeposit] = useState(false)
  const [amount, setAmount] = useState('')
  const [ref, setRef] = useState('')

  const onDeposit = async (method: string) => {
    const ok = await depositCash(Number(amount), method, ref)
    if (ok) { setShowDeposit(false); setAmount(''); setRef('') }
  }

  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground />
      <StatusBar barStyle="dark-content" />
      <Toast />

      <View style={[styles.head, { paddingTop: headerTop }]}>
        <Text style={styles.title}>Earnings & Payments</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 14 }} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[styles.statCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
            <Text style={styles.statLabelGreen}>Total Collected</Text>
            <Text style={styles.statValueGreen}>{rs(e.total_collected || 0)}</Text>
          </View>
          <View style={[styles.statCard, cashPending > 0 ? { backgroundColor: '#fff7ed', borderColor: '#fdba74' } : { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: 'rgba(0,0,0,0.05)' }]}>
            <Text style={[styles.statLabel, cashPending > 0 && { color: '#ea580c' }]}>Cash Pending</Text>
            <Text style={[styles.statValue, cashPending > 0 && { color: '#ea580c' }]}>{rs(cashPending)}</Text>
          </View>
        </View>

        {/* Deposit cash */}
        {cashPending > 0 && (
          <View style={[styles.card, { borderColor: '#fed7aa' }]}>
            <Text style={styles.cardTitle}>Deposit Cash</Text>
            <Text style={styles.cardHint}>Deposit collected cash to office or transfer from bank.</Text>
            {!showDeposit ? (
              <TouchableOpacity style={styles.depositBtn} onPress={() => setShowDeposit(true)} activeOpacity={0.85}>
                <Text style={styles.depositBtnText}>🏢  Deposit Now</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ gap: 8 }}>
                <TextInput style={styles.input} placeholder="Amount (Rs)" placeholderTextColor="#c4c4c4" keyboardType="number-pad" value={amount} onChangeText={(t) => setAmount(t.replace(/\D/g, ''))} />
                <TextInput style={styles.input} placeholder="Reference / Receipt No (optional)" placeholderTextColor="#c4c4c4" value={ref} onChangeText={setRef} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={styles.officeBtn} disabled={loading} onPress={() => onDeposit('office_cash')} activeOpacity={0.85}>
                    <Text style={styles.officeBtnText}>🏢 Office</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bankBtn} disabled={loading} onPress={() => onDeposit('bank_transfer')} activeOpacity={0.85}>
                    <Text style={styles.bankBtnText}>💳 Bank</Text>
                  </TouchableOpacity>
                </View>
                {loading && <ActivityIndicator color={aurora.pink} style={{ marginTop: 4 }} />}
              </View>
            )}
          </View>
        )}

        {/* Recent collections */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Collections</Text>
          {(e.recent_collections || []).length === 0 ? (
            <Text style={styles.cardHint}>No collections yet</Text>
          ) : (e.recent_collections || []).map((c: any) => (
            <View key={c.id} style={styles.collectRow}>
              <View style={[styles.collectIcon, { backgroundColor: c.method === 'cash' ? '#f0fdf4' : '#eff6ff' }]}>
                <Text style={{ fontSize: 15 }}>{c.method === 'cash' ? '💵' : '💳'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.collectAmt}>{rs(c.amount)}</Text>
                <Text style={styles.collectMeta}>{new Date(c.created_at).toLocaleDateString()} • {c.method}</Text>
              </View>
              <View style={[styles.depPill, { backgroundColor: c.deposited ? '#dcfce7' : '#ffedd5' }]}>
                <Text style={[styles.depPillText, { color: c.deposited ? '#16a34a' : '#ea580c' }]}>{c.deposited ? 'Deposited' : 'Pending'}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNav active="Earnings" />
    </View>
  )
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 18, paddingBottom: 8 },
  title: { fontSize: 19, fontWeight: '800', color: '#1f2937', fontFamily: fonts.display },

  statCard: { flex: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  statLabel: { fontSize: 11, color: aurora.textFaint },
  statLabelGreen: { fontSize: 11, color: '#16a34a' },
  statValue: { fontSize: 19, fontWeight: '900', color: '#374151', marginTop: 2 },
  statValueGreen: { fontSize: 19, fontWeight: '900', color: '#16a34a', marginTop: 2 },

  card: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#374151', marginBottom: 6 },
  cardHint: { fontSize: 12, color: aurora.textFaint, marginBottom: 10 },

  depositBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: aurora.pink },
  depositBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  input: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#111827', backgroundColor: '#fafafa' },
  officeBtn: { flex: 1, backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  officeBtnText: { color: '#fff', fontWeight: '800', fontSize: 13.5 },
  bankBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#f9a8d4', backgroundColor: '#fff' },
  bankBtnText: { color: aurora.pink, fontWeight: '800', fontSize: 13.5 },

  collectRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  collectIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  collectAmt: { fontSize: 13.5, color: '#374151', fontWeight: '700' },
  collectMeta: { fontSize: 10.5, color: aurora.textFaint, marginTop: 1 },
  depPill: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 4 },
  depPillText: { fontSize: 10.5, fontWeight: '800' },
})
