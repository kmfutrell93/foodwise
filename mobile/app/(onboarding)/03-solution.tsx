import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';

const features = [
  { icon: '💉', label: 'Injection-day aware', sub: 'Soft textures when nausea peaks' },
  { icon: '🥩', label: 'Protein-first planning', sub: 'Hits your goal even at low appetite' },
  { icon: '💰', label: 'Budget-matched meals', sub: 'Weekly grocery list under your cap' },
  { icon: '📊', label: 'Symptom-adaptive AI', sub: 'Adjusts meals when you log nausea' },
];

export default function Solution() {
  const router = useRouter();
  return (
    <OnboardingShell step={3}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.label}>The solution</Text>
        <Text style={styles.title}>A meal planner{'\n'}built around{'\n'}your medication.</Text>

        <View style={styles.grid}>
          {features.map((f) => (
            <View key={f.label} style={styles.card}>
              <Text style={styles.icon}>{f.icon}</Text>
              <Text style={styles.cardLabel}>{f.label}</Text>
              <Text style={styles.cardSub}>{f.sub}</Text>
            </View>
          ))}
        </View>

        <Button label="Show me how" onPress={() => router.push('/(onboarding)/04-aha')} />
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: Spacing.lg, paddingBottom: Spacing['3xl'] },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 38, marginBottom: Spacing['2xl'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
  card: { width: '47.5%', padding: Spacing.lg, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, gap: Spacing.xs },
  icon: { fontSize: 28 },
  cardLabel: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.foreground },
  cardSub: { fontSize: FontSize.xs, color: Colors.mutedForeground, lineHeight: 16 },
});
