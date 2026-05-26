import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';
import { useOnboarding } from '@/context/OnboardingContext';
import * as Haptics from 'expo-haptics';

type Struggle = 'protein' | 'nausea' | 'confusion' | 'muscle';

const options: { value: Struggle; icon: string; label: string; sub: string }[] = [
  { value: 'protein', icon: '🥩', label: "I'm not hitting my protein", sub: 'Small portions make it hard' },
  { value: 'nausea', icon: '🤢', label: 'Nausea kills my appetite', sub: 'Especially on injection day' },
  { value: 'confusion', icon: '🤷', label: "I don't know what to eat", sub: 'No plan built for GLP-1' },
  { value: 'muscle', icon: '💪', label: "I'm losing muscle, not fat", sub: 'Scale moves but body changes wrong' },
];

export default function Question1() {
  const router = useRouter();
  const { setField, saveStep } = useOnboarding();
  const [selected, setSelected] = useState<Struggle | null>(null);

  function handleSelect(val: Struggle) {
    setSelected(val);
    Haptics.selectionAsync();
  }

  async function handleNext() {
    if (!selected) return;
    setField('primary_struggle', selected);
    await saveStep(5);
    router.push('/(onboarding)/06-mirror1');
  }

  return (
    <OnboardingShell step={5}>
      <View style={styles.container}>
        <Text style={styles.label}>Quick question</Text>
        <Text style={styles.title}>What's your{'\n'}biggest struggle{'\n'}right now?</Text>

        <View style={styles.options}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.card, selected === opt.value && styles.cardSelected]}
              onPress={() => handleSelect(opt.value)}
              activeOpacity={0.75}
            >
              <View style={[styles.check, selected === opt.value && styles.checkSelected]}>
                {selected === opt.value && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.icon}>{opt.icon}</Text>
              <View style={styles.cardText}>
                <Text style={[styles.cardLabel, selected === opt.value && styles.cardLabelSelected]}>{opt.label}</Text>
                <Text style={styles.cardSub}>{opt.sub}</Text>
              </View>
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
  options: { flex: 1, gap: Spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(232,157,53,0.08)',
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkMark: { color: Colors.primaryForeground, fontSize: 12, fontFamily: 'PlusJakartaSans-Bold' },
  icon: { fontSize: 26 },
  cardText: { flex: 1 },
  cardLabel: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-SemiBold', color: Colors.foreground },
  cardLabelSelected: { color: Colors.primary },
  cardSub: { fontSize: FontSize.sm, color: Colors.mutedForeground, marginTop: 2 },
});
