import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';

export default function TryIntro() {
  const router = useRouter();
  return (
    <OnboardingShell step={9}>
      <View style={styles.container}>
        <Text style={styles.label}>Let's personalize it</Text>
        <Text style={styles.title}>3 quick questions{'\n'}to build your{'\n'}first plan.</Text>
        <Text style={styles.sub}>
          Your answers shape every meal — from what's on your plate on injection day to the exact budget for your grocery list.
        </Text>

        <View style={styles.steps}>
          {[
            { num: '1', text: 'Dietary restrictions & aversions' },
            { num: '2', text: 'Weekly grocery budget' },
            { num: '3', text: 'Current appetite level' },
          ].map((s) => (
            <View key={s.num} style={styles.step}>
              <View style={styles.numBadge}>
                <Text style={styles.num}>{s.num}</Text>
              </View>
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.spacer} />
        <Button label="Let's go" onPress={() => router.push('/(onboarding)/10-restrictions')} />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 38, marginBottom: Spacing.md },
  sub: { fontSize: FontSize.base, color: Colors.mutedForeground, lineHeight: 24, marginBottom: Spacing['2xl'] },
  steps: { gap: Spacing.md },
  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  numBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(232,157,53,0.15)', alignItems: 'center', justifyContent: 'center' },
  num: { color: Colors.primary, fontFamily: 'PlusJakartaSans-Bold', fontSize: FontSize.base },
  stepText: { fontSize: FontSize.base, color: Colors.foreground, fontFamily: 'PlusJakartaSans-SemiBold' },
  spacer: { flex: 1 },
});
