export function fmtHour(h: number) {
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:00 ${ampm}`
}

export function fmtSlot(slot?: { date: string; hour: number } | null) {
  if (!slot || slot.hour === undefined || slot.hour === null) return '—'
  return `${slot.date} · ${slot.hour}:00 – ${slot.hour + 1}:00`
}

// Display window for a booked slot. Decoration jobs occupy 2 hours on site; gift deliveries 1.
export function slotWindow(slot?: { date?: string; hour?: number } | null, hours = 2): string {
  return slot && slot.hour !== undefined && slot.hour !== null ? `${slot.hour}:00–${slot.hour + hours}:00` : '—'
}

export function fmtCurrency(n: number) {
  return `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`
}

// "Rs 1,234" style used across the decorator screens
export function rs(n: number) {
  return `Rs ${Math.round(Number(n) || 0).toLocaleString('en-IN')}`
}

// Decorators never see the order total — only the balance they must collect on delivery.
// (0 = fully prepaid, nothing to collect.)
export function toCollect(o: any): number {
  return Math.max(0, Math.round((Number(o?.total_cost) || 0) - (Number(o?.payment_amount) || 0)))
}

// Countdown formatting for the active-job timer. Shows h:mm:ss once over an hour
// (e.g. "2:00:00" for the 2-hour slot), else mm:ss.
export function formatTimer(secs: number) {
  const s = Math.max(0, Math.floor(secs))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export function greetingByTime() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export function shortId(id?: string) {
  return id ? id.slice(0, 8) : ''
}

// Some catalog image URLs contain raw spaces (e.g. ".../Decorated Deliverables/...").
// React Native <Image> won't load those on Android unless spaces are percent-encoded.
// Encode ONLY spaces so we never double-encode an already-encoded URL.
export function safeUri(url?: string): string {
  return (url || '').replace(/ /g, '%20')
}

// Build a Google Maps driving-directions URL — prefers a pinned lat/lng,
// falls back to text address, then a plain maps open.
export function buildMapsUrl(o: any): string {
  // Gift orders store the pin under delivery_location, decoration orders use flat delivery_lat/lng.
  const lat = o?.delivery_lat ?? o?.delivery_location?.lat
  const lng = o?.delivery_lng ?? o?.delivery_location?.lng
  if (lat && lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
  }
  const addr = [o?.delivery_address, o?.delivery_landmark].filter(Boolean).join(', ')
  if (addr) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}&travelmode=driving`
  return 'https://www.google.com/maps'
}
