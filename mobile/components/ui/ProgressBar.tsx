import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius } from '@/constants/theme';

export function ProgressBar({ total, current }: { total: number; current: number }) {
  const pct = Math.min(Math.max(current / total, 0), 1);
  return (
    <View style={s.track}>
      <View style={[s.fill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

const s = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderStrong,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
    backgroundColor: Colors.teal,
  },
});
