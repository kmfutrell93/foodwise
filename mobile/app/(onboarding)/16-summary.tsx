import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

const STRUGGLE_LABELS: Record<string, string> = {
  protein: 'Getting enough protein',
  nausea: 'Managing nausea & side effects',
  confusion: 'Knowing what to eat',
  muscle: 'Preventing muscle loss',
};

const APPETITE_LABELS: Record<string, string> = {
  low: 'Low — small portions, often skip meals',
  moderate: 'Moderate — smaller but manageable',
  normal: 'Normal — mostly unaffected',
};

export default function Summary() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const { data } = useOnboarding();

  const rows = [
    { label: 'Main struggle', value: STRUGGLE_LABELS[data.primary_struggle ?? ''] ?? '—' },
    { label: 'Protein target', value: data.protein_goal_range ? `${data.protein_goal_range}g / day` : '—' },
    {
      label: 'Dietary restrictions',
      value: (data.dietary_restrictions ?? []).length > 0
        ? (data.dietary_restrictions ?? []).join(', ')
        : 'None',
    },
    { label: 'Weekly budget', value: data.weekly_budget ? `$${data.weekly_budget}/week` : '—' },
    { label: 'Appetite level', value: APPETITE_LABELS[data.appetite_level ?? ''] ?? '—' },
  ];

  return (
    <OnboardingShell step={16}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.noriHeader}>
          <Image source={require('@/assets/images/nori_character.png')} style={s.noriImg} resizeMode="contain" />
        </View>
        <Text style={s.label}>Your profile</Text>
        <Text style={s.title}>Here's what FoodWise{'\n'}knows about you <Text style={s.titleHighlight}>so far.</Text></Text>
        <Text style={s.sub}>We'll use this to keep every recommendation precise — you can edit anytime in settings.</Text>

        <View style={s.card}>
          {rows.map((row, i) => (
            <View key={row.label} style={[s.row, i < rows.length - 1 && s.rowBorder]}>
              <Text style={s.rowLabel}>{row.label}</Text>
              <Text style={s.rowValue} numberOfLines={2}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={s.noteBox}>
          <Text style={s.noteIcon}>💡</Text>
          <Text style={s.noteText}>Two more quick questions and you're in — your medication schedule is the key to the whole plan.</Text>
        </View>

        <Button label="Almost done" onPress={() => router.push('/(onboarding)/17-habit')} />
      </ScrollView>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
  content: { paddingTop: Spacing.md, paddingBottom: Spacing['3xl'] },
  noriHeader: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  noriImg: { width: 64, height: 64 },
  titleHighlight: { color: c.primary },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: c.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, lineHeight: 38, marginBottom: Spacing.sm },
  sub: { fontSize: FontSize.sm, color: c.mutedForeground, lineHeight: 20, marginBottom: Spacing['2xl'] },
  card: { backgroundColor: c.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.border, marginBottom: Spacing.xl },
  row: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  rowLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold', color: c.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  rowValue: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: c.foreground },
  noteBox: { flexDirection: 'row', gap: Spacing.md, backgroundColor: 'rgba(29,158,117,0.08)', borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(29,158,117,0.2)', padding: Spacing.lg, marginBottom: Spacing['2xl'] },
  noteIcon: { fontSize: 20 },
  noteText: { flex: 1, fontSize: FontSize.sm, color: c.foreground, lineHeight: 20 },
});
}
