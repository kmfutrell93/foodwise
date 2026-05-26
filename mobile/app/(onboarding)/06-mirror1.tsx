import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';
import { useOnboarding } from '@/context/OnboardingContext';

const mirrorCopy: Record<string, { emoji: string; headline: string; body: string }> = {
  protein: {
    emoji: '🥩',
    headline: "You're not failing — your medication is suppressing your hunger signals.",
    body: "Getting 100g+ of protein on 400-600 calories is nearly impossible without a plan. That's exactly what FoodWise solves.",
  },
  nausea: {
    emoji: '🤢',
    headline: "Injection day nausea is real, and it wrecks your nutrition.",
    body: "FoodWise schedules softer, smaller, high-protein meals on dose days — so you still hit your goals when nausea peaks.",
  },
  confusion: {
    emoji: '🤷',
    headline: "Generic meal plans weren't built for you.",
    body: "FoodWise is the only planner that knows your injection schedule, appetite level, and protein target — and plans around all three.",
  },
  muscle: {
    emoji: '💪',
    headline: "Losing muscle isn't inevitable — it's preventable with the right nutrition.",
    body: "FoodWise enforces your protein floor every single day, even on low-appetite days, to keep muscle on your frame.",
  },
};

export default function Mirror1() {
  const router = useRouter();
  const { data } = useOnboarding();
  const copy = mirrorCopy[data.primary_struggle ?? 'protein'];

  return (
    <OnboardingShell step={6}>
      <View style={styles.container}>
        <Text style={styles.emoji}>{copy.emoji}</Text>
        <Text style={styles.title}>{copy.headline}</Text>
        <Text style={styles.body}>{copy.body}</Text>

        <View style={styles.spacer} />

        <View style={styles.divider} />
        <Text style={styles.bridge}>
          Let's build a plan around <Text style={styles.highlight}>exactly</Text> how your body works right now.
        </Text>
        <View style={{ height: Spacing.lg }} />
        <Button label="Build my plan" onPress={() => router.push('/(onboarding)/07-question2')} />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  emoji: { fontSize: 56, marginBottom: Spacing.xl },
  title: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 32, marginBottom: Spacing.lg },
  body: { fontSize: FontSize.base, color: Colors.mutedForeground, lineHeight: 26 },
  spacer: { flex: 1 },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.lg },
  bridge: { fontSize: FontSize.base, color: Colors.foreground, lineHeight: 24 },
  highlight: { color: Colors.primary, fontFamily: 'PlusJakartaSans-Bold' },
});
