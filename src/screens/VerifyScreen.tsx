import React from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, StatusBar,
} from 'react-native'
import { useApp } from '../context/AppContext'
import { aurora, fonts } from '../lib/theme'
import { AuroraBackground, GradientButton } from '../components/Aurora'
import Toast from '../components/Toast'
import { useSafeArea } from '../lib/useSafeArea'
import { navigate } from '../navigation'

export default function VerifyScreen() {
  const {
    selectedOrder: o, loading,
    selfieImage, setSelfieImage, captureSelfie, submitSelfieProof,
    otpInput, setOtpInput, verifyOtp,
  } = useApp()
  const { headerTop } = useSafeArea()

  if (!o) {
    return <View style={styles.center}><ActivityIndicator color={aurora.pink} /></View>
  }

  // OTP step unlocks once the selfie proof is uploaded (status moved to arrived).
  const selfieUploaded = !!selfieImage && (o.delivery_status === 'arrived' || (o as any).selfie_proof)
  const otpValid = otpInput.length === 4 || otpInput.length === 6

  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground />
      <StatusBar barStyle="dark-content" />
      <Toast />

      <View style={[styles.topBar, { paddingTop: headerTop }]}>
        <TouchableOpacity onPress={() => navigate('Order')} style={styles.backCircle}><Text style={styles.backChevron}>‹</Text></TouchableOpacity>
        <Text style={styles.topTitle}>Check-in at Customer Site</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }} showsVerticalScrollIndicator={false}>
        {/* Honest disclaimer */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️  Snap a selfie at the customer's door as proof of arrival. This is uploaded for record only — it is
            <Text style={{ fontWeight: '800' }}> not</Text> biometric verification. The customer's OTP below confirms your identity.
          </Text>
        </View>

        {/* Step 1: Selfie */}
        <View style={styles.card}>
          <View style={styles.stepHead}>
            <View style={[styles.stepNum, selfieImage ? { backgroundColor: '#22c55e' } : { backgroundColor: aurora.pink }]}>
              <Text style={styles.stepNumText}>{selfieImage ? '✓' : '1'}</Text>
            </View>
            <Text style={styles.stepTitle}>Selfie Proof at Customer Site</Text>
          </View>
          <Text style={styles.stepHint}>Take a quick selfie so the customer and office have a record of your arrival.</Text>

          {!selfieImage ? (
            <GradientButton style={styles.cta} onPress={captureSelfie}>
              <Text style={styles.ctaText}>📷  Capture Selfie</Text>
            </GradientButton>
          ) : (
            <>
              <Image source={{ uri: selfieImage }} style={styles.selfiePreview} resizeMode="cover" />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={styles.retakeBtn} onPress={() => { setSelfieImage(null); captureSelfie() }} activeOpacity={0.85}>
                  <Text style={styles.retakeText}>Retake</Text>
                </TouchableOpacity>
                <GradientButton style={[styles.cta, { flex: 1 }]} onPress={() => submitSelfieProof(o.id)} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Upload Proof</Text>}
                </GradientButton>
              </View>
            </>
          )}
        </View>

        {/* Step 2: OTP */}
        <View style={[styles.card, !selfieUploaded && { opacity: 0.45 }]} pointerEvents={selfieUploaded ? 'auto' : 'none'}>
          <View style={styles.stepHead}>
            <View style={[styles.stepNum, { backgroundColor: aurora.pink }]}><Text style={styles.stepNumText}>2</Text></View>
            <Text style={styles.stepTitle}>Enter Customer OTP</Text>
          </View>
          <Text style={styles.stepHint}>Ask the customer for the verification code they received over SMS/email.</Text>
          <TextInput
            style={styles.otpInput}
            placeholder="Enter OTP"
            placeholderTextColor="#d1d5db"
            value={otpInput}
            onChangeText={(t) => setOtpInput(t.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
          />
          <GradientButton style={[styles.cta, { marginTop: 12 }]} onPress={() => verifyOtp(o.id)} disabled={loading || !otpValid}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>🔑  Verify & Start Decorating</Text>}
          </GradientButton>
        </View>
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

  infoBox: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 14, padding: 14 },
  infoText: { fontSize: 12, color: '#1d4ed8', lineHeight: 18 },

  card: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  stepTitle: { fontSize: 14, fontWeight: '800', color: '#374151' },
  stepHint: { fontSize: 12, color: aurora.textFaint, marginBottom: 12, lineHeight: 17 },

  cta: { borderRadius: 14, paddingVertical: 14, shadowColor: '#c2185b', shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  selfiePreview: { width: '100%', height: 220, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  retakeBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  retakeText: { color: '#6b7280', fontWeight: '700', fontSize: 14 },

  otpInput: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, paddingVertical: 16, textAlign: 'center', fontSize: 24, fontWeight: '800', letterSpacing: 12, color: '#111827', backgroundColor: '#fafafa' },
})
