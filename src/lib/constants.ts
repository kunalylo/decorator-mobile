// Same Railway backend the customer app uses — it serves every dp/* endpoint.
export const BASE_URL = 'https://api.fatafatdecor.ylo.co.in/api'

export const SCREENS = {
  AUTH: 'Auth',
  HOME: 'Home',
  ORDER: 'Order',
  VERIFY: 'Verify',
  ACTIVE_JOB: 'ActiveJob',
  CALENDAR: 'Calendar',
  EARNINGS: 'Earnings',
  PROFILE: 'Profile',
  GIFT_ORDER: 'GiftOrder',
}

// Order delivery lifecycle (mirrors backend dp/update-status transitions)
export const ORDER_STATUSES = [
  'pending', 'assigned', 'en_route', 'arrived', 'decorating', 'delivered', 'cancelled',
]

// Gift order lifecycle (mirrors backend dp/update-gift-status)
export const GIFT_STATUS_STEPS = ['assigned', 'en_route', 'arrived', 'delivered']
export const GIFT_STATUS_LABELS: Record<string, string> = {
  assigned: 'Assigned', en_route: 'En Route', arrived: 'Arrived', delivered: 'Delivered',
}

// WhatsApp number for decorator applications / support
export const SUPPORT_PHONE = '6204711205'

// Decoration slot length once OTP is verified (2 hours, matches web app)
export const JOB_DURATION_SECONDS = 7200
// "+5 min" button adds this much to the running timer
export const TIMER_EXTEND_SECONDS = 300

export const LOGO_URL = 'https://ik.imagekit.io/jcp2urr7b/branding/icon-512.png'
// Local asset — loads instantly, no network needed
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const LOGO_SRC = require('../../assets/logo.png')
