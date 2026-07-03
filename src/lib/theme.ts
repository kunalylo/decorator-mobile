// ════════════════════════════════════════════════════════════════════
// AURORA THEME (decorator mobile) — shared with the customer app so both
// apps feel like one product. Gradient backgrounds + glass surfaces +
// iridescent buttons + Playfair display titles.
// ════════════════════════════════════════════════════════════════════

import { TextStyle, ViewStyle } from 'react-native'

export const aurora = {
  // Solid tokens
  cream:       '#FDF6F2',
  creamSoft:   '#FCF8F5',
  blush:       '#FFF5F2',
  ink:         '#1A1A1A',
  text:        '#111827',
  textMuted:   '#6b7280',
  textFaint:   '#9ca3af',
  pink:        '#ec4899',
  pinkDeep:    '#E91E63',
  pinkBright:  '#FF5E8E',
  lavender:    '#C68CFF',
  peach:       '#FFB88C',
  green:       '#16a34a',
  greenSoft:   '#f0fdf4',
  orange:      '#f97316',
  orangeSoft:  '#fff7ed',

  // Gradient tuples
  bg:         ['#FDEEE6', '#FCE9F1', '#F1EAFF'] as const, // page aurora wash
  bgPeach:    ['#FFF3EA', '#FFE6EE', '#F6ECFF'] as const,
  bgBlush:    ['#FFEDF1', '#FBE7FA', '#ECEBFF'] as const,
  primary:    ['#FF5E8E', '#E91E63'] as const,            // primary CTA gradient
  header:     ['#FF7EB0', '#E91E63', '#C2185B'] as const, // rich header gradient
  iridescent: ['#FFB88C', '#FF6B9F', '#C68CFF', '#9DDFFF'] as const,
}

// Playfair Display — loaded in App.tsx. Falls back to system serif gracefully.
export const fonts = {
  display:       'PlayfairDisplay_600SemiBold',
  displayBold:   'PlayfairDisplay_700Bold',
  displayItalic: 'PlayfairDisplay_500Medium_Italic',
}

// Glass surface (no native blur — semi-transparent white + soft shadow).
export const glass: ViewStyle = {
  backgroundColor: 'rgba(255,255,255,0.66)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.85)',
  shadowColor: '#b06496',
  shadowOpacity: 0.16,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 4,
}

export const glassStrong: ViewStyle = {
  ...glass,
  backgroundColor: 'rgba(255,255,255,0.80)',
}

export const displayTitle: TextStyle = {
  fontFamily: fonts.display,
  color: aurora.text,
}
