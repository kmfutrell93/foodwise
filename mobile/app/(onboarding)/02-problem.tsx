import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';

const problems = [
  { icon: '💪', label: "You're losing muscle", sub: 'not just fat' },
  { icon: '🤢', label: 'Nausea kills your appetite', sub: 'and protein suffers first' },
  { icon: '🍽️', label: 'No meal plan fits', sub: 'your changing hunger levels' },
  { icon: '💸', label: 'Eating healthy feels expensive', sub: 'on a GLP-1 budget' },
];

export default function Problem() {
  const router = useRouter();
  return (
    <OnboardingShell step={2}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.label}>The problem</Text>
        <Text style={styles.title}>GLP-1 medications{'\n'}change everything{'\n'}about eating.</Text>
        <Text style={styles.sub}>
          Ozempic, Wegovy, and Mounjaro shrink your appetite — but most nutrition advice was built for people without those constraints.
        </Text>

        <View style={styles.cards}>
          {problems.map((p) => (
            <View key={p.label} style={styles.card}>
              <Text style={styles.icon}>{p.icon}</Text>
              <View>
                <Text style={styles.cardLabel}>{p.label}</Text>
                <Text style={styles.cardSub}>{p.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <Button label="I feel this" onPress={() => router.push('/(onboarding)/03-solution')} />
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: Spacing.lg, paddingBottom: Spacing['3xl'], gap: 0 },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 38, marginBottom: Spacing.md },
  sub: { fontSize: FontSize.base, color: Colors.mutedForeground, lineHeight: 24, marginBottom: Spacing['2xl'] },
  cards: { gap: Spacing.sm, marginBottom: Spacing['2xl'] },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, padding: Spacing.lg, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  icon: { fontSize: 28 },
  cardLabel: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold', color: Colors.foreground },
  cardSub: { fontSize: FontSize.sm, color: Colors.mutedForeground, marginTop: 2 },
});
