import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppProvider } from './src/context/AppContext'
import AppNavigator from './src/navigation'
import { storage } from './src/lib/storage'
import { BASE_URL } from './src/lib/constants'
import {
  useFonts,
  PlayfairDisplay_500Medium_Italic,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error) { console.error('App crash:', error) }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#fdf2f8', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48 }}>{'😵'}</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#1f2937', marginTop: 16, textAlign: 'center' }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 8, textAlign: 'center' }}>
            Please restart the app. If this keeps happening, contact support.
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false })}
            style={{ marginTop: 24, backgroundColor: '#ec4899', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState<'Auth' | 'Home' | null>(null)

  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_500Medium_Italic,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  })

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    const userStr = await storage.get('fd_dp_user')
    const token   = await storage.get('dp_token')
    if (userStr && token) {
      // Validate the token by hitting a lightweight DP endpoint
      try {
        const res = await fetch(`${BASE_URL}/dp/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (res.status === 401 || res.status === 403) {
          await storage.remove('fd_dp_user')
          await storage.remove('dp_token')
          setInitialRoute('Auth')
          return
        }
      } catch {
        // Network error — still try Home; the api interceptor handles later 401s
      }
      setInitialRoute('Home')
    } else {
      setInitialRoute('Auth')
    }
  }

  if (!initialRoute || (!fontsLoaded && !fontError)) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fdf2f8', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#ec4899" size="large" />
      </View>
    )
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="dark" backgroundColor="#fdf2f8" />
          <AppNavigator initialRoute={initialRoute} />
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  )
}
