import React, {
  createContext, useContext, useState, useEffect,
  useRef, useCallback, useMemo, ReactNode,
} from 'react'
import { Linking, Platform } from 'react-native'
import * as Location from 'expo-location'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system/legacy'

// Guard Razorpay — native module, not available in Expo Go.
// react-native-razorpay is CommonJS; handle both CJS and ESM interop.
let RazorpayCheckout: any = null
try {
  const rzp = require('react-native-razorpay')
  RazorpayCheckout = rzp?.default ?? rzp
} catch { /* not available in Expo Go — will show a toast instead */ }

import api, { setAuthExpiredHandler } from '../lib/api'
import { storage } from '../lib/storage'
import { SUPPORT_PHONE, JOB_DURATION_SECONDS, TIMER_EXTEND_SECONDS } from '../lib/constants'
import { buildMapsUrl } from '../lib/utils'
import { setupNotifications, alertNewOrders } from '../lib/notify'
import { navigate, replace } from '../navigation'

// ── Types ──────────────────────────────────────────────────────────────────
export interface DpUser {
  id: string; name: string; phone: string
  rating?: number; total_deliveries?: number
  is_active?: boolean; created_at?: string
  city?: string
  token?: string
}
export interface City { id?: string; name: string; state?: string }
export interface ScheduleConflict { kind: string; date?: string | null; hour?: number | null }
export interface Order {
  id: string; user_id: string; design_id?: string
  schedule_conflict?: ScheduleConflict | null
  total_cost: number; payment_status: string; payment_amount?: number
  delivery_status: string
  delivery_address?: string; delivery_landmark?: string
  delivery_lat?: number; delivery_lng?: number
  delivery_slot?: { date: string; hour: number }
  items?: any[]; kit_name?: string; kit_items?: any[]; addon_items?: any[]
  decorated_image?: string | null
  customer?: { name?: string; phone?: string; email?: string }
  completion_photos?: any[]
  has_gifts?: boolean; gift_items?: any[]
  flow?: string; reference_image_url?: string; reference_thumbnail_url?: string
  original_image_url?: string
  accepted_decorators?: string[]; assigned_decorators?: string[]
  created_at?: string
}
export interface GiftOrder {
  id: string; user_id: string
  schedule_conflict?: ScheduleConflict | null
  gift_items?: any[]; gift_total?: number
  payment_status: string; delivery_status: string
  delivery_address?: string; delivery_landmark?: string
  delivery_lat?: number; delivery_lng?: number
  delivery_slot?: { date: string; hour: number }
  customer?: { name?: string; phone?: string; email?: string }
  created_at?: string
}
export interface Dashboard {
  delivery_person: DpUser
  today_orders: Order[]
  active_orders: Order[]
  pending_orders: Order[]
  pending_gift_orders: GiftOrder[]
  active_gift_orders?: GiftOrder[]
  date: string
}
export interface Earnings {
  total_collected: number; cash_collected: number
  cash_deposited: number; cash_pending: number
  recent_collections: any[]; recent_deposits: any[]
}
interface Toast { msg: string; type: 'success' | 'error' | 'info' }

// ── Context type ───────────────────────────────────────────────────────────
interface AppContextType {
  dpUser: DpUser | null
  loading: boolean
  toast: Toast | null
  dashboard: Dashboard | null
  orders: Order[]
  pendingOrders: Order[]
  pendingGiftOrders: GiftOrder[]
  activeGiftOrders: GiftOrder[]
  selectedOrder: Order | null; setSelectedOrder: React.Dispatch<React.SetStateAction<Order | null>>
  selectedGiftOrder: GiftOrder | null; setSelectedGiftOrder: React.Dispatch<React.SetStateAction<GiftOrder | null>>
  earnings: Earnings | null
  calendarData: any; calMonth: string; setCalMonth: (m: string) => void
  // selfie + otp flow
  selfieImage: string | null; setSelfieImage: (s: string | null) => void
  otpInput: string; setOtpInput: (s: string) => void
  // active-job timer — stable end timestamp; screens tick locally via useCountdown()
  activeTimerOrderId: string | null
  timerEndAt: number | null

  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
  refreshAll: () => void
  refreshDashboard: () => void

  handleLogin: (phone: string, password: string) => Promise<void>
  handleLogout: () => void

  openOrderDetail: (orderId: string) => Promise<void>
  handleAcceptOrder: (orderId: string) => Promise<void>
  handleDeclineOrder: (orderId: string) => Promise<void>
  handleStartNavigation: (order: Order) => Promise<void>
  captureSelfie: () => Promise<void>
  submitSelfieProof: (orderId: string) => Promise<void>
  verifyOtp: (orderId: string) => Promise<void>
  handleComplete: (orderId: string) => Promise<void>
  extendTimer: () => void
  collectCash: (orderId: string, amount: number) => Promise<void>
  collectOnline: (order: Order) => Promise<void>
  uploadCompletionPhotos: (orderId: string) => Promise<void>
  removeCompletionPhoto: (orderId: string, index: number) => Promise<void>

  handleAcceptGiftOrder: (orderId: string) => Promise<void>
  handleDeclineGiftOrder: (orderId: string) => Promise<void>
  openGiftOrderDetail: (orderId: string) => Promise<void>
  updateGiftStatus: (orderId: string, status: string) => Promise<void>
  giftOtpInput: string; setGiftOtpInput: (s: string) => void
  generateGiftOtp: (orderId: string) => Promise<void>
  verifyGiftOtp: (orderId: string) => Promise<void>

  depositCash: (amount: number, method: string, ref: string) => Promise<boolean>
  changePassword: (currentPw: string, newPw: string) => Promise<boolean>
  cities: City[]
  updateCity: (city: string) => Promise<boolean>
  detectCity: (opts?: { announce?: boolean }) => Promise<void>
  detectingLocation: boolean

  openMaps: (order: any) => void
  callCustomer: (phone?: string) => void
  contactSupport: () => void
}

const AppContext = createContext<AppContextType>({} as AppContextType)
export const useApp = () => useContext(AppContext)

const TOKEN_KEY = 'dp_token'
const USER_KEY  = 'fd_dp_user'
const TIMER_KEY = 'fd_dp_timer'

// ── Provider ───────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [dpUser, setDpUserState] = useState<DpUser | null>(null)
  const [loading, setLoading]    = useState(false)
  const [toast, setToast]        = useState<Toast | null>(null)
  const [dashboard, setDashboard]           = useState<Dashboard | null>(null)
  const [orders, setOrders]                 = useState<Order[]>([])
  const [pendingOrders, setPendingOrders]   = useState<Order[]>([])
  const [pendingGiftOrders, setPendingGiftOrders] = useState<GiftOrder[]>([])
  const [activeGiftOrders, setActiveGiftOrders] = useState<GiftOrder[]>([])
  const [selectedOrder, setSelectedOrder]   = useState<Order | null>(null)
  const [selectedGiftOrder, setSelectedGiftOrder] = useState<GiftOrder | null>(null)
  const [earnings, setEarnings]             = useState<Earnings | null>(null)
  const [calendarData, setCalendarData]     = useState<any>(null)
  const [calMonth, setCalMonth]             = useState(() => new Date().toISOString().slice(0, 7))
  const [selfieImage, setSelfieImage]       = useState<string | null>(null)
  const [otpInput, setOtpInput]             = useState('')
  const [giftOtpInput, setGiftOtpInput]     = useState('')
  const [activeTimerOrderId, setActiveTimerOrderId] = useState<string | null>(null)
  const [timerEndAt, setTimerEndAt]         = useState<number | null>(null)
  const [cities, setCities]                 = useState<City[]>([])
  const [detectingLocation, setDetectingLocation] = useState(false)

  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seenOrderIds = useRef<Set<string>>(new Set())
  const primedRef = useRef(false)
  const authExpiredFiring = useRef(false)
  const lastDashJson = useRef('')

  // ── Toast ──────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast({ msg, type })
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000)
  }, [])

  // ── Persist user ─────────────────────────────────────────────────────────
  const setDpUser = useCallback(async (u: DpUser | null) => {
    if (u) {
      if (u.token) await storage.set(TOKEN_KEY, u.token)
      const { token, ...userOnly } = u
      await storage.set(USER_KEY, JSON.stringify(userOnly))
      setDpUserState(userOnly)
    } else {
      await storage.remove(TOKEN_KEY)
      await storage.remove(USER_KEY)
      setDpUserState(null)
    }
  }, [])

  // ── Hydrate stored session + active timer on mount ─────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        const saved = await storage.get(USER_KEY)
        const token = await storage.get(TOKEN_KEY)
        // Require BOTH user + token to restore — otherwise force re-login.
        if (saved && token) {
          const parsed = JSON.parse(saved)
          if (parsed?.id) {
            setDpUserState(parsed)
            setupNotifications()
          }
        } else {
          await storage.remove(USER_KEY)
          await storage.remove(TOKEN_KEY)
        }
      } catch {
        await storage.remove(USER_KEY)
        await storage.remove(TOKEN_KEY)
      }
      // Restore a job timer that was in progress
      try {
        const t = await storage.get(TIMER_KEY)
        if (t) {
          const { orderId, endTime } = JSON.parse(t)
          const remaining = Math.floor((endTime - Date.now()) / 1000)
          if (remaining > 0) {
            setActiveTimerOrderId(orderId)
            setTimerEndAt(endTime)
            // Reload the order so the Active Job screen + "Complete" work after an app relaunch.
            api.get(`dp/order-detail/${orderId}`).then((d: any) => { if (d && !d.error) setSelectedOrder(d) }).catch(() => {})
          } else {
            await storage.remove(TIMER_KEY)
          }
        }
      } catch { await storage.remove(TIMER_KEY) }
    })()
  }, [])

  // ── 401 auto-logout handler ───────────────────────────────────────────────
  const wipeSession = useCallback(() => {
    storage.remove(TOKEN_KEY)
    storage.remove(USER_KEY)
    storage.remove(TIMER_KEY)
    seenOrderIds.current = new Set()
    primedRef.current = false
    setDpUserState(null)
    setDashboard(null)
    setOrders([])
    setPendingOrders([])
    setPendingGiftOrders([])
    setActiveGiftOrders([])
    setSelectedOrder(null)
    setSelectedGiftOrder(null)
    setEarnings(null)
    setCalendarData(null)
    setActiveTimerOrderId(null)
    setTimerEndAt(null)
    setSelfieImage(null)
    setOtpInput('')
    lastDashJson.current = ''
  }, [])

  useEffect(() => {
    setAuthExpiredHandler(() => {
      if (authExpiredFiring.current) return
      authExpiredFiring.current = true
      wipeSession()
      setToast({ msg: 'Session expired. Please login again.', type: 'error' })
      setTimeout(() => setToast(null), 3500)
      replace('Auth')
      setTimeout(() => { authExpiredFiring.current = false }, 5000)
    })
  }, [wipeSession])

  // ── New-order alerts ───────────────────────────────────────────────────────
  const alertIncoming = useCallback((count: number) => {
    alertNewOrders(count)
    showToast(count === 1 ? '🎉 New order available! Tap Dashboard to accept.' : `🎉 ${count} new orders available!`, 'success')
  }, [showToast])

  // ── Dashboard refresh (also primes the new-order detector) ─────────────────
  const refreshDashboard = useCallback(() => {
    if (!dpUser?.id) return
    api.get(`dp/dashboard/${dpUser.id}`).then((d: any) => {
      if (d?.error) return
      // Identical payload (the common case on a 15s poll) → skip every setState so
      // the whole tree doesn't re-render for nothing.
      const fingerprint = JSON.stringify(d)
      if (fingerprint === lastDashJson.current) return
      lastDashJson.current = fingerprint
      setDashboard(d)
      // Keep the stored profile in sync with the server — the SecureStore copy can go stale
      // (city changed elsewhere, or a served city removed from admin) and otherwise shows an
      // outdated "Your City".
      if (d.delivery_person) {
        setDpUserState((prev) => {
          if (!prev) return prev
          const s = d.delivery_person
          if (prev.city === s.city && prev.rating === s.rating && prev.total_deliveries === s.total_deliveries && prev.is_active === s.is_active) return prev
          const updated = { ...prev, city: s.city, rating: s.rating, total_deliveries: s.total_deliveries, is_active: s.is_active }
          storage.set(USER_KEY, JSON.stringify(updated))
          return updated
        })
      }
      const pending = d.pending_orders || []
      const pendingGifts = d.pending_gift_orders || []
      setPendingOrders(pending)
      setPendingGiftOrders(pendingGifts)
      setActiveGiftOrders(d.active_gift_orders || [])
      const incomingIds = [...pending, ...pendingGifts].map((o: any) => o.id)
      if (!primedRef.current) {
        incomingIds.forEach((id: string) => seenOrderIds.current.add(id))
        primedRef.current = true
      } else {
        const fresh = incomingIds.filter((id: string) => !seenOrderIds.current.has(id))
        fresh.forEach((id: string) => seenOrderIds.current.add(id))
        if (fresh.length > 0) alertIncoming(fresh.length)
      }
    })
  }, [dpUser?.id, alertIncoming])

  const refreshAll = useCallback(() => {
    if (!dpUser?.id) return
    refreshDashboard()
    api.get(`dp/orders/${dpUser.id}`).then((d: any) => { if (!d?.error && Array.isArray(d)) setOrders(d) })
    api.get(`dp/earnings/${dpUser.id}`).then((d: any) => { if (!d?.error) setEarnings(d) })
    api.get('cities').then((d: any) => { if (Array.isArray(d)) setCities(d) })
  }, [dpUser?.id, refreshDashboard])

  // Decorator sets the city they currently work in → only gets orders from that city.
  const updateCity = useCallback(async (city: string): Promise<boolean> => {
    setLoading(true)
    try {
      const data: any = await api.post('dp/update-city', { city })
      if (data.error) { showToast(data.error, 'error'); return false }
      setDpUserState((prev) => {
        if (!prev) return prev
        const updated = { ...prev, city: data.city }
        storage.set(USER_KEY, JSON.stringify(updated))
        return updated
      })
      showToast(`City set to ${data.city}. You'll now get orders from ${data.city} only.`, 'success')
      return true
    } catch { showToast('Could not update city', 'error'); return false }
    finally { setLoading(false) }
  }, [showToast])

  // Auto-detect the decorator's city from their CURRENT GPS location (built-in reverse geocoder,
  // no API key). Keeps city in sync with where they actually are, so a Pune decorator never gets
  // Ranchi orders. Silent: if permission is denied the manual city picker stays as the fallback.
  // `announce=true` (the Profile button) gives feedback for EVERY outcome — permission off,
  // GPS off, not-served, error — so the button never looks dead. The silent auto-call on login
  // passes announce=false so it doesn't nag.
  const detectCity = useCallback(async (opts?: { announce?: boolean }): Promise<void> => {
    const announce = !!opts?.announce
    const say = (msg: string, type: 'success' | 'error' | 'info' = 'info') => { if (announce) showToast(msg, type) }
    if (announce) setDetectingLocation(true)
    try {
      const perm = await Location.requestForegroundPermissionsAsync()
      if (perm.status !== 'granted') {
        say(perm.canAskAgain
          ? 'Location permission is needed to detect your city.'
          : 'Location is off for this app. Enable it in Settings → FatafatDecor Partner → Location.', 'error')
        return
      }
      let pos: Location.LocationObject
      try {
        pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      } catch {
        say('Couldn’t get your location. Make sure GPS/location is on, then try again.', 'error'); return
      }
      let address = '', place = ''
      try {
        const places = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        const p: any = places?.[0]
        if (p) {
          place = p.city || p.subregion || p.district || ''
          address = [p.city, p.district, p.subregion, p.region, p.name].filter(Boolean).join(', ')
        }
      } catch { /* geocoder unavailable — backend can still match on the raw place */ }
      const data: any = await api.post('dp/detect-city', { lat: pos.coords.latitude, lng: pos.coords.longitude, address, city: place })
      if (data?.error) { say(data.error, 'error'); return }
      if (data.city) {
        setDpUserState((prev) => {                            // always reflect the real location
          if (!prev) return prev
          const updated = { ...prev, city: data.city }
          storage.set(USER_KEY, JSON.stringify(updated))
          return updated
        })
        if (data.served) {
          say(`📍 You're in ${data.city} — now showing ${data.city} orders`, 'success')
          refreshDashboard()   // surface that city's orders immediately
        } else {
          say(`📍 Location set to ${data.city}. No service area here yet — you'll get orders once you're in one.`, 'info')
        }
      } else {
        say('Couldn’t read your location. Make sure GPS/location is on, then try again.', 'error')
      }
    } catch {
      say('Couldn’t update your location. Please try again.', 'error')
    } finally {
      if (announce) setDetectingLocation(false)
    }
  }, [showToast, refreshDashboard])

  // Load all data + poll every 15s while logged in; detect current city from GPS on login.
  useEffect(() => {
    if (!dpUser?.id) return
    refreshAll()
    detectCity({ announce: false })   // silent on login; the Profile button announces
    const poll = setInterval(refreshDashboard, 15000)
    return () => clearInterval(poll)
  }, [dpUser?.id, refreshAll, refreshDashboard, detectCity])

  // Calendar — refetch on month/user change
  useEffect(() => {
    if (!dpUser?.id) return
    api.get(`dp/calendar/${dpUser.id}?month=${calMonth}`).then((d: any) => { if (!d?.error) setCalendarData(d) })
  }, [calMonth, dpUser?.id])

  // Stable primitive key of the in-transit orders. The 15s poll replaces the
  // dashboard object every cycle, so depending on `dashboard.active_orders`
  // directly would tear down + rebuild the GPS watcher every 15s. Keying on the
  // sorted id list rebuilds it only when an order actually enters/leaves tracking.
  const activeTrackingKey = useMemo(
    () => (dashboard?.active_orders || [])
      .filter((o) => ['en_route', 'arrived', 'decorating'].includes(o.delivery_status))
      .map((o) => o.id).sort().join(','),
    [dashboard?.active_orders],
  )

  // ── GPS tracking while an order is in transit/at-site ──────────────────────
  useEffect(() => {
    if (!dpUser?.id || !activeTrackingKey) return
    let sub: Location.LocationSubscription | null = null
    let cancelled = false
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted' || cancelled) return
        const push = (pos: Location.LocationObject) => {
          api.post('delivery/update-location', { lat: pos.coords.latitude, lng: pos.coords.longitude }).catch(() => {})
        }
        const first = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        if (!cancelled) push(first)
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 25, timeInterval: 15000 },
          push,
        )
      } catch { /* location unavailable */ }
    })()
    return () => { cancelled = true; sub?.remove() }
  }, [dpUser?.id, activeTrackingKey])

  // ── Active-job timer expiry ────────────────────────────────────────────────
  // No 1s interval here: screens tick locally off the stable timerEndAt (useCountdown).
  // The context only needs ONE timeout to fire the "time is up" side effect.
  useEffect(() => {
    if (!activeTimerOrderId || !timerEndAt) return
    const expire = () => {
      storage.remove(TIMER_KEY)
      showToast('Time is up! Your booked slot has ended.', 'error')
      setActiveTimerOrderId(null)
      setTimerEndAt(null)
    }
    const ms = timerEndAt - Date.now()
    if (ms <= 0) { expire(); return }
    const t = setTimeout(expire, ms)
    return () => clearTimeout(t)
  }, [activeTimerOrderId, timerEndAt, showToast])

  // ── Auth ───────────────────────────────────────────────────────────────────
  const handleLogin = useCallback(async (phone: string, password: string) => {
    const clean = phone.replace(/\D/g, '').slice(-10)
    if (clean.length !== 10) { showToast('Enter a valid 10-digit phone number', 'error'); return }
    setLoading(true)
    try {
      const data: any = await api.post('dp/login', { phone: clean, password })
      if (data.error) { showToast(data.error, 'error'); return }
      await setDpUser(data)
      setupNotifications()
      showToast(`Welcome, ${data.name}!`, 'success')
      replace('Home')
    } catch { showToast('Login failed', 'error') }
    finally { setLoading(false) }
  }, [showToast, setDpUser])

  const handleLogout = useCallback(() => {
    // Best-effort push-unsubscribe is browser-only; mobile relies on polling.
    wipeSession()
    showToast('Logged out', 'success')
    replace('Auth')
  }, [wipeSession, showToast])

  // ── Order detail ───────────────────────────────────────────────────────────
  const openOrderDetail = useCallback(async (orderId: string) => {
    setLoading(true)
    try {
      const detail: any = await api.get(`dp/order-detail/${orderId}`)
      if (detail?.error) { showToast(detail.error, 'error'); return }
      setSelectedOrder(detail)
      navigate('Order')
    } catch { showToast('Could not open order', 'error') }
    finally { setLoading(false) }
  }, [showToast])

  // ── Accept / decline ───────────────────────────────────────────────────────
  const handleAcceptOrder = useCallback(async (orderId: string) => {
    setLoading(true)
    try {
      const data: any = await api.post('dp/accept-order', { order_id: orderId })
      if (data.error) { showToast(data.error, 'error'); return }
      showToast(data.message || 'Order accepted!', 'success')
      setPendingOrders((prev) => prev.filter((o) => o.id !== orderId))
      refreshAll()
      const detail: any = await api.get(`dp/order-detail/${orderId}`)
      if (!detail?.error) { setSelectedOrder(detail); navigate('Order') }
    } catch { showToast('Failed to accept order', 'error') }
    finally { setLoading(false) }
  }, [showToast, refreshAll])

  const handleDeclineOrder = useCallback(async (orderId: string) => {
    setLoading(true)
    try {
      const data: any = await api.post('dp/decline-order', { order_id: orderId })
      if (data.error) { showToast(data.error, 'error'); return }
      showToast('Order declined.', 'info')
      setPendingOrders((prev) => prev.filter((o) => o.id !== orderId))
    } catch { showToast('Failed to decline order', 'error') }
    finally { setLoading(false) }
  }, [showToast])

  // ── Start navigation: mark en_route + generate customer OTP + open Maps ────
  const handleStartNavigation = useCallback(async (order: Order) => {
    setLoading(true)
    try {
      const upd: any = await api.post('dp/update-status', { order_id: order.id, status: 'en_route' })
      if (upd?.error) { showToast(upd.error, 'error'); return }
      const otpRes: any = await api.post('dp/generate-otp', { order_id: order.id })
      if (otpRes?.error) { showToast(otpRes.error, 'error'); return }
      setSelectedOrder((prev) => prev ? { ...prev, delivery_status: 'en_route' } : prev)
      showToast('On your way! OTP sent to customer.', 'success')
      Linking.openURL(buildMapsUrl(order)).catch(() => {})
    } catch { showToast('Could not start navigation', 'error') }
    finally { setLoading(false) }
  }, [showToast])

  // ── Selfie check-in (camera) ───────────────────────────────────────────────
  const captureSelfie = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync()
      if (!perm.granted) { showToast('Camera permission needed for selfie proof', 'error'); return }
      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        quality: 0.7,
        allowsEditing: false,
      })
      if (result.canceled || !result.assets?.[0]) return
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 720 } }],
        { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG },
      )
      const base64 = await FileSystem.readAsStringAsync(manipulated.uri, { encoding: FileSystem.EncodingType.Base64 })
      setSelfieImage(`data:image/jpeg;base64,${base64}`)
    } catch { showToast('Could not capture selfie', 'error') }
  }, [showToast])

  const submitSelfieProof = useCallback(async (orderId: string) => {
    if (!selfieImage) { showToast('Please capture a selfie first', 'error'); return }
    setLoading(true)
    try {
      let lat: number | undefined, lng: number | undefined
      try {
        const { status } = await Location.getForegroundPermissionsAsync()
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
          lat = pos.coords.latitude; lng = pos.coords.longitude
        }
      } catch { /* GPS optional */ }
      const data: any = await api.post('dp/selfie-proof', { order_id: orderId, selfie_image: selfieImage, lat, lng })
      if (data.error) { showToast(data.error, 'error'); return }
      setSelectedOrder((prev) => prev ? { ...prev, delivery_status: 'arrived' } : prev)
      showToast('Selfie proof uploaded. Now enter customer OTP.', 'success')
    } catch { showToast('Upload failed', 'error') }
    finally { setLoading(false) }
  }, [selfieImage, showToast])

  // ── OTP verify → start decorating + 2-hour timer ───────────────────────────
  const verifyOtp = useCallback(async (orderId: string) => {
    if (!otpInput || (otpInput.length !== 4 && otpInput.length !== 6)) {
      showToast('Enter the 4- or 6-digit OTP', 'error'); return
    }
    setLoading(true)
    try {
      const data: any = await api.post('dp/verify-otp', { order_id: orderId, otp: otpInput })
      if (data.error) { showToast(data.error, 'error'); return }
      showToast('OTP verified. Decoration started.', 'success')
      const endTime = Date.now() + JOB_DURATION_SECONDS * 1000
      await storage.set(TIMER_KEY, JSON.stringify({ orderId, endTime }))
      setTimerEndAt(endTime)
      setActiveTimerOrderId(orderId)
      setSelfieImage(null)
      setOtpInput('')
      setSelectedOrder((prev) => prev ? { ...prev, delivery_status: 'decorating' } : prev)
      navigate('ActiveJob')
    } catch { showToast('OTP verification failed', 'error') }
    finally { setLoading(false) }
  }, [otpInput, showToast])

  // ── Add 5 more minutes to the running job timer (persists the new end time) ──
  const extendTimer = useCallback(() => {
    if (!activeTimerOrderId) return
    setTimerEndAt((prev) => {
      const next = Math.max(prev ?? 0, Date.now()) + TIMER_EXTEND_SECONDS * 1000
      storage.set(TIMER_KEY, JSON.stringify({ orderId: activeTimerOrderId, endTime: next }))
      return next
    })
    showToast('Added 5 minutes', 'success')
  }, [activeTimerOrderId, showToast])

  // ── Complete ───────────────────────────────────────────────────────────────
  const handleComplete = useCallback(async (orderId: string) => {
    setLoading(true)
    try {
      const data: any = await api.post('dp/complete', { order_id: orderId })
      if (data.error) { showToast(data.error, 'error'); return }
      await storage.remove(TIMER_KEY)
      setActiveTimerOrderId(null)
      setTimerEndAt(null)
      setSelectedOrder((prev) => prev ? { ...prev, delivery_status: 'delivered' } : prev)
      showToast('Job completed!', 'success')
      refreshAll()
      navigate('Order')
    } catch { showToast('Could not complete job', 'error') }
    finally { setLoading(false) }
  }, [showToast, refreshAll])

  // ── Collect payment ────────────────────────────────────────────────────────
  const collectCash = useCallback(async (orderId: string, amount: number) => {
    setLoading(true)
    try {
      const r: any = await api.post('dp/collect-payment', { order_id: orderId, amount, method: 'cash' })
      if (r.error) { showToast(r.error, 'error'); return }
      setSelectedOrder((prev) => prev ? { ...prev, payment_status: 'full' } : prev)
      showToast('Cash collected!', 'success')
      refreshAll()
    } catch { showToast('Could not record collection', 'error') }
    finally { setLoading(false) }
  }, [showToast, refreshAll])

  const collectOnline = useCallback(async (order: Order) => {
    setLoading(true)
    try {
      const ord: any = await api.post('dp/collect-payment/create-online', { order_id: order.id })
      if (ord.error) { showToast(ord.error, 'error'); return }
      if (!RazorpayCheckout) { showToast('Online payment only works in the installed app build', 'error'); return }
      const options = {
        description: `Remaining payment · Order #${order.id.slice(0, 8)}`,
        currency: 'INR',
        key: ord.razorpay_key_id,
        amount: ord.amount,
        order_id: ord.razorpay_order_id,
        name: 'FatafatDecor',
        prefill: { name: order.customer?.name || '', contact: order.customer?.phone || '' },
        theme: { color: '#ec4899' },
      }
      try {
        const resp: any = await RazorpayCheckout.open(options)
        const v: any = await api.post('dp/collect-payment/verify-online', {
          razorpay_order_id: resp.razorpay_order_id,
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_signature: resp.razorpay_signature,
        })
        if (v.error) { showToast(v.error, 'error'); return }
        setSelectedOrder((prev) => prev ? { ...prev, payment_status: 'full' } : prev)
        showToast('Online payment received!', 'success')
        refreshAll()
      } catch {
        showToast('Payment cancelled', 'error')
      }
    } catch { showToast('Could not start online payment', 'error') }
    finally { setLoading(false) }
  }, [showToast, refreshAll])

  // ── Completion photos ──────────────────────────────────────────────────────
  const uploadCompletionPhotos = useCallback(async (orderId: string) => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) { showToast('Photo permission needed', 'error'); return }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 6,
        quality: 0.8,
      })
      if (result.canceled || !result.assets?.length) return
      setLoading(true)
      const photos: string[] = []
      for (const asset of result.assets.slice(0, 6)) {
        try {
          const m = await ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 1280 } }],
            { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG })
          const b64 = await FileSystem.readAsStringAsync(m.uri, { encoding: FileSystem.EncodingType.Base64 })
          photos.push(`data:image/jpeg;base64,${b64}`)
        } catch { /* skip a bad image */ }
      }
      if (photos.length === 0) { showToast('Could not read the selected photos', 'error'); return }
      const res: any = await api.post('dp/completion-photos', { order_id: orderId, photos })
      if (res.error) { showToast(res.error, 'error'); return }
      const added = res.photos || []
      setSelectedOrder((prev) => prev ? { ...prev, completion_photos: [...(prev.completion_photos || []), ...added] } : prev)
      showToast(`Uploaded ${res.uploaded} photo${res.uploaded === 1 ? '' : 's'}`, 'success')
    } catch { showToast('Upload failed', 'error') }
    finally { setLoading(false) }
  }, [showToast])

  const removeCompletionPhoto = useCallback(async (orderId: string, index: number) => {
    try {
      const res: any = await api.delete(`dp/completion-photos/${orderId}/${index}`)
      if (res.error) { showToast(res.error, 'error'); return }
      setSelectedOrder((prev) => prev ? { ...prev, completion_photos: (prev.completion_photos || []).filter((_: any, i: number) => i !== index) } : prev)
      showToast('Photo removed', 'success')
    } catch { showToast('Could not remove photo', 'error') }
  }, [showToast])

  // ── Gift orders ────────────────────────────────────────────────────────────
  const handleAcceptGiftOrder = useCallback(async (orderId: string) => {
    setLoading(true)
    try {
      const data: any = await api.post('dp/accept-gift-order', { order_id: orderId })
      if (data.error) { showToast(data.error, 'error'); return }
      showToast('Gift order accepted!', 'success')
      setPendingGiftOrders((prev) => prev.filter((o) => o.id !== orderId))
      refreshDashboard()   // surface it under "Active Gift Deliveries" right away
      const detail: any = await api.get(`dp/gift-order-detail/${orderId}`)
      if (!detail?.error) { setSelectedGiftOrder(detail); navigate('GiftOrder') }
    } catch { showToast('Failed to accept', 'error') }
    finally { setLoading(false) }
  }, [showToast, refreshDashboard])

  const handleDeclineGiftOrder = useCallback(async (orderId: string) => {
    setLoading(true)
    try {
      const data: any = await api.post('dp/decline-gift-order', { order_id: orderId })
      if (data.error) { showToast(data.error, 'error'); return }
      showToast('Gift order declined', 'info')
      setPendingGiftOrders((prev) => prev.filter((o) => o.id !== orderId))
    } catch { showToast('Failed to decline', 'error') }
    finally { setLoading(false) }
  }, [showToast])

  const openGiftOrderDetail = useCallback(async (orderId: string) => {
    setLoading(true)
    try {
      const detail: any = await api.get(`dp/gift-order-detail/${orderId}`)
      if (detail?.error) { showToast(detail.error, 'error'); return }
      setSelectedGiftOrder(detail)
      navigate('GiftOrder')
    } catch { showToast('Could not open gift order', 'error') }
    finally { setLoading(false) }
  }, [showToast])

  const updateGiftStatus = useCallback(async (orderId: string, status: string) => {
    setLoading(true)
    try {
      const data: any = await api.post('dp/update-gift-status', { order_id: orderId, status })
      if (data.error) { showToast(data.error, 'error'); return }
      setSelectedGiftOrder((prev) => prev ? { ...prev, delivery_status: status } : prev)
      // Going en route auto-sends the confirmation OTP to the recipient (backend).
      showToast(status === 'en_route'
        ? 'On the way! Confirmation OTP sent to the recipient.'
        : `Status updated: ${status.replace('_', ' ')}`, 'success')
    } catch { showToast('Update failed', 'error') }
    finally { setLoading(false) }
  }, [showToast])

  // (Re)send the gift confirmation OTP to the recipient
  const generateGiftOtp = useCallback(async (orderId: string) => {
    setLoading(true)
    try {
      const data: any = await api.post('dp/generate-gift-otp', { order_id: orderId })
      if (data.error) { showToast(data.error, 'error'); return }
      showToast('OTP sent to the recipient.', 'success')
    } catch { showToast('Could not send OTP', 'error') }
    finally { setLoading(false) }
  }, [showToast])

  // Confirm gift hand-over with the recipient's OTP → delivered
  const verifyGiftOtp = useCallback(async (orderId: string) => {
    if (!giftOtpInput || (giftOtpInput.length !== 4 && giftOtpInput.length !== 6)) {
      showToast('Enter the 4- or 6-digit OTP', 'error'); return
    }
    setLoading(true)
    try {
      const data: any = await api.post('dp/verify-gift-otp', { order_id: orderId, otp: giftOtpInput })
      if (data.error) { showToast(data.error, 'error'); return }
      setSelectedGiftOrder((prev) => prev ? { ...prev, delivery_status: 'delivered' } : prev)
      setGiftOtpInput('')
      showToast('Gift delivered & confirmed!', 'success')
    } catch { showToast('OTP verification failed', 'error') }
    finally { setLoading(false) }
  }, [giftOtpInput, showToast])

  // ── Earnings: deposit cash ─────────────────────────────────────────────────
  const depositCash = useCallback(async (amount: number, method: string, ref: string): Promise<boolean> => {
    if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return false }
    setLoading(true)
    try {
      const r: any = await api.post('dp/deposit-cash', { amount, deposit_method: method, reference_number: ref })
      if (r.error) { showToast(r.error, 'error'); return false }
      showToast(method === 'bank_transfer' ? 'Bank transfer recorded!' : 'Deposit recorded!', 'success')
      if (dpUser?.id) api.get(`dp/earnings/${dpUser.id}`).then((d: any) => { if (!d?.error) setEarnings(d) })
      return true
    } catch { showToast('Could not record deposit', 'error'); return false }
    finally { setLoading(false) }
  }, [showToast, dpUser?.id])

  // ── Change password ────────────────────────────────────────────────────────
  const changePassword = useCallback(async (currentPw: string, newPw: string): Promise<boolean> => {
    if (!currentPw || !newPw) { showToast('Fill both fields', 'error'); return false }
    if (newPw.length < 4) { showToast('New password must be at least 4 characters', 'error'); return false }
    setLoading(true)
    try {
      const data: any = await api.post('dp/change-password', { current_password: currentPw, new_password: newPw })
      if (data.error) { showToast(data.error, 'error'); return false }
      showToast('Password changed successfully!', 'success')
      return true
    } catch { showToast('Failed to change password', 'error'); return false }
    finally { setLoading(false) }
  }, [showToast])

  // ── Misc actions ───────────────────────────────────────────────────────────
  const openMaps = useCallback((order: any) => {
    Linking.openURL(buildMapsUrl(order)).catch(() => {})
  }, [])

  const callCustomer = useCallback((phone?: string) => {
    if (!phone) return
    Linking.openURL(`tel:${phone}`).catch(() => {})
  }, [])

  const contactSupport = useCallback(() => {
    const msg = encodeURIComponent("Hi FatafatDecor team! I'd like to apply to become a decorator partner. Please guide me through the process.")
    Linking.openURL(`https://wa.me/91${SUPPORT_PHONE}?text=${msg}`).catch(() => {
      Linking.openURL(`tel:+91${SUPPORT_PHONE}`).catch(() => showToast(`Call us: ${SUPPORT_PHONE}`, 'info'))
    })
  }, [showToast])

  const value: AppContextType = {
    dpUser, loading, toast,
    dashboard, orders, pendingOrders, pendingGiftOrders, activeGiftOrders,
    selectedOrder, setSelectedOrder,
    selectedGiftOrder, setSelectedGiftOrder,
    earnings, calendarData, calMonth, setCalMonth,
    selfieImage, setSelfieImage, otpInput, setOtpInput,
    activeTimerOrderId, timerEndAt, extendTimer,
    showToast, refreshAll, refreshDashboard,
    handleLogin, handleLogout,
    openOrderDetail, handleAcceptOrder, handleDeclineOrder,
    handleStartNavigation, captureSelfie, submitSelfieProof, verifyOtp,
    handleComplete, collectCash, collectOnline,
    uploadCompletionPhotos, removeCompletionPhoto,
    handleAcceptGiftOrder, handleDeclineGiftOrder, openGiftOrderDetail, updateGiftStatus,
    giftOtpInput, setGiftOtpInput, generateGiftOtp, verifyGiftOtp,
    depositCash, changePassword,
    cities, updateCity, detectCity, detectingLocation,
    openMaps, callCustomer, contactSupport,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
