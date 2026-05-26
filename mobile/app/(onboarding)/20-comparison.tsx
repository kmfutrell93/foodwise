import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';

const features = [
  { label: '7-day AI meal plans', free: true, pro: true },
  { label: 'Injection-day menus', free: true, pro: true },
  { label: 'Smart grocery list', free: true, pro: true },
  { label: 'Unlimited plan regeneration', free: false, pro: true },
  { label: 'Symptom tracker', free: false, pro: true },
  { label: 'AI symptom insights', free: false, pro: true },
  { label: 'Weekly progress reports', free: false, pro: true },
  { label: 'Budget tracking + NOVA scoring', free: false, pro: true },
  { label: 'Streak & milestone system', free: false, pro: true },
];

export default function Comparison() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Free vs Pro</Text>
        <Text style={styles.title}>Everything you{'\n'}need to succeed.</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colHeader, { flex: 2 }]}>Feature</Text>
            <Text style={styles.colHeader}>Free</Text>
            <Text style={[styles.colHeader, { color: Colors.primary }]}>Pro</Text>
          </View>
          {features.map((f, idx) => (
            <View key={f.label} style={[styles.row, idx % 2 === 1 && styles.rowAlt]}>
              <Text style={[styles.featureLabel, { flex: 2 }]}>{f.label}</Text>
              <Text style={styles.check}>{f.free ? '✓' : '—'}</Text>
              <Text style={[styles.check, { color: Colors.primary }]}>{f.pro ? '✓' : '—'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.spacer} />
        <Button label="Start 7-day free trial" onPress={() => router.push('/(onboarding)/21-notification')} />
        <Text style={styles.skip} onPress={() => router.push('/(onboarding)/21-notification')}>Continue with free plan</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing['3xl'], paddingBottom: Spacing['3xl'] },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 38, marginBottom: Spacing['2xl'] },
  table: { borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing['2xl'] },
  tableHeader: { flexDirection: 'row', padding: Spacing.md, backgroundColor: Colors.muted },
  colHeader: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', color: Colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', minWidth: 44 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 10 },
  rowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  featureLabel: { fontSize: FontSize.sm, color: Colors.foreground },
  check: { minWidth: 44, textAlign: 'center', fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.mutedForeground },
  spacer: { height: Spacing.xl },
  skip: { textAlign: 'center', color: Colors.mutedForeground, fontSize: FontSize.sm, marginTop: Spacing.md },
});
