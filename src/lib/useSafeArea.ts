import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'

export function useSafeArea() {
  const insets = useSafeAreaInsets()
  return {
    headerTop:  insets.top + 10,                  // for screen header paddingTop
    navBottom:  Math.max(insets.bottom, 6) + 4,   // for bottom nav paddingBottom
    statusTop:  insets.top,                        // raw top inset
  }
}

export const SCREEN_WIDTH  = Dimensions.get('window').width
export const SCREEN_HEIGHT = Dimensions.get('window').height
