import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

const PRESETS = [
  { label: 'Budget', value: 55, sub: '~$7.86/day' },
  { label: 'Most popular', value: 75, sub: '~$10.71/day' },
  { label: 'Premium', value: 100, sub: '~$14.29/day' },
];

export default function Budget() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const { setField, saveStep } = useOnboarding();
  const [budget, setBudget] = useState(75);

  async function handleNext() {
    setField('weekly_budget', budget);
    await saveStep(11);
    router.push('/(onboarding)/12-appetite');
  }

  return (
    <OnboardingShell step={11}>
      <View style={s.container}>
        <Text style={s.label}>Step 2 of 3</Text>
        <Text style={s.title}>What's your{'\n'}<Text style={s.titleHighlight}>weekly grocery budget?</Text></Text>
        <Text style={s.sub}>We'll build meals that maximize nutrition within your budget.</Text>
        <View style={s.display}>
          <Text style={s.amount}>${budget}</Text>
          <Text style={s.perDay}>~${(budget / 7).toFixed(2)}/day · 7 days of meals</Text>
        </View>
        <View style={s.sliderWrap}>
          <Slider
            style={{ width: '100%', height: 44 }}
            minimumValue={40} maximumValue={200} step={5} value={budget}
            onValueChange={setBudget}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <View style={s.sliderLabels}>
            <Text style={s.sliderMin}>$40</Text>
            <Text style={s.sliderMax}>$200</Text>
          </View>
        </View>
        <View style={s.presets}>
          {PRESETS.map(p => (
            <TouchableOpacity
              key={p.label}
              style={[s.preset, budget === p.value && s.presetSelected]}
              onPress={() => setBudget(p.value)}
              activeOpacity={0.75}
            >
              <Text style={[s.presetLabel, budget === p.value && { color: colors.primary }]}>{p.label}</Text>
              <Text style={s.presetSub}>{p.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.spacer} />
        <Button label="Next: My appetite level" onPress={handleNext} />
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: c.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, lineHeight: 32, marginBottom: Spacing.sm },
  titleHighlight: { color: c.primary },
  sub: { fontSize: FontSize.sm, color: c.mutedForeground, marginBottom: Spacing['2xl'] },
  display: { alignItems: 'center', marginBottom: Spacing.xl },
  amount: { fontSize: 72, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.primary, lineHeight: 80 },
  perDay: { fontSize: FontSize.sm, color: c.mutedForeground, marginTop: Spacing.xs },
  sliderWrap: { marginBottom: Spacing.xl },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -Spacing.sm },
  sliderMin: { fontSize: FontSize.xs, color: c.mutedForeground },
  sliderMax: { fontSize: FontSize.xs, color: c.mutedForeground },
  presets: { flexDirection: 'row', gap: Spacing.sm },
  preset: { flex: 1, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, alignItems: 'center', gap: 2 },
  presetSelected: { borderColor: c.primary, backgroundColor: 'rgba(232,157,53,0.1)' },
  presetLabel: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: c.foreground },
  presetSub: { fontSize: FontSize.xs, color: c.mutedForeground },
  spacer: { flex: 1 },
});
}
