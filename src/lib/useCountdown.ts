import { useEffect, useState } from 'react'
import { useIsFocused } from '@react-navigation/native'

// Local per-screen countdown. The context only stores the stable end timestamp —
// if the tick lived in context state, every consumer of useApp() (i.e. the whole
// app) would re-render every second for the entire 2-hour job. With this hook,
// only the screen actually showing the timer re-renders, and only while focused.
export function useCountdown(endAt: number | null): number {
  const isFocused = useIsFocused()
  const remaining = () => (endAt ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000)) : 0)
  const [seconds, setSeconds] = useState(remaining)
  useEffect(() => {
    if (!endAt || !isFocused) { setSeconds(remaining()); return }
    setSeconds(remaining())
    const id = setInterval(() => setSeconds(remaining()), 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endAt, isFocused])
  return seconds
}
