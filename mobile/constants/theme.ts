import { TextStyle } from 'react-native'

// Brand colors — match getfoodwise.app exactly
export const Colors = {
  // Backgrounds
  background: '#0A1628',
  backgroundMid: '#0F2040',
  backgroundDark: '#060E1A',
  backgroundCard: 'rgba(15, 32, 64, 0.6)',
  backgroundElevated: 'rgba(15, 32, 64, 0.85)',

  // Brand
  teal: '#1D9E75',
  tealHover: '#16805F',
  tealLight: 'rgba(29, 158, 117, 0.15)',
  tealMedium: 'rgba(29, 158, 117, 0.4)',
  tealGlow: 'rgba(29, 158, 117, 0.3)',
  mint: '#A8F0D8',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textOnTeal: '#FFFFFF',

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderHover: 'rgba(255, 255, 255, 0.16)',
  borderTeal: 'rgba(29, 158, 117, 0.4)',
  borderStrong: '#1A3A5C',

  // Status
  success: '#1D9E75',
  successBg: 'rgba(29, 158, 117, 0.15)',
  error: '#EF4444',
  errorBg: 'rgba(239, 68, 68, 0.15)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.15)',

  // Overlays
  overlay: 'rgba(10, 22, 40, 0.85)',
  overlayDark: 'rgba(6, 14, 26, 0.9)',
}

export const Typography: Record<string, TextStyle> = {
  displayXL: {
    fontSize: 36, fontWeight: '800',
    letterSpacing: -0.6, color: Colors.textPrimary,
  },
  displayLG: {
    fontSize: 28, fontWeight: '800',
    letterSpacing: -0.4, color: Colors.textPrimary,
  },
  displayMD: {
    fontSize: 22, fontWeight: '700',
    letterSpacing: -0.2, color: Colors.textPrimary,
  },
  heading: {
    fontSize: 18, fontWeight: '600',
    color: Colors.textPrimary,
  },
  subheading: {
    fontSize: 16, fontWeight: '600',
    color: Colors.textPrimary,
  },
  body: {
    fontSize: 16, fontWeight: '400',
    lineHeight: 24, color: Colors.textSecondary,
  },
  bodySmall: {
    fontSize: 14, fontWeight: '400',
    lineHeight: 20, color: Colors.textSecondary,
  },
  caption: {
    fontSize: 12, fontWeight: '400',
    color: Colors.textMuted,
  },
  label: {
    fontSize: 12, fontWeight: '700',
    color: Colors.teal, letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  button: {
    fontSize: 16, fontWeight: '700',
    color: Colors.textOnTeal, letterSpacing: 0.2,
  },
  buttonSmall: {
    fontSize: 14, fontWeight: '600',
    color: Colors.textOnTeal,
  },
}

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
  '2xl': 32, '3xl': 48,
}

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, full: 9999,
}

export const Shadows = {
  teal: {
    shadowColor: '#1D9E75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  tealGlow: {
    shadowColor: '#1D9E75',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 24,
  },
}

export const Styles = {
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.backgroundMid,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  cardGlass: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  buttonPrimary: {
    backgroundColor: Colors.teal,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderTeal,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  pillSelected: {
    backgroundColor: Colors.tealLight,
    borderColor: Colors.teal,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pillUnselected: {
    backgroundColor: Colors.backgroundMid,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
}

// ─── BACKWARD COMPATIBILITY ────────────────────────────────────────────────
// Keeps useThemeColors() working across all screens. Values now resolve to
// the navy/teal brand palette instead of the old warm amber palette.

const _compat = {
  ...Colors,
  primary:             Colors.teal,
  primaryForeground:   Colors.textOnTeal,
  secondary:           Colors.mint,
  secondaryForeground: Colors.textOnTeal,
  muted:               Colors.backgroundMid,
  mutedForeground:     Colors.textSecondary,
  accent:              Colors.mint,
  accentForeground:    Colors.textOnTeal,
  card:                Colors.backgroundMid,
  cardForeground:      Colors.textPrimary,
  input:               Colors.backgroundMid,
  foreground:          Colors.textPrimary,
  destructive:         Colors.error,
  chart1:              Colors.teal,
  chart2:              Colors.mint,
  chart3:              Colors.teal,
  chart4:              Colors.error,
  chart5:              Colors.teal,
}

export const DarkColors  = _compat
export const LightColors = _compat
export type ThemeColors  = typeof _compat

export const FontSize = {
  xs: 11, sm: 13, base: 15, lg: 17, xl: 20,
  '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48,
}
