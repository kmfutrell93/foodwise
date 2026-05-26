import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius } from '@/constants/theme';

type Props = { total: number; current: number };

export function ProgressBar({ total, current }: Props) {
  const pct = Math.min(Math.max(current / total, 0), 1);
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
});
