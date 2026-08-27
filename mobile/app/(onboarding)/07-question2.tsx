import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';

type Range = 'under25' | '25-50' | '50-75' | '75-100' | '100plus' | 'unsure';

const OPTIONS: { value: Range; pct: string; label: string }[] = [
  { value: 'under25', pct: 'Under 25%', label: 'Almost never' },
  { value: '25-50', pct: '25–50%', label: 'Rarely' },
  { value: '50-75', pct: '50–75%', label: 'Sometimes' },
  { value: '75-100', pct: '75–100%', label: 'Most days' },
  { value: '100plus', pct: '100%+', label: 'Every day' },
  { value: 'unsure', pct: 'Not sure', label: "Don't track" },
];

export default function Question2() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const { setField, saveStep } = useOnboarding();
  const [selected, setSelected] = useState<Range | null>(null);

  async function handleNext() {
    if (!selected) return;
    setField('protein_goal_range', selected);
    await saveStep(7, { protein_goal_range: selected });
    router.push('/(onboarding)/08-mirror2');
  }

  return (
    <OnboardingShell
      step={7}
      screenKey="07-question2"
      centerLabel="Question 2 of 2"
      skipRoute="/(onboarding)/10-restrictions"
    >
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Nori speech bubble */}
        <View style={s.noriRow}>
          <Image
            source={require('@/assets/images/nori_character.png')}
            style={s.noriImg}
            resizeMode="contain"
          />
          <View style={s.bubble}>
            <Text style={s.bubbleText}>Be honest — this helps me build your plan better. 😊</Text>
          </View>
        </View>

        <Text style={s.title}>
          On a typical day, how{'\n'}much of your <Text style={s.titleHighlight}>protein{'\n'}goal</Text> do you hit?
        </Text>
        <Text style={s.hint}>GLP-1 users should aim for 100–130g protein daily.</Text>

        {/* 3×2 pill grid */}
        <View style={s.grid}>
          {OPTIONS.map(opt => {
            const isSelected = selected === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[s.pill, isSelected && s.pillSelected]}
                onPress={() => { setSelected(opt.value); Haptics.selectionAsync(); }}
                activeOpacity={0.75}
              >
                <Text style={[s.pct, isSelected && s.pctSelected]}>{opt.pct}</Text>
                <Text style={s.pillLabel}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info box */}
        <View style={s.infoBox}>
          <Text style={s.infoIcon}>ℹ️</Text>
          <Text style={s.infoText}>
            Most GLP-1 users hit <Text style={s.infoStrong}>less than 50%</Text> of their protein goal — and don&apos;t even know it.
          </Text>
        </View>
      </ScrollView>
      <View style={s.footer}>
        <Button label="Be honest with me" onPress={handleNext} disabled={!selected} />
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    content: { paddingTop: Spacing.md, paddingBottom: Spacing.md },
    footer: { paddingTop: Spacing.md, paddingBottom: Spacing.xl },

    noriRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing['2xl'] },
    noriImg: { width: 48, height: 48 },
    bubble: {
      flex: 1,
      padding: Spacing.lg,
      borderRadius: Radius.xl,
      borderTopLeftRadius: 4,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    bubbleText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Medium', color: c.foreground },

    title: {
      fontSize: FontSize['2xl'],
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.foreground,
      lineHeight: 32,
      marginBottom: Spacing.sm,
    },
    titleHighlight: { color: c.primary },
    hint: { fontSize: FontSize.sm, color: c.mutedForeground, marginBottom: Spacing['2xl'] },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
    pill: {
      width: '30.5%',
      padding: Spacing.lg,
      borderRadius: Radius.lg,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.card,
      alignItems: 'center',
      gap: 2,
    },
    pillSelected: { borderColor: c.primary, backgroundColor: 'rgba(29,158,117,0.10)' },
    pct: {
      fontSize: FontSize.lg,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.foreground,
      textAlign: 'center',
    },
    pctSelected: { color: c.primary },
    pillLabel: { fontSize: 10, color: c.mutedForeground, textAlign: 'center' },

    infoBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
      padding: Spacing.lg,
      borderRadius: Radius.lg,
      backgroundColor: c.muted,
      marginBottom: Spacing.lg,
    },
    infoIcon: { fontSize: 16, marginTop: 1 },
    infoText: { flex: 1, fontSize: FontSize.xs, color: c.mutedForeground, lineHeight: 18 },
    infoStrong: { color: c.foreground, fontFamily: 'PlusJakartaSans-Bold' },
  });
}
