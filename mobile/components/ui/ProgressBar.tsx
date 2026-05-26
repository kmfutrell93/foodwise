import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

export function ProgressBar({ total, current }: { total: number; current: number }) {
  const colors = useThemeColors();
  const pct = Math.min(Math.max(current / total, 0), 1);
  return (
    <View style={[styles.track, { backgroundColor: colors.border }]}>
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 3, borderRadius: Radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.full },
});
