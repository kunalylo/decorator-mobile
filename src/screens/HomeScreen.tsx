import React from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native'
import { useApp } from '../context/AppContext'
import { LOGO_SRC } from '../lib/constants'
import { aurora, fonts } from '../lib/theme'
import { AuroraBackground, GradientView } from '../components/Aurora'
import BottomNav from '../components/BottomNav'
import Toast from '../components/Toast'
import { useSafeArea } from '../lib/useSafeArea'
import { greetingByTime, rs, formatTimer, shortId, safeUri, toCollect, slotWindow } from '../lib/utils'
import { navigate } from '../navigation'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  delivered:  { bg: '#dcfce7', text: '#16a34a' },
  decorating: { bg: '#ffedd5', text: '#ea580c' },
}
function statusColor(s: string) {
  return STATUS_COLORS[s] || { bg: '#fce7f3', text: '#db2777' }
}

export default function HomeScreen() {
  const {
    dpUser, dashboard, orders, pendingOrders, pendingGiftOrders, activeGiftOrders, loading,
    activeTimerOrderId, timerSeconds, refreshAll, refreshDashboard,
    handleAcceptOrder, handleDeclineOrder, handleAcceptGiftOrder, handleDeclineGiftOrder,
    openOrderDetail, openGiftOrderDetail, showToast,
  } = useApp()
  const { headerTop } = useSafeArea()
  const [refreshing, setRefreshing] = React.useState(false)

  const today = dashboard?.today_orders || []
  const active = dashboard?.active_orders || []

  const onRefresh = async () => {
    setRefreshing(true)
    refreshAll()
    showToast('Refreshed', 'success')
    setTimeout(() => setRefreshing(false), 600)
  }

  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground />
      <StatusBar barStyle="light-content" />
      <Toast />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={aurora.pink} />}>

        {/* Header */}
        <GradientView colors={aurora.header} style={[styles.header, { paddingTop: headerTop + 8 }]}>
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={styles.headerLogo}><Image source={LOGO_SRC} style={{ width: 42, height: 42 }} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>{greetingByTime()}</Text>
                <Text style={styles.headerName} numberOfLines={1}>{dpUser?.name}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐ {dpUser?.rating ?? '4.8'}</Text>
              </View>
              <TouchableOpacity style={styles.refreshBtn} onPress={() => { refreshAll(); showToast('Refreshed', 'success') }}>
                <Text style={{ fontSize: 15 }}>🔄</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GradientView>

        {/* Active job timer banner */}
        {activeTimerOrderId && (
          <TouchableOpacity style={styles.timerBanner} activeOpacity={0.85} onPress={() => navigate('ActiveJob')}>
            <Text style={{ fontSize: 22 }}>⏱️</Text>
            <Text style={styles.timerValue}>{formatTimer(timerSeconds)}</Text>
            <Text style={styles.timerHint}>Active Job — Tap to view</Text>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={[styles.statsRow, { marginTop: activeTimerOrderId ? 12 : -24 }]}>
          {[
            { label: 'Today',  value: today.length,  icon: '📅', tint: '#fce7f3' },
            { label: 'Active', value: active.length, icon: '▶️', tint: '#dcfce7' },
            { label: 'Total',  value: dpUser?.total_deliveries ?? orders.length, icon: '📦', tint: '#ede9fe' },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.tint }]}><Text style={{ fontSize: 16 }}>{s.icon}</Text></View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* New Order Requests */}
        {pendingOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeadRow}>
              <View style={styles.livePulse} />
              <Text style={styles.sectionTitle}>New Order Requests</Text>
              <View style={styles.countBadge}><Text style={styles.countBadgeText}>{pendingOrders.length}</Text></View>
            </View>
            {pendingOrders.map((o) => (
              <View key={o.id} style={styles.requestCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.requestId}>Order #{shortId(o.id)}</Text>
                    <Text style={styles.requestAddr} numberOfLines={1}>📍 {o.delivery_address || 'Address not set'}</Text>
                    {o.delivery_slot && (
                      <Text style={styles.requestSlot}>{o.delivery_slot.date} · {slotWindow(o.delivery_slot)}</Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.requestPrice}>Collect {rs(toCollect(o))}</Text>
                    <View style={styles.newPill}><Text style={styles.newPillText}>NEW</Text></View>
                  </View>
                </View>
                {(o.items || []).length > 0 && (
                  <Text style={styles.itemsLine} numberOfLines={1}>
                    Items: {(o.items || []).slice(0, 3).map((i: any) => i.name).join(', ')}
                    {(o.items || []).length > 3 ? ` +${o.items!.length - 3} more` : ''}
                  </Text>
                )}
                {o.schedule_conflict && (
                  <View style={styles.conflictBanner}>
                    <Text style={styles.conflictText}>⛔ Clashes with your {o.schedule_conflict.kind === 'gift' ? 'gift delivery' : 'decoration job'} at {o.schedule_conflict.hour}:00 — finish that first.</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity style={[styles.acceptBtn, !!o.schedule_conflict && styles.btnDisabled]} disabled={loading || !!o.schedule_conflict} onPress={() => handleAcceptOrder(o.id)} activeOpacity={0.85}>
                    <Text style={styles.acceptBtnText}>✓ Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineBtn} disabled={loading} onPress={() => handleDeclineOrder(o.id)} activeOpacity={0.85}>
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Gift Delivery Requests */}
        {pendingGiftOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeadRow}>
              <Text style={{ fontSize: 18 }}>🎁</Text>
              <Text style={styles.sectionTitle}>Gift Delivery Requests</Text>
              <View style={[styles.countBadge, { backgroundColor: aurora.pink }]}><Text style={styles.countBadgeText}>{pendingGiftOrders.length}</Text></View>
            </View>
            {pendingGiftOrders.map((o) => (
              <View key={o.id} style={styles.giftCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <View>
                    <Text style={styles.requestId}>🎁 Gift Delivery</Text>
                    <Text style={styles.requestSlot}>{o.gift_items?.length || 0} item{(o.gift_items?.length || 0) !== 1 ? 's' : ''} · Prepaid, nothing to collect</Text>
                  </View>
                  <View style={styles.paidPill}><Text style={styles.paidPillText}>100% Paid</Text></View>
                </View>
                {(o.gift_items || []).some((g: any) => g.image_url) && (
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    {(o.gift_items || []).filter((g: any) => g.image_url).slice(0, 4).map((g: any, i: number) => (
                      <Image key={i} source={{ uri: safeUri(g.image_url) }} style={styles.giftThumb} />
                    ))}
                  </View>
                )}
                {(o.gift_items || []).slice(0, 2).map((g: any, i: number) => (
                  <Text key={i} style={styles.giftItemLine}>{g.quantity}× {g.name}</Text>
                ))}
                {(o.gift_items?.length || 0) > 2 && <Text style={styles.requestSlot}>+{o.gift_items!.length - 2} more</Text>}
                <Text style={[styles.requestAddr, { marginTop: 6 }]} numberOfLines={1}>📍 {o.delivery_address}</Text>
                {o.schedule_conflict && (
                  <View style={styles.conflictBanner}>
                    <Text style={styles.conflictText}>⛔ Clashes with your {o.schedule_conflict.kind === 'gift' ? 'gift delivery' : 'decoration job'} at {o.schedule_conflict.hour}:00 — finish that first.</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity style={styles.declineBtn} disabled={loading} onPress={() => handleDeclineGiftOrder(o.id)} activeOpacity={0.85}>
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: aurora.pink }, !!o.schedule_conflict && styles.btnDisabled]} disabled={loading || !!o.schedule_conflict} onPress={() => handleAcceptGiftOrder(o.id)} activeOpacity={0.85}>
                    <Text style={styles.acceptBtnText}>Accept 🎁</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Today's Schedule */}
        <View style={styles.section}>
          <Text style={styles.plainTitle}>Today's Schedule</Text>
          {today.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 28 }}>📅</Text>
              <Text style={styles.emptyText}>No deliveries today</Text>
            </View>
          ) : today.map((o) => {
            const c = statusColor(o.delivery_status)
            return (
              <TouchableOpacity key={o.id} style={styles.listCard} activeOpacity={0.8} onPress={() => openOrderDetail(o.id)}>
                <View style={[styles.listIcon, { backgroundColor: c.bg }]}>
                  <Text style={{ fontSize: 18 }}>{o.delivery_status === 'delivered' ? '✅' : '🕐'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>Order #{shortId(o.id)}</Text>
                  <Text style={styles.listSub}>{slotWindow(o.delivery_slot)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.listPrice}>{toCollect(o) > 0 ? `Collect ${rs(toCollect(o))}` : 'Paid'}</Text>
                  <View style={[styles.statusPill, { backgroundColor: c.bg }]}><Text style={[styles.statusPillText, { color: c.text }]}>{o.delivery_status}</Text></View>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Active Orders */}
        {active.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.plainTitle}>Active Orders</Text>
            {active.map((o) => (
              <TouchableOpacity key={o.id} style={[styles.listCard, { borderColor: '#fbcfe8', borderWidth: 2 }]} activeOpacity={0.8} onPress={() => openOrderDetail(o.id)}>
                <View style={[styles.listIcon, { backgroundColor: '#fce7f3' }]}><Text style={{ fontSize: 18 }}>🚚</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>#{shortId(o.id)}</Text>
                  <Text style={styles.listSub}>{o.delivery_slot?.date} · {slotWindow(o.delivery_slot)}</Text>
                </View>
                <Text style={{ color: '#d1d5db', fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Active Gift Deliveries — accepted gift orders in progress (so the OTP step stays reachable) */}
        {activeGiftOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.plainTitle}>Active Gift Deliveries</Text>
            {activeGiftOrders.map((o) => (
              <TouchableOpacity key={o.id} style={[styles.listCard, { borderColor: '#fbcfe8', borderWidth: 2 }]} activeOpacity={0.8} onPress={() => openGiftOrderDetail(o.id)}>
                <View style={[styles.listIcon, { backgroundColor: '#fce7f3' }]}><Text style={{ fontSize: 18 }}>🎁</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>Gift #{shortId(o.id)}</Text>
                  <Text style={styles.listSub}>{(o.gift_items?.length || 0)} item{(o.gift_items?.length || 0) !== 1 ? 's' : ''} · {(o.delivery_status || '').replace('_', ' ')}</Text>
                </View>
                <Text style={{ color: '#d1d5db', fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {loading && (
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <ActivityIndicator color={aurora.pink} />
          </View>
        )}
      </ScrollView>

      <BottomNav active="Home" pendingBadge={pendingOrders.length + pendingGiftOrders.length} />
    </View>
  )
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 40, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLogo: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden', backgroundColor: '#fff' },
  greeting: { color: 'rgba(255,255,255,0.75)', fontSize: 11 },
  headerName: { color: '#fff', fontSize: 19, fontWeight: '800', fontFamily: fonts.display },
  ratingBadge: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  ratingText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  refreshBtn: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

  timerBanner: { marginHorizontal: 16, marginTop: -22, backgroundColor: '#fff7ed', borderWidth: 2, borderColor: '#fb923c', borderRadius: 18, paddingVertical: 12, alignItems: 'center' },
  timerValue: { fontSize: 24, fontWeight: '900', color: '#ea580c', marginTop: 2 },
  timerHint: { fontSize: 11, color: '#fb923c' },

  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 18, paddingVertical: 12, alignItems: 'center', shadowColor: '#c2185b', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  statIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#1f2937' },
  statLabel: { fontSize: 10, color: aurora.textFaint },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  livePulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },
  sectionTitle: { fontSize: 15.5, fontWeight: '800', color: '#1f2937' },
  plainTitle: { fontSize: 15.5, fontWeight: '800', color: '#1f2937', marginBottom: 12 },
  countBadge: { marginLeft: 'auto', minWidth: 22, height: 22, borderRadius: 11, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  countBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  requestCard: { backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#86efac', borderRadius: 18, padding: 14, marginBottom: 12 },
  requestId: { fontWeight: '800', color: '#1f2937', fontSize: 13.5 },
  requestAddr: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  requestSlot: { fontSize: 11, color: aurora.textFaint, marginTop: 3 },
  requestPrice: { fontWeight: '900', color: '#16a34a', fontSize: 16 },
  newPill: { backgroundColor: '#dcfce7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  newPillText: { fontSize: 9, color: '#15803d', fontWeight: '800' },
  itemsLine: { fontSize: 11.5, color: '#6b7280', marginTop: 10 },
  conflictBanner: { marginTop: 10, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  conflictText: { fontSize: 11, color: '#dc2626', fontWeight: '700', lineHeight: 15 },
  btnDisabled: { opacity: 0.5 },

  acceptBtn: { flex: 1, backgroundColor: '#22c55e', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  declineBtn: { flex: 1, borderWidth: 1.5, borderColor: '#fca5a5', borderRadius: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  declineBtnText: { color: '#ef4444', fontWeight: '800', fontSize: 14 },

  giftCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderWidth: 1, borderColor: '#fbcfe8', borderRadius: 18, padding: 14, marginBottom: 12 },
  paidPill: { backgroundColor: '#dcfce7', borderRadius: 9, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start' },
  paidPillText: { fontSize: 11, color: '#15803d', fontWeight: '800' },
  giftItemLine: { fontSize: 12, color: '#4b5563' },
  giftThumb: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#fbcfe8' },

  emptyCard: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 18, paddingVertical: 26, alignItems: 'center', gap: 8 },
  emptyText: { color: aurora.textFaint, fontSize: 13 },

  listCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  listIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  listTitle: { fontSize: 13.5, fontWeight: '700', color: '#374151' },
  listSub: { fontSize: 11.5, color: aurora.textFaint, marginTop: 2 },
  listPrice: { fontSize: 13.5, fontWeight: '800', color: aurora.pink },
  statusPill: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, marginTop: 4 },
  statusPillText: { fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
})
