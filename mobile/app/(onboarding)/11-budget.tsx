import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import Slider from '@react-native-community/slider';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';
import { useOnboarding } from '@/context/OnboardingContext';

const presets = [
  { label: 'Tight', value: 55, sub: '~$7.86/day' },
  { label: 'Sweet spot', value: 75, sub: '~$10.71/day' },
  { label: 'Flexible', value: 100, sub: '~$14.29/day' },
];

export default function Budget() {
  const router = useRouter();
  const { setField, saveStep } = useOnboarding();
  const [budget, setBudget] = useState(75);

  const perDay = (budget / 7).toFixed(2);

  async function handleNext() {
    setField('weekly_budget', budget);
    await saveStep(11);
    router.push('/(onboarding)/12-appetite');
  }

  return (
    <OnboardingShell step={11}>
      <View style={styles.container}>
        <Text style={styles.label}>Grocery budget</Text>
        <Text style={styles.title}>Weekly grocery{'\n'}budget?</Text>
        <Text style={styles.sub}>We'll build your meal plan to stay under this.</Text>

        <View style={styles.display}>
          <Text style={styles.amount}>${budget}</Text>
          <Text style={styles.perDay}>~${perDay}/day · 7 days of meals</Text>
        </View>

        <View style={styles.sliderWrap}>
          <Slider
            style={{ width: '100%', height: 44 }}
            minimumValue={40}
            maximumValue={200}
            step={5}
            value={budget}
            onValueChange={setBudget}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderMin}>$40</Text>
            <Text style={styles.sliderMax}>$200</Text>
          </View>
        </View>

        <View style={styles.presets}>
          {presets.map((p) => (
            <View
              key={p.label}
              style={[styles.preset, budget === p.value && styles.presetSelected]}
            >
              <Text style={[styles.presetLabel, budget === p.value && { color: Colors.primary }]}>{p.label}</Text>
              <Text style={styles.presetSub}>{p.sub}</Text>
            </View>
          ))}
        </View>

        <View style={styles.spacer} />
        <Button label="Set my budget" onPress={handleNext} />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 38, marginBottom: Spacing.sm },
  sub: { fontSize: FontSize.sm, color: Colors.mutedForeground, marginBottom: Spacing['2xl'] },
  display: { alignItems: 'center', marginBottom: Spacing.xl },
  amount: { fontSize: 72, fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.primary, lineHeight: 80 },
  perDay: { fontSize: FontSize.sm, color: Colors.mutedForeground, marginTop: Spacing.xs },
  sliderWrap: { marginBottom: Spacing.xl },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -Spacing.sm },
  sliderMin: { fontSize: FontSize.xs, color: Colors.mutedForeground },
  sliderMax: { fontSize: FontSize.xs, color: Colors.mutedForeground },
  presets: { flexDirection: 'row', gap: Spacing.sm },
  preset: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 2,
  },
  presetSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(232,157,53,0.1)' },
  presetLabel: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.foreground },
  presetSub: { fontSize: FontSize.xs, color: Colors.mutedForeground },
  spacer: { flex: 1 },
});
