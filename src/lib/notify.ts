// ════════════════════════════════════════════════════════════════════
// New-order alerts (decorator mobile).
// The web app uses a service-worker + Web Push for this; on mobile we use
// expo-notifications (immediate local notification) + a strong haptic buzz.
// Foreground polling in AppContext detects new orders and calls alertNewOrders.
// ════════════════════════════════════════════════════════════════════

import * as Notifications from 'expo-notifications'
import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

// Show the banner even while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

let configured = false

// Ask permission + set up the Android channel. Safe to call repeatedly.
export async function setupNotifications() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'New Orders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 120, 250],
        lightColor: '#ec4899',
        sound: 'default',
      })
    }
    if (!configured) {
      await Notifications.requestPermissionsAsync()
      configured = true
    }
  } catch { /* non-critical */ }
}

// Strong celebratory buzz pattern for an incoming job.
export function buzz() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 220)
  } catch { /* haptics unavailable */ }
}

// Fire an immediate local notification + buzz for newly-arrived order(s).
export async function alertNewOrders(count: number) {
  buzz()
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 New order available!',
        body: count === 1
          ? 'A new decoration request is waiting. Open to accept.'
          : `${count} new requests are waiting. Open to accept.`,
        sound: 'default',
      },
      trigger: null, // immediate
    })
  } catch { /* non-critical */ }
}
