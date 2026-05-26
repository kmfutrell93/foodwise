import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';
import { useOnboarding } from '@/context/OnboardingContext';
import * as Haptics from 'expo-haptics';

type Appetite = 'low' | 'moderate' | 'normal';

const options: { value: Appetite; icon: string; label: string; sub: string; detail: string }[] = [
  {
    value: 'low',
    icon: '🐌',
    label: 'Low',
    sub: 'Very small portions, often skip meals',
    detail: "We'll pack protein into mini-meals and shakes",
  },
  {
    value: 'moderate',
    icon: '🌤️',
    label: 'Moderate',
    sub: 'Smaller than pre-medication but manageable',
    detail: "We'll balance portion size with protein density",
  },
  {
    value: 'normal',
    icon: '🟢',
    label: 'Normal',
    sub: 'Appetite mostly unaffected',
    detail: "We'll focus on quality and hitting your targets",
  },
];

export default function Appetite() {
  const router = useRouter();
  const { setField, saveStep } = useOnboarding();
  const [selected, setSelected] = useState<Appetite | null>(null);

  function handleSelect(val: Appetite) {
    setSelected(val);
    Haptics.selectionAsync();
  }

  async function handleNext() {
    if (!selected) return;
    setField('appetite_level', selected);
    await saveStep(12);
    router.push('/(onboarding)/13-generating');
  }

  return (
    <OnboardingShell step={12}>
      <View style={styles.container}>
        <Text style={styles.label}>Your appetite</Text>
        <Text style={styles.title}>How's your appetite{'\n'}since starting{'\n'}medication?</Text>

        <View style={styles.options}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.card, selected === opt.value && styles.cardSelected]}
              onPress={() => handleSelect(opt.value)}
              activeOpacity={0.75}
            >
              <Text style={styles.icon}>{opt.icon}</Text>
              <View style={styles.cardBody}>
                <Text style={[styles.cardLabel, selected === opt.value && styles.cardLabelSelected]}>{opt.label}</Text>
                <Text style={styles.cardSub}>{opt.sub}</Text>
                {selected === opt.value && (
                  <Text style={styles.cardDetail}>{opt.detail}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.spacer} />
        <Button label="Generate my plan" onPress={handleNext} disabled={!selected} />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 38, marginBottom: Spacing['2xl'] },
  options: { gap: Spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  cardSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(232,157,53,0.08)' },
  icon: { fontSize: 30, lineHeight: 36 },
  cardBody: { flex: 1 },
  cardLabel: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-Bold', color: Colors.foreground },
  cardLabelSelected: { color: Colors.primary },
  cardSub: { fontSize: FontSize.sm, color: Colors.mutedForeground, marginTop: 2 },
  cardDetail: { fontSize: FontSize.sm, color: Colors.secondary, marginTop: Spacing.sm, fontFamily: 'PlusJakartaSans-SemiBold' },
  spacer: { flex: 1 },
});
