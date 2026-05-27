import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

const FEATURES: { label: string; free: boolean; pro: boolean }[] = [
  { label: 'AI meal plans (3/month)', free: true, pro: true },
  { label: 'Injection-day aware meals', free: true, pro: true },
  { label: 'Basic grocery list', free: true, pro: true },
  { label: 'Medication-specific menus', free: true, pro: true },
  { label: 'Unlimited meal plans', free: false, pro: true },
  { label: 'Symptom tracker + AI insights', free: false, pro: true },
  { label: 'Weekly progress reports', free: false, pro: true },
  { label: 'Streak system + milestones', free: false, pro: true },
  { label: 'Dose escalation awareness', free: false, pro: true },
  { label: 'Smart grocery list + NOVA scores', free: false, pro: true },
  { label: 'Apple Health integration', free: false, pro: true },
];

export default function Comparison() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  return (
    <OnboardingShell step={20}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <Text style={s.label}>Free vs Pro</Text>
        <Text style={s.title}>GLP-1 support{'\n'}isn't optional.</Text>

        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.colLabel, s.featureCol]}>Feature</Text>
            <Text style={[s.colLabel, s.tierCol]}>Free</Text>
            <Text style={[s.colLabel, s.tierCol, s.proCol]}>Pro</Text>
          </View>
          {FEATURES.map((f, i) => (
            <View key={f.label} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
              <Text style={[s.featureText, s.featureCol]}>{f.label}</Text>
              <Text style={[s.checkCol, s.tierCol]}>{f.free ? '✓' : '—'}</Text>
              <Text style={[s.checkCol, s.tierCol, s.proCheck]}>{f.pro ? '✓' : '—'}</Text>
            </View>
          ))}
        </View>

        <View style={s.cta}>
          <Text style={s.ctaText}>Pro members save an average of <Text style={s.ctaHighlight}>$34/month</Text> on groceries vs. guessing alone.</Text>
        </View>

        <Button label="Choose my plan" onPress={() => router.push('/(onboarding)/21-notification')} />
      </ScrollView>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
  content: { paddingTop: Spacing.lg, paddingBottom: Spacing['3xl'] },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: c.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, lineHeight: 38, marginBottom: Spacing['2xl'] },
  table: { borderRadius: Radius.lg, borderWidth: 1, borderColor: c.border, overflow: 'hidden', marginBottom: Spacing['2xl'] },
  tableHeader: { flexDirection: 'row', backgroundColor: c.muted, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  tableRow: { flexDirection: 'row', paddingVertical: 11, paddingHorizontal: Spacing.lg },
  tableRowAlt: { backgroundColor: 'rgba(30,29,26,0.6)' },
  colLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', color: c.mutedForeground, textTransform: 'uppercase', letterSpacing: 1 },
  featureCol: { flex: 1 },
  tierCol: { width: 48, textAlign: 'center' },
  proCol: { color: c.primary },
  featureText: { fontSize: FontSize.sm, color: c.foreground },
  checkCol: { width: 48, textAlign: 'center', fontSize: FontSize.sm, color: c.mutedForeground },
  proCheck: { color: c.primary, fontFamily: 'PlusJakartaSans-Bold' },
  cta: { backgroundColor: 'rgba(29,158,117,0.08)', borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(29,158,117,0.2)', padding: Spacing.xl, marginBottom: Spacing['2xl'] },
  ctaText: { fontSize: FontSize.sm, color: c.mutedForeground, textAlign: 'center', lineHeight: 22 },
  ctaHighlight: { color: c.primary, fontFamily: 'PlusJakartaSans-Bold' },
});
}
