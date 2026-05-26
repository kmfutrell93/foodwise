import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';
import { useOnboarding } from '@/context/OnboardingContext';
import * as Haptics from 'expo-haptics';

type Range = 'under25' | '25-50' | '50-75' | '75-100' | '100plus' | 'unsure';

const options: { value: Range; pct: string; label: string }[] = [
  { value: 'under25', pct: '<25%', label: 'Well below goal' },
  { value: '25-50', pct: '25–50%', label: 'About half' },
  { value: '50-75', pct: '50–75%', label: 'Most days close' },
  { value: '75-100', pct: '75–100%', label: 'Usually hitting it' },
  { value: '100plus', pct: '100%+', label: 'Always crushing it' },
  { value: 'unsure', pct: '?', label: "Don't know my goal" },
];

export default function Question2() {
  const router = useRouter();
  const { setField, saveStep } = useOnboarding();
  const [selected, setSelected] = useState<Range | null>(null);

  function handleSelect(val: Range) {
    setSelected(val);
    Haptics.selectionAsync();
  }

  async function handleNext() {
    if (!selected) return;
    setField('protein_goal_range', selected);
    await saveStep(7);
    router.push('/(onboarding)/08-mirror2');
  }

  return (
    <OnboardingShell step={7}>
      <View style={styles.container}>
        <Text style={styles.label}>Quick question</Text>
        <Text style={styles.title}>How close are you{'\n'}to hitting your{'\n'}protein goal daily?</Text>

        <View style={styles.grid}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.pill, selected === opt.value && styles.pillSelected]}
              onPress={() => handleSelect(opt.value)}
              activeOpacity={0.75}
            >
              <Text style={[styles.pct, selected === opt.value && styles.pctSelected]}>{opt.pct}</Text>
              <Text style={styles.pillLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button label="Continue" onPress={handleNext} disabled={!selected} />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 38, marginBottom: Spacing['2xl'] },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignContent: 'flex-start' },
  pill: {
    width: '47.5%',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  pillSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(232,157,53,0.1)' },
  pct: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.mutedForeground },
  pctSelected: { color: Colors.primary },
  pillLabel: { fontSize: FontSize.xs, color: Colors.mutedForeground, textAlign: 'center' },
});
