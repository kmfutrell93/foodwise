import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';

type AppetiteValue = 'low' | 'moderate' | 'normal';

const OPTIONS: {
  value: AppetiteValue;
  icon: string;
  label: string;
  sub: string;
  plan: string;
  badge?: string;
}[] = [
  {
    value: 'low',
    icon: '😶‍🌫️',
    label: 'Low',
    sub: "Barely hungry — I struggle to finish even small meals",
    plan: "Nori's plan: 4–5 ultra-small, protein-dense meals per day",
    badge: 'Most common',
  },
  {
    value: 'moderate',
    icon: '🙂',
    label: 'Moderate',
    sub: 'Some hunger — I can eat regular portions if I focus',
    plan: "Nori's plan: 3 meals + 1–2 protein-rich snacks",
  },
  {
    value: 'normal',
    icon: '😄',
    label: 'Normal',
    sub: "Usual appetite — medication hasn't changed much yet",
    plan: "Nori's plan: 3 balanced meals optimized for GLP-1",
  },
];

export default function Appetite() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const { setField, saveStep } = useOnboarding();
  const [selected, setSelected] = useState<AppetiteValue | null>(null);

  async function handleNext() {
    if (!selected) return;
    setField('appetite_level', selected);
    await saveStep(14, { appetite_level: selected }); // → 17-habit (med/injection before generate)
    router.push('/(onboarding)/17-habit');
  }

  return (
    <OnboardingShell step={12} screenKey="12-appetite">
      <View style={s.outer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.label}>Step 3 of 3</Text>
          <Text style={s.title}>How&apos;s your{'\n'}<Text style={s.titleHighlight}>appetite been lately?</Text></Text>
          <Text style={s.sub}>This helps Nori size your meals just right — not too much, not too little.</Text>

          <View style={s.options}>
            {OPTIONS.map(opt => {
              const isSelected = selected === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.card, isSelected && s.cardSelected]}
                  onPress={() => { setSelected(opt.value); Haptics.selectionAsync(); }}
                  activeOpacity={0.75}
                >
                  <Text style={s.icon}>{opt.icon}</Text>
                  <View style={s.labelRow}>
                    <Text style={[s.cardLabel, isSelected && s.cardLabelSelected]}>{opt.label}</Text>
                    {opt.badge && (
                      <View style={s.badge}>
                        <Text style={s.badgeText}>{opt.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.cardSub}>{opt.sub}</Text>
                  <View style={s.planBox}>
                    <Text style={s.planText}>{opt.plan}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        <Button label="Generate my meal plan!" onPress={handleNext} disabled={!selected} />
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    outer: { flex: 1, paddingTop: Spacing.md, paddingBottom: Spacing.xl },
    scroll: { paddingBottom: Spacing.xl },
    label: {
      fontSize: FontSize.sm,
      fontFamily: 'PlusJakartaSans-Bold',
      color: c.primary,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: Spacing.md,
    },
    title: {
      fontSize: FontSize['2xl'],
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.foreground,
      lineHeight: 32,
      marginBottom: Spacing.sm,
    },
    titleHighlight: { color: c.primary },
    sub: { fontSize: FontSize.sm, color: c.mutedForeground, marginBottom: Spacing['2xl'] },

    options: { gap: Spacing.lg },
    card: {
      padding: Spacing['2xl'],
      borderRadius: Radius.xl,
      borderWidth: 2,
      borderColor: c.border,
      backgroundColor: c.card,
      gap: Spacing.sm,
    },
    cardSelected: { borderColor: c.primary, backgroundColor: 'rgba(29,158,117,0.08)' },
    icon: { fontSize: 36 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    cardLabel: {
      fontSize: FontSize.lg,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.foreground,
    },
    cardLabelSelected: { color: c.primary },
    badge: {
      backgroundColor: 'rgba(29,158,117,0.10)',
      borderRadius: Radius.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: {
      fontSize: 10,
      fontFamily: 'PlusJakartaSans-Bold',
      color: c.primary,
    },
    cardSub: { fontSize: FontSize.sm, color: c.mutedForeground },
    planBox: {
      padding: Spacing.md,
      borderRadius: Radius.lg,
      backgroundColor: c.muted,
      marginTop: Spacing.xs,
    },
    planText: {
      fontSize: FontSize.xs,
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: c.foreground,
    },
  });
}
