import React from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useApp } from '../context/AppContext'
import { aurora, fonts } from '../lib/theme'
import { AuroraBackground, GradientButton } from '../components/Aurora'
import Toast from '../components/Toast'
import { useSafeArea } from '../lib/useSafeArea'
import { rs, formatTimer, shortId, safeUri } from '../lib/utils'
import { navigate } from '../navigation'

export default function OrderScreen() {
  const {
    selectedOrder: o, loading, timerSeconds, extendTimer,
    handleStartNavigation, handleComplete, collectCash, collectOnline,
    uploadCompletionPhotos, removeCompletionPhoto, openMaps, callCustomer, showToast,
  } = useApp()
  const { headerTop } = useSafeArea()

  if (!o) {
    return (
      <View style={styles.center}><ActivityIndicator color={aurora.pink} /></View>
    )
  }

  const isReferenceFlow = o.flow === 'reference' || !!(o as any).reference_design_id
  const referenceImage = o.reference_image_url || o.reference_thumbnail_url
  const isDecorating = o.delivery_status === 'decorating'
  const isComplete   = o.delivery_status === 'delivered'
  const remainingToCollect = Math.max(0, Math.round((o.total_cost || 0) - (o.payment_amount || 0)))
  const photos = Array.isArray(o.completion_photos) ? o.completion_photos : []
  const showPhotos = ['arrived', 'decorating', 'delivered', 'completed'].includes(o.delivery_status)

  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground />
      <StatusBar barStyle="dark-content" />
      <Toast />

      <View style={[styles.topBar, { paddingTop: headerTop }]}>
        <TouchableOpacity onPress={() => navigate('Home')} style={styles.backCircle}><Text style={styles.backChevron}>‹</Text></TouchableOpacity>
        <Text style={styles.topTitle}>Order #{shortId(o.id)}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }} showsVerticalScrollIndicator={false}>

        {/* Recreate-this-look (reference flow) */}
        {isReferenceFlow && referenceImage && (
          <View style={[styles.card, styles.pinkCard]}>
            <Text style={styles.uppPink}>✦ Recreate This Look</Text>
            <Image source={{ uri: safeUri(referenceImage) }} style={styles.refImg} resizeMode="cover" />
            <Text style={styles.centerHint}>This is what the customer expects — match the style</Text>
          </View>
        )}

        {/* Job references grid (reference flow): Reference · Customer's room · AI preview.
            Mirrors the web DpOrderScreen 3-image grid so the decorator can see the actual
            room they must decorate AND the AI preview that defines the expected result. */}
        {isReferenceFlow && (
          <View style={styles.card}>
            <Text style={styles.uppMuted}>Job References</Text>
            <View style={styles.refGrid}>
              {[
                { uri: referenceImage,       label: 'Reference', sub: '(target)',        border: '#f9a8d4', tint: '#fdf2f8' },
                { uri: o.original_image_url, label: 'Customer',  sub: 'Room',            border: '#93c5fd', tint: '#eff6ff' },
                { uri: o.decorated_image,    label: 'AI Preview', sub: '(customer view)', border: '#c4b5fd', tint: '#f5f3ff' },
              ].map((cell, idx) => (
                <View key={idx} style={styles.refCol}>
                  <View style={[styles.refCell, { borderColor: cell.border, backgroundColor: cell.tint }]}>
                    {cell.uri
                      ? <Image source={{ uri: safeUri(cell.uri) }} style={styles.refCellImg} resizeMode="cover" />
                      : <Text style={styles.refCellEmpty}>{idx === 1 ? 'No photo' : '—'}</Text>}
                  </View>
                  <Text style={styles.refCellLabel}>{cell.label}{'\n'}{cell.sub}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Kit name (legacy flow) */}
        {!isReferenceFlow && o.kit_name && (
          <View style={[styles.card, styles.pinkCard]}>
            <Text style={styles.uppPink}>✦ Collect This Kit</Text>
            <Text style={styles.kitName}>{o.kit_name}</Text>
          </View>
        )}

        {/* Decorated preview (legacy single image) */}
        {!isReferenceFlow && o.decorated_image && (
          <Image source={{ uri: safeUri(o.decorated_image) }} style={styles.decoratedImg} resizeMode="cover" />
        )}

        {/* Customer + order summary */}
        <View style={styles.card}>
          <Row label="Customer" value={o.customer?.name || '—'} />
          <TouchableOpacity onPress={() => callCustomer(o.customer?.phone)}>
            <Row label="Phone" value={o.customer?.phone || '—'} valueColor={aurora.pink} />
          </TouchableOpacity>
          <Row label="Slot" value={o.delivery_slot ? `${o.delivery_slot.date} · ${o.delivery_slot.hour}:00–${o.delivery_slot.hour + 2}:00` : '—'} />
          {/* Decorators never see the order total — only what they must collect on delivery. */}
          <View style={styles.collectRow}>
            <Text style={styles.collectLabel}>Collect on delivery</Text>
            <Text style={styles.collectValue}>{remainingToCollect > 0 ? rs(remainingToCollect) : 'Nothing — prepaid'}</Text>
          </View>
          <Row label="Payment" value={o.payment_status} pill />
          <Row label="Status" value={o.delivery_status} pill pillColor={o.delivery_status === 'delivered' ? '#16a34a' : aurora.pink} />
        </View>

        {/* Delivery address */}
        {(o.delivery_address || o.delivery_lat) && (
          <View style={[styles.card, styles.blueCard]}>
            <Text style={styles.addrTitle}>📍 Delivery Address</Text>
            <Text style={styles.addrText}>{o.delivery_address || 'Pin location only'}</Text>
            {o.delivery_landmark ? <Text style={styles.addrLandmark}>Landmark: {o.delivery_landmark}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={[styles.mapsBtn, { flex: 1, marginTop: 0 }]} onPress={() => openMaps(o)} activeOpacity={0.85}>
                <Text style={styles.mapsBtnText}>🧭  Open in Google Maps</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.copyBtn}
                activeOpacity={0.85}
                onPress={async () => {
                  const text = [o.delivery_address, o.delivery_landmark].filter(Boolean).join(', ')
                  if (text) { await Clipboard.setStringAsync(text); showToast('Address copied', 'success') }
                }}>
                <Text style={styles.copyBtnText}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Items checklist */}
        <ItemsChecklist order={o} isReferenceFlow={isReferenceFlow} />

        {/* Gift items add-on */}
        {o.has_gifts && (o.gift_items?.length || 0) > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎁 Also Deliver These Gifts</Text>
            {o.gift_items!.map((g: any, i: number) => (
              <View key={i} style={styles.giftRow}>
                <Text style={styles.giftName}>{g.quantity}× {g.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Completion photos */}
        {showPhotos && (
          <View style={[styles.card, styles.greenCard]}>
            <Text style={styles.cardTitleGreen}>📷 Completion Photos{photos.length > 0 ? `  (${photos.length})` : ''}</Text>
            <Text style={styles.photoHint}>Upload 2–4 clear photos of the finished decoration. Shared with the customer + office so payment can be released.</Text>
            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                {photos.map((p: any, i: number) => (
                  <View key={p.url || i} style={styles.photoThumbWrap}>
                    <Image source={{ uri: safeUri(p.url) }} style={styles.photoThumb} />
                    <TouchableOpacity style={styles.photoRemove} onPress={() => removeCompletionPhoto(o.id, i)}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.uploadBtn} disabled={loading} onPress={() => uploadCompletionPhotos(o.id)} activeOpacity={0.85}>
              <Text style={styles.uploadBtnText}>{photos.length > 0 ? '＋ Add More Photos' : '⬆ Upload Photos'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status actions */}
        {o.delivery_status === 'assigned' && (
          <GradientButton style={styles.primaryCta} onPress={() => handleStartNavigation(o)} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryCtaText}>🧭  Start Navigation & Notify Customer</Text>}
          </GradientButton>
        )}

        {o.delivery_status === 'en_route' && (
          <>
            <TouchableOpacity style={styles.outlineCta} onPress={() => openMaps(o)} activeOpacity={0.85}>
              <Text style={styles.outlineCtaText}>🧭  Reopen Google Maps</Text>
            </TouchableOpacity>
            <GradientButton style={styles.primaryCta} onPress={() => navigate('Verify')} disabled={loading}>
              <Text style={styles.primaryCtaText}>📷  Arrived — Check In with Selfie</Text>
            </GradientButton>
          </>
        )}

        {isDecorating && (
          <View style={[styles.card, styles.orangeCard]}>
            <Text style={{ fontSize: 26, textAlign: 'center' }}>⏱️</Text>
            <Text style={styles.timerBig}>{formatTimer(timerSeconds)}</Text>
            <Text style={styles.timerSub}>Decoration in progress</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.extendHalf} onPress={extendTimer} activeOpacity={0.85}>
                <Text style={styles.extendHalfText}>＋ 5 min</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.greenCta, { flex: 1 }]} disabled={loading} onPress={() => handleComplete(o.id)} activeOpacity={0.85}>
                <Text style={styles.greenCtaText}>✓ Mark as Completed</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isComplete && o.payment_status !== 'full' && (
          <View style={[styles.card, styles.orangeCard]}>
            <Text style={styles.cardTitle}>Collect Remaining Payment</Text>
            <Text style={styles.photoHint}>Remaining: {rs(remainingToCollect)} (50% on delivery)</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity style={styles.greenCtaHalf} disabled={loading} onPress={() => collectCash(o.id, remainingToCollect)} activeOpacity={0.85}>
                <Text style={styles.greenCtaText}>💵 Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineHalf} disabled={loading} onPress={() => collectOnline(o)} activeOpacity={0.85}>
                <Text style={styles.outlineCtaText}>💳 Online</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Call customer */}
        {o.customer?.phone && (
          <TouchableOpacity style={styles.callBtn} onPress={() => callCustomer(o.customer?.phone)} activeOpacity={0.85}>
            <Text style={styles.callBtnText}>📞  Call Customer</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  )
}

function ItemsChecklist({ order, isReferenceFlow }: { order: any; isReferenceFlow: boolean }) {
  if (isReferenceFlow) {
    const items = order.items || []
    if (items.length === 0) return null
    const grouped: Record<string, any[]> = {}
    items.forEach((it: any) => {
      const cat = it.category || 'Other'
      ;(grouped[cat] = grouped[cat] || []).push(it)
    })
    return (
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <Text style={styles.cardTitlePink}>Items to Recreate This Look</Text>
          <Text style={styles.tinyMuted}>{items.length} items</Text>
        </View>
        {Object.entries(grouped).map(([cat, list]) => (
          <View key={cat} style={{ marginBottom: 8 }}>
            <Text style={styles.catLabel}>{cat}</Text>
            {list.map((it: any, i: number) => (
              <View key={it.id || `${cat}-${i}`} style={styles.checkRow}>
                <Text style={styles.checkBox}>☑</Text>
                {it.item_image_url ? (
                  <Image
                    source={{ uri: safeUri(`${it.item_image_url}?tr=w-112,h-112,c-maintain_ratio`) }}
                    style={styles.itemThumb}
                  />
                ) : (
                  <View style={[styles.itemThumb, styles.itemThumbEmpty]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkTextBold}>{it.name}</Text>
                  {it.description ? (
                    <Text style={styles.itemDesc} numberOfLines={2}>{it.description}</Text>
                  ) : null}
                  {it.placement ? (
                    <View style={styles.placementChip}>
                      <Text style={styles.placementChipText}>📍 {it.placement}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    )
  }

  const kitItems = order.kit_items || []
  const addonItems = order.addon_items || []
  if (kitItems.length === 0 && addonItems.length === 0) {
    const items = order.items || []
    if (items.length === 0) return null
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Items Checklist</Text>
        {items.map((it: any, i: number) => (
          <View key={i} style={styles.checkRow}>
            <Text style={[styles.checkBox, { color: '#22c55e' }]}>✓</Text>
            <Text style={[styles.checkText, { flex: 1 }]}>{it.name}{it.color ? ` (${it.color})` : ''}</Text>
            <Text style={styles.qtyMuted}>x{it.quantity}</Text>
          </View>
        ))}
      </View>
    )
  }
  return (
    <View style={styles.card}>
      {kitItems.length > 0 && (
        <>
          <Text style={styles.cardTitlePink}>Kit Items to Collect</Text>
          {kitItems.map((it: any, i: number) => (
            <View key={`k${i}`} style={styles.checkRow}>
              <Text style={styles.checkBox}>☑</Text>
              <Text style={[styles.checkText, { flex: 1 }]}>{it.quantity}x {it.name}{it.color ? ` (${it.color})` : ''}</Text>
            </View>
          ))}
        </>
      )}
      {addonItems.length > 0 && (
        <>
          <Text style={[styles.cardTitlePink, { color: '#7c3aed', marginTop: 10 }]}>Additional Single Items</Text>
          {addonItems.map((it: any, i: number) => (
            <View key={`a${i}`} style={styles.checkRow}>
              <Text style={[styles.checkBox, { color: '#a78bfa' }]}>＋</Text>
              <Text style={[styles.checkText, { flex: 1 }]}>{it.quantity}x {it.name}{it.color ? ` (${it.color})` : ''}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  )
}

function Row({ label, value, valueColor, bold, pill, pillColor }: {
  label: string; value: string; valueColor?: string; bold?: boolean; pill?: boolean; pillColor?: string
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {pill ? (
        <View style={[styles.rowPill, { backgroundColor: (pillColor || aurora.pink) + '22' }]}>
          <Text style={[styles.rowPillText, { color: pillColor || aurora.pink }]}>{value}</Text>
        </View>
      ) : (
        <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null, bold ? { fontWeight: '800' } : null]}>{value}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdf2f8' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 10 },
  backCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  backChevron: { fontSize: 22, color: '#4b5563', fontWeight: '700' },
  topTitle: { fontSize: 17, fontWeight: '800', color: '#1f2937', fontFamily: fonts.display },

  card: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  pinkCard: { backgroundColor: '#fdf2f8', borderColor: '#f9a8d4', borderWidth: 2 },
  blueCard: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  greenCard: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  orangeCard: { backgroundColor: '#fff7ed', borderColor: '#fed7aa', borderWidth: 2 },

  uppPink: { fontSize: 11, fontWeight: '800', color: aurora.pink, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  uppMuted: { fontSize: 10, fontWeight: '800', color: aurora.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  refGrid: { flexDirection: 'row', gap: 8 },
  refCol: { flex: 1 },
  refCell: { aspectRatio: 1, borderRadius: 10, borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  refCellImg: { width: '100%', height: '100%' },
  refCellEmpty: { fontSize: 10, color: aurora.textFaint },
  refCellLabel: { fontSize: 9, fontWeight: '700', color: '#6b7280', textAlign: 'center', marginTop: 4, lineHeight: 12 },
  skuCode: { fontSize: 9, color: aurora.textFaint, fontVariant: ['tabular-nums'], maxWidth: 120 },
  itemThumb: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  itemThumbEmpty: { backgroundColor: '#f9fafb', borderStyle: 'dashed' },
  refImg: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#fff' },
  decoratedImg: { width: '100%', height: 170, borderRadius: 14, backgroundColor: '#fce7f3' },
  centerHint: { fontSize: 11, color: '#6b7280', textAlign: 'center', marginTop: 8 },
  kitName: { fontSize: 18, fontWeight: '800', color: '#1f2937' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowLabel: { fontSize: 13, color: aurora.textFaint },
  rowValue: { fontSize: 13.5, color: '#374151', fontWeight: '600' },
  rowPill: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 },
  rowPillText: { fontSize: 11.5, fontWeight: '700', textTransform: 'capitalize' },
  collectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginVertical: 4 },
  collectLabel: { fontSize: 13, fontWeight: '700', color: '#15803d' },
  collectValue: { fontSize: 16, fontWeight: '900', color: '#16a34a' },

  addrTitle: { fontSize: 13.5, fontWeight: '800', color: '#374151', marginBottom: 4 },
  addrText: { fontSize: 13, color: '#4b5563', lineHeight: 19 },
  addrLandmark: { fontSize: 11.5, color: aurora.textFaint, marginTop: 3 },
  mapsBtn: { marginTop: 12, backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  mapsBtnText: { color: '#fff', fontWeight: '700', fontSize: 13.5 },
  copyBtn: { paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: '#bfdbfe', backgroundColor: '#fff' },
  copyBtnText: { color: '#3b82f6', fontWeight: '700', fontSize: 13 },

  cardTitle: { fontSize: 14, fontWeight: '800', color: '#374151', marginBottom: 8 },
  cardTitlePink: { fontSize: 13.5, fontWeight: '800', color: aurora.pinkDeep, marginBottom: 6 },
  cardTitleGreen: { fontSize: 14, fontWeight: '800', color: '#15803d', marginBottom: 6 },
  tinyMuted: { fontSize: 10, color: aurora.textFaint },
  catLabel: { fontSize: 10.5, fontWeight: '800', color: aurora.pink, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  checkBox: { fontSize: 15, color: aurora.pink },
  checkText: { fontSize: 12.5, color: '#4b5563' },
  checkTextBold: { fontSize: 12.5, color: '#1f2937', fontWeight: '700' },
  itemDesc: { fontSize: 10, color: '#6b7280', fontStyle: 'italic', lineHeight: 13, marginTop: 1 },
  placementChip: { alignSelf: 'flex-start', backgroundColor: '#fdf2f8', borderWidth: 1, borderColor: '#fce7f3', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3 },
  placementChipText: { fontSize: 9, fontWeight: '800', color: '#db2777' },
  qtyMuted: { fontSize: 11, color: aurora.textFaint },

  giftRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f9e8f1' },
  giftName: { fontSize: 13, color: '#374151' },
  giftPrice: { fontSize: 13, fontWeight: '700', color: aurora.pink },
  giftsTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#fbcfe8' },
  giftsTotalLabel: { fontSize: 13.5, fontWeight: '800', color: '#374151' },
  giftsTotalValue: { fontSize: 13.5, fontWeight: '800', color: aurora.pink },

  photoHint: { fontSize: 11.5, color: '#6b7280', lineHeight: 17, marginBottom: 10 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  photoThumbWrap: { width: '31%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#bbf7d0' },
  photoThumb: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  uploadBtn: { backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  uploadBtnText: { color: '#fff', fontWeight: '800', fontSize: 13.5 },

  primaryCta: { borderRadius: 18, paddingVertical: 16, shadowColor: '#c2185b', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  primaryCtaText: { color: '#fff', fontWeight: '800', fontSize: 14.5 },
  outlineCta: { borderRadius: 18, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#f9a8d4', backgroundColor: 'rgba(255,255,255,0.7)' },
  outlineCtaText: { color: aurora.pink, fontWeight: '700', fontSize: 13.5 },

  timerBig: { fontSize: 30, fontWeight: '900', color: '#ea580c', textAlign: 'center', marginTop: 4 },
  timerSub: { fontSize: 12, color: '#fb923c', textAlign: 'center', marginBottom: 12 },
  greenCta: { backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  extendHalf: { paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fdba74', backgroundColor: '#fff' },
  extendHalfText: { color: '#ea580c', fontWeight: '800', fontSize: 13.5 },
  greenCtaHalf: { flex: 1, backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  greenCtaText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  outlineHalf: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: '#f9a8d4', backgroundColor: '#fff' },

  callBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 14, paddingVertical: 14 },
  callBtnText: { color: '#16a34a', fontWeight: '800', fontSize: 14.5 },
})
