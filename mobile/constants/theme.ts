export const DarkColors = {
  background: '#141311',
  foreground: '#F4EFE6',
  primary: '#E89D35',
  primaryForeground: '#141311',
  secondary: '#8A9A7C',
  secondaryForeground: '#141311',
  muted: '#2A2824',
  mutedForeground: '#9B968C',
  accent: '#D87F63',
  accentForeground: '#141311',
  card: '#1E1D1A',
  cardForeground: '#F4EFE6',
  border: '#2E2C28',
  input: '#22201D',
  destructive: '#E06555',
  chart1: '#E89D35',
  chart2: '#8A9A7C',
  chart3: '#D87F63',
  chart4: '#E06555',
  chart5: '#5C6B50',
};

export const LightColors = {
  background: '#F8F6F2',
  foreground: '#1A1714',
  primary: '#C27B1A',
  primaryForeground: '#FFFFFF',
  secondary: '#5A7340',
  secondaryForeground: '#FFFFFF',
  muted: '#EDE9DF',
  mutedForeground: '#7D7670',
  accent: '#B55E3A',
  accentForeground: '#FFFFFF',
  card: '#FFFFFF',
  cardForeground: '#1A1714',
  border: '#DDD7CC',
  input: '#F0EDE7',
  destructive: '#CC3838',
  chart1: '#C27B1A',
  chart2: '#5A7340',
  chart3: '#B55E3A',
  chart4: '#CC3838',
  chart5: '#3D5928',
};

export type ThemeColors = typeof DarkColors;

// Backward-compat — still used by screens that haven't been migrated
export const Colors = DarkColors;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};
