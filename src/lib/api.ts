import axios from 'axios'
import { storage } from './storage'
import { BASE_URL } from './constants'

// Callback for 401 auto-logout — set by AppProvider
let onAuthExpired: (() => void) | null = null
export function setAuthExpiredHandler(handler: () => void) {
  onAuthExpired = handler
}

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 })

// Attach the decorator JWT automatically
api.interceptors.request.use(async (config) => {
  const token = await storage.get('dp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Return data directly, or { error: string } on failure
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err?.response?.status
    const url = err?.config?.url || ''
    // Auto-logout on 401 from non-login endpoints — token expired / rejected
    if (status === 401 && !url.includes('dp/login')) {
      if (onAuthExpired) onAuthExpired()
      return Promise.resolve({ error: 'Session expired. Please login again.' })
    }
    const msg = err?.response?.data?.error || err?.message || 'Network error'
    return Promise.resolve({ error: msg })
  },
)

export default api
