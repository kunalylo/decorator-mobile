import React from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, StatusBar,
} from 'react-native'
import { useApp } from '../context/AppContext'
import { aurora, fonts } from '../lib/theme'
import { AuroraBackground } from '../components/Aurora'
import Toast from '../components/Toast'
import { useSafeArea } from '../lib/useSafeArea'
import { safeUri } from '../lib/utils'
import { GIFT_STATUS_STEPS, GIFT_STATUS_LABELS } from '../lib/constants'
import { navigate } from '../navigation'

function nextAction(status: string) {
  if (status === 'assigned') return { label: '🚗  Start Navigation', next: 'en_route' }
  if (status === 'en_route') return { label: '📍  Arrived at Location', next: 'arrived' }
  // 'arrived' → handled by the OTP confirmation card (delivery needs the recipient OTP)
  return null
}

export default function GiftOrderScreen() {
  const {
    selectedGiftOrder: o, updateGiftStatus, loading, openMaps, callCustomer,
    giftOtpInput, setGiftOtpInput, generateGiftOtp, verifyGiftOtp,
  } = useApp()
  const { headerTop } = useSafeArea()

  if (!o) {
    return <View style={styles.center}><ActivityIndicator color={aurora.pink} /></View>
  }

  const currentIdx = GIFT_STATUS_STEPS.indexOf(o.delivery_status)
  const action = nextAction(o.delivery_status)

  const onAction = async () => {
    if (!action) return
    await updateGiftStatus(o.id, action.next)
    if (action.next === 'en_route') openMaps(o)
  }

  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground />
      <StatusBar barStyle="dark-content" />
      <Toast />

      <View style={[styles.topBar, { paddingTop: headerTop }]}>
        <TouchableOpacity onPress={() => navigate('Home')} style={styles.backCircle}><Text style={styles.backChevron}>‹</Text></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>🎁 Gift Delivery</Text>
          <Text style={styles.topSub}>{o.delivery_status?.replace('_', ' ')}</Text>
        </View>
        <View style={styles.paidPill}><Text style={styles.paidPillText}>100% Paid</Text></View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }} showsVerticalScrollIndicator={false}>
        {/* Progress steps */}
        <View style={styles.card}>
          <View style={styles.stepsRow}>
            {GIFT_STATUS_STEPS.map((step, i) => (
              <View key={step} style={styles.stepCol}>
                <View style={[styles.stepDot, i <= currentIdx ? { backgroundColor: aurora.pink } : { backgroundColor: '#e5e7eb' }]}>
                  <Text style={[styles.stepDotText, i <= currentIdx && { color: '#fff' }]}>{i < currentIdx ? '✓' : i + 1}</Text>
                </View>
                <Text style={[styles.stepLabel, i <= currentIdx && { color: aurora.pinkDeep, fontWeight: '700' }]}>{GIFT_STATUS_LABELS[step]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Gift items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 Gift Items to Deliver</Text>
          {(o.gift_items || []).map((g: any, i: number) => (
            <View key={i} style={styles.giftRow}>
              {g.image_url
                ? <Image source={{ uri: safeUri(g.image_url) }} style={styles.giftThumb} />
                : <View style={styles.giftThumbEmpty}><Text style={{ fontSize: 20 }}>🎁</Text></View>}
              <Text style={[styles.giftName, { flex: 1 }]}>{g.quantity}× {g.name}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.prepaidNote}>Prepaid by customer — nothing to collect</Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Delivery Address</Text>
          <Text style={styles.addrText}>{o.delivery_address}</Text>
          {o.delivery_landmark ? <Text style={styles.addrLandmark}>Landmark: {o.delivery_landmark}</Text> : null}
          <TouchableOpacity style={styles.mapsBtn} onPress={() => openMaps(o)} activeOpacity={0.85}>
            <Text style={styles.mapsBtnText}>🧭  Open in Google Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Customer */}
        {o.customer && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Customer</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={styles.custName}>{o.customer.name}</Text>
                <Text style={styles.custMeta}>{o.customer.phone || o.customer.email}</Text>
              </View>
              {o.customer.phone && (
                <TouchableOpacity style={styles.callPill} onPress={() => callCustomer(o.customer?.phone)} activeOpacity={0.85}>
                  <Text style={styles.callPillText}>📞 Call</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Slot */}
        {o.delivery_slot && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Scheduled Slot</Text>
            <Text style={styles.addrText}>{o.delivery_slot.date} · {o.delivery_slot.hour}:00 – {o.delivery_slot.hour + 1}:00</Text>
          </View>
        )}

        {/* Action */}
        {action && o.delivery_status !== 'delivered' && (
          <>
            {o.delivery_status === 'en_route' && (
              <TouchableOpacity style={styles.outlineCta} onPress={() => openMaps(o)} activeOpacity={0.85}>
                <Text style={styles.outlineCtaText}>🧭  Reopen Google Maps</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.primaryCta} disabled={loading} onPress={onAction} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryCtaText}>{action.label}</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* OTP confirmation — required to mark the gift as delivered */}
        {o.delivery_status === 'arrived' && (
          <View style={[styles.card, styles.otpCard]}>
            <Text style={styles.cardTitle}>🔑  Confirm Delivery with OTP</Text>
            <Text style={styles.otpHint}>Ask the recipient for the 6-digit code they received by SMS, then enter it to confirm hand-over.</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="Enter OTP"
              placeholderTextColor="#d1d5db"
              value={giftOtpInput}
              onChangeText={(t) => setGiftOtpInput(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity
              style={[styles.primaryCta, { marginTop: 12 }]}
              disabled={loading || (giftOtpInput.length !== 4 && giftOtpInput.length !== 6)}
              onPress={() => verifyGiftOtp(o.id)}
              activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryCtaText}>✅  Confirm Gift Delivered</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => generateGiftOtp(o.id)} disabled={loading} style={{ paddingVertical: 10 }}>
              <Text style={styles.resendText}>↺  Resend OTP to recipient</Text>
            </TouchableOpacity>
          </View>
        )}

        {o.delivery_status === 'delivered' && (
          <View style={styles.doneCard}>
            <Text style={{ fontSize: 30 }}>✅</Text>
            <Text style={styles.doneTitle}>Gift Delivered!</Text>
            <Text style={styles.doneSub}>Order complete — payment already received</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdf2f8' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 10 },
  backCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  backChevron: { fontSize: 22, color: '#4b5563', fontWeight: '700' },
  topTitle: { fontSize: 17, fontWeight: '800', color: '#1f2937', fontFamily: fonts.display },
  topSub: { fontSize: 11.5, color: aurora.textFaint, textTransform: 'capitalize' },
  paidPill: { backgroundColor: '#dcfce7', borderRadius: 12, paddingHorizontal: 11, paddingVertical: 6 },
  paidPillText: { color: '#15803d', fontWeight: '800', fontSize: 11 },

  card: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepCol: { flex: 1, alignItems: 'center' },
  stepDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  stepDotText: { fontSize: 12, fontWeight: '800', color: '#9ca3af' },
  stepLabel: { fontSize: 10, color: aurora.textFaint, textAlign: 'center' },

  cardTitle: { fontSize: 14, fontWeight: '800', color: '#374151', marginBottom: 8 },
  giftRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  giftThumb: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#eee' },
  giftThumbEmpty: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#fdf2f8', alignItems: 'center', justifyContent: 'center' },
  giftName: { fontSize: 13, color: '#374151' },
  giftPrice: { fontSize: 13, fontWeight: '700', color: aurora.pink },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#fbcfe8' },
  prepaidNote: { fontSize: 12, fontWeight: '700', color: '#16a34a' },
  totalLabel: { fontSize: 13.5, fontWeight: '800', color: '#374151' },
  totalValue: { fontSize: 13.5, fontWeight: '800', color: aurora.pink },

  addrText: { fontSize: 13, color: '#4b5563', lineHeight: 19 },
  addrLandmark: { fontSize: 11.5, color: aurora.textFaint, marginTop: 3 },
  mapsBtn: { marginTop: 12, backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  mapsBtnText: { color: '#fff', fontWeight: '700', fontSize: 13.5 },

  custName: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  custMeta: { fontSize: 11.5, color: aurora.textFaint, marginTop: 2 },
  callPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  callPillText: { color: '#16a34a', fontWeight: '700', fontSize: 13 },

  primaryCta: { backgroundColor: aurora.pink, borderRadius: 18, paddingVertical: 16, alignItems: 'center', shadowColor: '#c2185b', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  primaryCtaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  outlineCta: { borderRadius: 18, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#f9a8d4', backgroundColor: 'rgba(255,255,255,0.7)' },
  outlineCtaText: { color: aurora.pink, fontWeight: '700', fontSize: 13.5 },

  otpCard: { borderWidth: 2, borderColor: '#f9a8d4', backgroundColor: '#fdf2f8' },
  otpHint: { fontSize: 12, color: aurora.textFaint, marginBottom: 12, lineHeight: 17 },
  otpInput: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, paddingVertical: 16, textAlign: 'center', fontSize: 24, fontWeight: '800', letterSpacing: 12, color: '#111827', backgroundColor: '#fff' },
  resendText: { fontSize: 12, fontWeight: '700', color: aurora.pink, textAlign: 'center' },

  doneCard: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 18, paddingVertical: 24, alignItems: 'center', gap: 6 },
  doneTitle: { fontSize: 16, fontWeight: '800', color: '#15803d' },
  doneSub: { fontSize: 11.5, color: '#16a34a' },
})
