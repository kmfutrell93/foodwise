import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';

export default function AhaStat() {
  const router = useRouter();
  return (
    <OnboardingShell step={4}>
      <View style={styles.container}>
        <Text style={styles.label}>Did you know?</Text>

        <View style={styles.statCard}>
          <Text style={styles.statNum}>30%</Text>
          <Text style={styles.statDesc}>
            of weight lost on GLP-1 medications is{' '}
            <Text style={styles.highlight}>lean muscle mass</Text> — not fat.
          </Text>
        </View>

        <Text style={styles.title}>
          That's why protein{'\n'}tracking matters{'\n'}more than ever.
        </Text>
        <Text style={styles.sub}>
          Without a plan, reduced appetite means reduced protein — and your body breaks down muscle to compensate.
        </Text>

        <View style={styles.spacer} />

        <View style={styles.pill}>
          <Text style={styles.pillText}>🧬 Backed by clinical research on GLP-1 medications</Text>
        </View>

        <Button label="Protect my muscle" onPress={() => router.push('/(onboarding)/05-question1')} />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.lg },
  statCard: {
    backgroundColor: 'rgba(232,157,53,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(232,157,53,0.25)',
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  statNum: { fontSize: 72, fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.primary, lineHeight: 80 },
  statDesc: { fontSize: FontSize.base, color: Colors.foreground, textAlign: 'center', lineHeight: 24, marginTop: Spacing.sm },
  highlight: { color: Colors.accent },
  title: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 32, marginBottom: Spacing.md },
  sub: { fontSize: FontSize.base, color: Colors.mutedForeground, lineHeight: 24 },
  spacer: { flex: 1 },
  pill: {
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
    alignSelf: 'center',
  },
  pillText: { fontSize: FontSize.xs, color: Colors.mutedForeground },
});
