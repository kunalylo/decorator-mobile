import React from 'react'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import AuthScreen      from '../screens/AuthScreen'
import HomeScreen      from '../screens/HomeScreen'
import OrderScreen     from '../screens/OrderScreen'
import VerifyScreen    from '../screens/VerifyScreen'
import ActiveJobScreen from '../screens/ActiveJobScreen'
import CalendarScreen  from '../screens/CalendarScreen'
import EarningsScreen  from '../screens/EarningsScreen'
import ProfileScreen   from '../screens/ProfileScreen'
import GiftOrderScreen from '../screens/GiftOrderScreen'

export type RootStackParamList = {
  Auth:      undefined
  Home:      undefined
  Order:     undefined
  Verify:    undefined
  ActiveJob: undefined
  Calendar:  undefined
  Earnings:  undefined
  Profile:   undefined
  GiftOrder: undefined
}

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

export function navigate(name: keyof RootStackParamList) {
  if (navigationRef.isReady()) navigationRef.navigate(name)
}

export function replace(name: keyof RootStackParamList) {
  if (navigationRef.isReady()) navigationRef.reset({ index: 0, routes: [{ name }] })
}

// Push a screen on top of Home so back returns to the dashboard (not the
// transient screen we came from).
export function navigateWithBase(name: keyof RootStackParamList) {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 1, routes: [{ name: 'Home' }, { name }] })
  }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

const defaultScreenOptions = {
  headerShown: false,
  animation: 'default' as const,
  animationDuration: 320,
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
}

export default function AppNavigator({ initialRoute }: { initialRoute: keyof RootStackParamList }) {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={defaultScreenOptions}>
        <Stack.Screen name="Auth"  component={AuthScreen}  options={{ animation: 'fade', animationDuration: 280 }} />
        <Stack.Screen name="Home"  component={HomeScreen}  options={{ animation: 'fade', animationDuration: 280 }} />
        <Stack.Screen name="Order" component={OrderScreen} />
        <Stack.Screen
          name="Verify"
          component={VerifyScreen}
          options={{ animation: 'slide_from_bottom', animationDuration: 360 }}
        />
        <Stack.Screen
          name="ActiveJob"
          component={ActiveJobScreen}
          options={{ gestureEnabled: false, animation: 'fade_from_bottom', animationDuration: 360 }}
        />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="Earnings" component={EarningsScreen} />
        <Stack.Screen name="Profile"  component={ProfileScreen} />
        <Stack.Screen
          name="GiftOrder"
          component={GiftOrderScreen}
          options={{ animation: 'slide_from_bottom', animationDuration: 380 }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
