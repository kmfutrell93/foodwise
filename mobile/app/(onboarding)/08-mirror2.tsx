import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { useOnboarding } from '@/context/OnboardingContext';

const mirrorCopy: Record<string, { headline: string; body: string; cta: string }> = {
  under25: {
    headline: "Starting from scratch is actually the easiest to fix.",
    body: "When you're far from goal, every small improvement moves the needle. FoodWise will front-load your day with protein so you hit it before appetite crashes.",
    cta: 'Build my protein plan',
  },
  '25-50': {
    headline: "You're halfway there. The right plan closes the gap.",
    body: "Most people stuck at 25-50% are missing easy protein windows — breakfast and snacks. FoodWise plugs those gaps automatically.",
    cta: 'Close the gap',
  },
  '50-75': {
    headline: "You're close. FoodWise can get you over the line.",
    body: "At 50-75%, you're already doing the hard work. A few meal swaps and you'll be hitting goal consistently.",
    cta: 'Get to 100%',
  },
  '75-100': {
    headline: "You're already building great habits.",
    body: "FoodWise will lock in your success and make sure you keep hitting goal even on tough injection days.",
    cta: 'Lock in my habits',
  },
  '100plus': {
    headline: "You're a protein pro. Let's optimize everything else.",
    body: "FoodWise will fine-tune your injection-day textures, symptom tracking, and budget to keep you performing at this level.",
    cta: 'Optimize my plan',
  },
  unsure: {
    headline: "That's okay — most GLP-1 users have never been given a target.",
    body: "FoodWise will calculate your personal protein target based on your weight goals and set a realistic, achievable daily floor.",
    cta: 'Set my target',
  },
};

export default function Mirror2() {
  const router = useRouter();
  const { data } = useOnboarding();
  const copy = mirrorCopy[data.protein_goal_range ?? 'unsure'];

  return (
    <OnboardingShell step={8}>
      <View style={styles.container}>
        <Text style={styles.emoji}>💪</Text>
        <Text style={styles.title}>{copy.headline}</Text>
        <Text style={styles.body}>{copy.body}</Text>
        <View style={styles.spacer} />
        <Button label={copy.cta} onPress={() => router.push('/(onboarding)/09-try-intro')} />
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
});
