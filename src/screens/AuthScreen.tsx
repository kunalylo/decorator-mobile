import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Pressable, StatusBar,
} from 'react-native'
import { useApp } from '../context/AppContext'
import { LOGO_SRC } from '../lib/constants'
import Toast from '../components/Toast'
import { useSafeArea } from '../lib/useSafeArea'
import { aurora, fonts } from '../lib/theme'
import { AuroraBackground, GradientView, GradientButton } from '../components/Aurora'

type View_ = 'landing' | 'apply' | 'login'

const PERKS = [
  { icon: '⚡', title: 'Get Jobs Instantly',  sub: 'Receive decoration orders right on your phone' },
  { icon: '⭐', title: 'Earn More',           sub: 'Set your own schedule and maximize earnings' },
  { icon: '🛡️', title: 'Verified & Trusted',  sub: 'Join a platform customers trust for quality' },
]

export default function AuthScreen() {
  const { loading, handleLogin, contactSupport } = useApp()
  const { headerTop } = useSafeArea()
  const [view, setView] = useState<View_>('landing')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // ── Landing ──
  if (view === 'landing') {
    return (
      <View style={{ flex: 1 }}>
        <AuroraBackground />
        <StatusBar barStyle="dark-content" />
        <Toast />
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: headerTop + 24, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.heroWrap}>
            <View style={styles.logoWrap}>
              <Image source={LOGO_SRC} style={styles.logoImg} />
            </View>
            <Text style={styles.brandName}>FatafatDecor</Text>
            <Text style={styles.subtitle}>Decorator Partner App</Text>
            <Text style={styles.heroHint}>Join our network of professional decorators and grow your business</Text>
          </View>

          {/* Perks */}
          <View style={{ paddingHorizontal: 24, gap: 12, marginTop: 18 }}>
            {PERKS.map((p) => (
              <View key={p.title} style={styles.perkRow}>
                <View style={styles.perkIcon}>
                  <Text style={{ fontSize: 20 }}>{p.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.perkTitle}>{p.title}</Text>
                  <Text style={styles.perkSub}>{p.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* CTAs */}
          <View style={{ paddingHorizontal: 24, marginTop: 28, gap: 12 }}>
            <GradientButton style={styles.primaryBtn} onPress={() => setView('apply')}>
              <Text style={styles.primaryBtnText}>⭐  Get Certified Decorator  →</Text>
            </GradientButton>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setView('login')} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>Already a Decorator? Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    )
  }

  // ── Apply ──
  if (view === 'apply') {
    return (
      <View style={{ flex: 1 }}>
        <AuroraBackground />
        <StatusBar barStyle="dark-content" />
        <Toast />
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: headerTop }} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => setView('landing')} style={styles.backRow}>
            <View style={styles.backCircle}><Text style={styles.backChevron}>‹</Text></View>
            <Text style={styles.backLabel}>Back</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={styles.logoWrapSm}><Image source={LOGO_SRC} style={styles.logoImgSm} /></View>
            <Text style={styles.titlePink}>Become a Decorator</Text>
            <Text style={styles.subtitleMuted}>Join the FatafatDecor partner network</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.applyBody}>
              To become a certified FatafatDecor decorator, please contact our team. We'll verify your details
              and set up your partner account so you can start receiving decoration orders.
            </Text>
            <TouchableOpacity style={styles.whatsappBtn} onPress={contactSupport} activeOpacity={0.85}>
              <Text style={styles.whatsappIcon}>💬</Text>
              <Text style={styles.whatsappText}>Contact us on WhatsApp</Text>
            </TouchableOpacity>
            <Text style={styles.switchHint}>
              Already a decorator?{' '}
              <Text style={styles.switchLink} onPress={() => setView('login')}>Login</Text>
            </Text>
          </View>
        </ScrollView>
      </View>
    )
  }

  // ── Login ──
  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground />
      <StatusBar barStyle="light-content" />
      <Toast />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <GradientView colors={aurora.header} style={[styles.hero, { paddingTop: headerTop + 14 }]}>
            <TouchableOpacity onPress={() => setView('landing')} style={styles.heroBack}>
              <Text style={styles.heroBackText}>‹  Back</Text>
            </TouchableOpacity>
            <View style={styles.logoWrap}><Image source={LOGO_SRC} style={styles.logoImg} /></View>
            <Text style={styles.brandNameLight}>Welcome Back</Text>
            <Text style={styles.tagline}>Sign in to your decorator account</Text>
          </GradientView>

          <View style={styles.loginCard}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor="#c4c4c4"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
            />
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Password</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[styles.input, { paddingRight: 48 }]}
                placeholder="Your password"
                placeholderTextColor="#c4c4c4"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword((p) => !p)} style={styles.eyeBtn}>
                <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
              </Pressable>
            </View>

            <GradientButton
              style={[styles.pinkBtn, { marginTop: 20 }]}
              onPress={() => handleLogin(phone, password)}
              disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.pinkBtnText}>Login →</Text>}
            </GradientButton>

            <Text style={styles.switchHint}>
              Not registered?{' '}
              <Text style={styles.switchLink} onPress={() => setView('apply')}>Get Certified</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  heroWrap: { alignItems: 'center', paddingHorizontal: 24 },
  logoWrap: { width: 104, height: 104, borderRadius: 52, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 4, borderColor: 'rgba(255,255,255,0.7)', shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 16, elevation: 12 },
  logoImg: { width: 104, height: 104 },
  logoWrapSm: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, elevation: 8 },
  logoImgSm: { width: 80, height: 80 },
  brandName: { fontSize: 30, fontWeight: '900', color: aurora.pinkDeep, marginTop: 14, fontFamily: fonts.display, letterSpacing: -0.5 },
  brandNameLight: { fontSize: 26, fontWeight: '900', color: '#fff', marginTop: 12, fontFamily: fonts.display },
  subtitle: { fontSize: 13, color: aurora.textMuted, marginTop: 4 },
  subtitleMuted: { fontSize: 13, color: aurora.textFaint, marginTop: 4 },
  heroHint: { fontSize: 12, color: aurora.textFaint, marginTop: 6, textAlign: 'center', maxWidth: 280, lineHeight: 18 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 5 },

  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(252,231,243,0.6)', borderRadius: 20, padding: 16 },
  perkIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  perkTitle: { fontSize: 14, fontWeight: '800', color: '#374151' },
  perkSub: { fontSize: 11.5, color: aurora.textFaint, marginTop: 2 },

  primaryBtn: { borderRadius: 18, paddingVertical: 17, shadowColor: '#c2185b', shadowOpacity: 0.45, shadowRadius: 14, elevation: 7 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15.5, letterSpacing: 0.3 },
  secondaryBtn: { borderRadius: 18, paddingVertical: 16, alignItems: 'center', borderWidth: 2, borderColor: '#fbcfe8', backgroundColor: 'rgba(255,255,255,0.6)' },
  secondaryBtnText: { color: aurora.pink, fontWeight: '700', fontSize: 14 },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  backCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fce7f3' },
  backChevron: { color: aurora.pink, fontSize: 20, fontWeight: '700' },
  backLabel: { fontSize: 15, fontWeight: '700', color: '#6b7280' },

  titlePink: { fontSize: 22, fontWeight: '900', color: aurora.pinkDeep, marginTop: 12, fontFamily: fonts.display },

  card: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 24, padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', shadowColor: '#c2185b', shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  applyBody: { fontSize: 13.5, color: '#4b5563', lineHeight: 21, textAlign: 'center', marginBottom: 18 },
  whatsappBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#25D366', borderRadius: 14, paddingVertical: 14 },
  whatsappIcon: { fontSize: 18 },
  whatsappText: { color: '#fff', fontWeight: '800', fontSize: 14.5 },

  hero: { paddingHorizontal: 24, paddingBottom: 48, alignItems: 'center' },
  heroBack: { position: 'absolute', left: 18, top: 0, paddingVertical: 8, paddingHorizontal: 6 },
  heroBackText: { color: 'rgba(255,255,255,0.95)', fontSize: 15, fontWeight: '700' },

  loginCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderTopLeftRadius: 34, borderTopRightRadius: 34, marginTop: -28, padding: 24, minHeight: 360, shadowColor: '#c2185b', shadowOpacity: 0.12, shadowRadius: 24, elevation: 10 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, letterSpacing: 0.3 },
  input: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#111827', backgroundColor: '#fafafa' },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },

  pinkBtn: { borderRadius: 16, paddingVertical: 16, shadowColor: '#c2185b', shadowOpacity: 0.45, shadowRadius: 14, elevation: 7 },
  pinkBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.4 },

  switchHint: { fontSize: 12, color: aurora.textFaint, textAlign: 'center', marginTop: 16 },
  switchLink: { color: aurora.pink, fontWeight: '700' },
})
