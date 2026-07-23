import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, StatusBar,
} from 'react-native'
import { useApp } from '../context/AppContext'
import { aurora, fonts } from '../lib/theme'
import { AuroraBackground } from '../components/Aurora'
import BottomNav from '../components/BottomNav'
import Toast from '../components/Toast'
import { useSafeArea } from '../lib/useSafeArea'
import { rs } from '../lib/utils'

export default function ProfileScreen() {
  const { dpUser, earnings, handleLogout, changePassword, loading, cities, updateCity, detectCity, detectingLocation } = useApp()
  const { headerTop } = useSafeArea()
  const e = earnings || ({} as any)

  const [showPwd, setShowPwd] = useState(false)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')

  const memberSince = dpUser?.created_at
    ? new Date(dpUser.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })
    : 'N/A'

  const onChangePwd = async () => {
    const ok = await changePassword(currentPwd, newPwd)
    if (ok) { setShowPwd(false); setCurrentPwd(''); setNewPwd('') }
  }

  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground />
      <StatusBar barStyle="dark-content" />
      <Toast />

      <View style={[styles.head, { paddingTop: headerTop }]}>
        <Text style={styles.title}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 14 }} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={{ fontSize: 30 }}>🚚</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{dpUser?.name}</Text>
            <Text style={styles.phone}>📞 {dpUser?.phone}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <View style={styles.rolePill}><Text style={styles.rolePillText}>Decorator</Text></View>
              <View style={styles.ratingPill}><Text style={styles.ratingPillText}>⭐ {dpUser?.rating ?? '5.0'}</Text></View>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Stat icon="📦" value={String(dpUser?.total_deliveries ?? 0)} label="Deliveries" />
          <Stat icon="💰" value={rs(e.total_collected || 0)} label="Collected" green />
          <Stat icon="💵" value={rs(e.cash_pending || 0)} label="Cash Pending" orange={(e.cash_pending || 0) > 0} />
        </View>

        {/* Account details */}
        <View style={styles.card}>
          <DetailRow label="Status" pill pillText={dpUser?.is_active === false ? 'Inactive' : 'Active'} pillColor={dpUser?.is_active === false ? '#ef4444' : '#16a34a'} />
          <DetailRow label="Member Since" value={memberSince} />
          <DetailRow label="Rating" value={`⭐ ${dpUser?.rating ?? '5.0'}`} />
        </View>

        {/* Your City — you only receive orders/notifications from this city */}
        <View style={[styles.card, !dpUser?.city && { borderColor: '#f9a8d4', borderWidth: 1.5, backgroundColor: '#fdf2f8' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={styles.cityTitle}>Your City</Text>
            <Text style={[styles.cityValue, { color: dpUser?.city ? '#16a34a' : aurora.pink }]}>{dpUser?.city || 'Not set'}</Text>
          </View>
          <Text style={styles.cityHint}>Auto-detected from your location — you only get orders from the city you're currently in.</Text>
          <TouchableOpacity style={[styles.detectBtn, detectingLocation && { opacity: 0.7 }]} disabled={loading || detectingLocation} onPress={() => detectCity({ announce: true })} activeOpacity={0.85}>
            <Text style={styles.detectBtnText}>{detectingLocation ? '📍  Detecting your location…' : '📍  Update from my location'}</Text>
          </TouchableOpacity>
          <Text style={[styles.cityHint, { marginTop: 10, marginBottom: 6 }]}>or set it manually:</Text>
          <View style={styles.cityChips}>
            {cities.length === 0
              ? <Text style={styles.cityHint}>Loading cities…</Text>
              : cities.map((c) => {
                  const active = !!dpUser?.city && dpUser.city.toLowerCase() === c.name.toLowerCase()
                  return (
                    <TouchableOpacity
                      key={c.id || c.name}
                      disabled={loading}
                      onPress={() => updateCity(c.name)}
                      style={[styles.cityChip, active && styles.cityChipActive]}
                      activeOpacity={0.85}>
                      <Text style={[styles.cityChipText, active && styles.cityChipTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  )
                })}
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowPwd(true)} activeOpacity={0.85}>
          <Text style={styles.outlineBtnText}>🔑  Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutBtnText}>⎋  Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>FatafatDecor Partner App v1.0</Text>
      </ScrollView>

      {/* Change password modal */}
      <Modal visible={showPwd} transparent animationType="fade" onRequestClose={() => setShowPwd(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => { setShowPwd(false); setCurrentPwd(''); setNewPwd('') }} style={styles.modalClose}>
                <Text style={{ fontSize: 16, color: '#6b7280' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Current Password" placeholderTextColor="#c4c4c4" secureTextEntry value={currentPwd} onChangeText={setCurrentPwd} />
            <TextInput style={[styles.input, { marginTop: 10 }]} placeholder="New Password (min 4 chars)" placeholderTextColor="#c4c4c4" secureTextEntry value={newPwd} onChangeText={setNewPwd} />
            <TouchableOpacity style={[styles.depositBtn, { marginTop: 14 }]} disabled={loading} onPress={onChangePwd} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.depositBtnText}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNav active="Profile" />
    </View>
  )
}

function Stat({ icon, value, label, green, orange }: { icon: string; value: string; label: string; green?: boolean; orange?: boolean }) {
  return (
    <View style={[styles.statCard, orange && { backgroundColor: '#fff7ed', borderColor: '#fdba74' }]}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={[styles.statValue, green && { color: '#16a34a' }, orange && { color: '#ea580c' }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function DetailRow({ label, value, pill, pillText, pillColor }: { label: string; value?: string; pill?: boolean; pillText?: string; pillColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {pill ? (
        <View style={[styles.detailPill, { backgroundColor: (pillColor || '#16a34a') + '22' }]}>
          <Text style={[styles.detailPillText, { color: pillColor || '#16a34a' }]}>{pillText}</Text>
        </View>
      ) : (
        <Text style={styles.detailValue}>{value}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 18, paddingBottom: 8 },
  title: { fontSize: 19, fontWeight: '800', color: '#1f2937', fontFamily: fonts.display },

  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#fdf2f8', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#fbcfe8' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: aurora.pink, alignItems: 'center', justifyContent: 'center', shadowColor: '#c2185b', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  name: { fontSize: 18, fontWeight: '800', color: '#1f2937', fontFamily: fonts.display },
  phone: { fontSize: 13, color: aurora.textFaint, marginTop: 2 },
  rolePill: { backgroundColor: aurora.pink, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 3 },
  rolePillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  ratingPill: { backgroundColor: '#fef9c3', borderRadius: 9, paddingHorizontal: 9, paddingVertical: 3 },
  ratingPillText: { color: '#ca8a04', fontSize: 11, fontWeight: '700' },

  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  statValue: { fontSize: 14.5, fontWeight: '900', color: '#1f2937', marginTop: 4 },
  statLabel: { fontSize: 9.5, color: aurora.textFaint, marginTop: 2 },

  card: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  detailLabel: { fontSize: 13, color: aurora.textFaint },
  detailValue: { fontSize: 13.5, color: '#374151', fontWeight: '600' },
  detailPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  detailPillText: { fontSize: 11.5, fontWeight: '700' },

  cityTitle: { fontSize: 14, fontWeight: '800', color: '#374151' },
  cityValue: { fontSize: 13, fontWeight: '800' },
  cityHint: { fontSize: 11.5, color: aurora.textFaint, marginBottom: 10, lineHeight: 16 },
  detectBtn: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  detectBtnText: { color: '#fff', fontWeight: '800', fontSize: 13.5 },
  cityChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  cityChipActive: { backgroundColor: aurora.pink, borderColor: aurora.pink },
  cityChipText: { fontSize: 12.5, fontWeight: '700', color: '#6b7280' },
  cityChipTextActive: { color: '#fff' },
  outlineBtn: { borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: 'rgba(255,255,255,0.7)' },
  outlineBtnText: { color: '#4b5563', fontWeight: '700', fontSize: 14 },
  logoutBtn: { borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#fecaca', backgroundColor: 'rgba(254,242,242,0.7)' },
  logoutBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },
  version: { fontSize: 10.5, color: '#d1d5db', textAlign: 'center', marginTop: 6 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', backgroundColor: '#fff', borderRadius: 22, padding: 22 },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#1f2937' },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#111827', backgroundColor: '#fafafa' },
  depositBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: aurora.pink },
  depositBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
})
