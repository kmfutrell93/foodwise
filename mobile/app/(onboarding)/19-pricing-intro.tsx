import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

const VALUE_PROPS = [
  {
    icon: '🧠',
    title: 'AI that speaks GLP-1',
    body: 'Every meal recommendation is shaped by your injection schedule, not a generic calorie counter.',
  },
  {
    icon: '🛒',
    title: 'Grocery lists that don\'t lie',
    body: 'Itemized, budget-accurate, NOVA-scored. Know exactly what to buy and why.',
  },
  {
    icon: '📊',
    title: 'Symptom-to-meal intelligence',
    body: 'Log nausea, fatigue, or cravings and your next plan adapts automatically.',
  },
  {
    icon: '🔥',
    title: 'Daily streaks & insights',
    body: 'Weekly AI reports show what\'s working — and what to tweak.',
  },
];

export default function PricingIntro() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  return (
    <OnboardingShell step={19}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.crownWrap}>
          <Text style={s.crown}>👑</Text>
        </View>
        <Text style={s.label}>Why FoodWise Pro</Text>
        <Text style={s.title}>Everything you{'\n'}need — nothing{'\n'}generic.</Text>

        <View style={s.cards}>
          {VALUE_PROPS.map(v => (
            <View key={v.title} style={s.card}>
              <Text style={s.icon}>{v.icon}</Text>
              <View style={s.cardBody}>
                <Text style={s.cardTitle}>{v.title}</Text>
                <Text style={s.cardBody2}>{v.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.badge}>
          <Text style={s.badgeTitle}>Used by 47,000+ GLP-1 members</Text>
          <Text style={s.badgeSub}>Average member logs 6.4 days/week and reports 89% protein goal adherence by week 3.</Text>
        </View>

        <Button label="See pricing" onPress={() => router.push('/(onboarding)/20-comparison')} />
      </ScrollView>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
  content: { paddingTop: Spacing.md, paddingBottom: Spacing['3xl'] },
  crownWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(232,157,53,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, alignSelf: 'center' },
  crown: { fontSize: 36 },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: c.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, lineHeight: 38, marginBottom: Spacing['2xl'] },
  cards: { gap: Spacing.md, marginBottom: Spacing['2xl'] },
  card: { flexDirection: 'row', gap: Spacing.md, backgroundColor: c.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.border, padding: Spacing.lg },
  icon: { fontSize: 28, lineHeight: 34 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold', color: c.foreground, marginBottom: 4 },
  cardBody2: { fontSize: FontSize.sm, color: c.mutedForeground, lineHeight: 20 },
  badge: { backgroundColor: 'rgba(138,154,124,0.12)', borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(138,154,124,0.3)', padding: Spacing.xl, marginBottom: Spacing['2xl'], alignItems: 'center' },
  badgeTitle: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold', color: c.secondary, marginBottom: Spacing.sm, textAlign: 'center' },
  badgeSub: { fontSize: FontSize.sm, color: c.mutedForeground, textAlign: 'center', lineHeight: 20 },
});
}
