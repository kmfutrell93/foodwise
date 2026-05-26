import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';
import { useOnboarding } from '@/context/OnboardingContext';

const budgetLabel = (b: number) => b <= 60 ? 'Tight ($40-60/wk)' : b <= 85 ? 'Sweet spot ($61-85/wk)' : 'Flexible ($86+/wk)';
const appetiteLabel = { low: 'Low appetite', moderate: 'Moderate appetite', normal: 'Normal appetite' };

export default function Summary() {
  const router = useRouter();
  const { data } = useOnboarding();

  const items = [
    { icon: '🎯', label: 'Main challenge', value: data.primary_struggle ? data.primary_struggle.charAt(0).toUpperCase() + data.primary_struggle.slice(1) + ' tracking' : '—' },
    { icon: '🥩', label: 'Protein goal', value: data.protein_goal_range ?? '—' },
    { icon: '🍽️', label: 'Dietary needs', value: data.dietary_restrictions.length > 0 ? data.dietary_restrictions.join(', ') : 'No restrictions' },
    { icon: '💰', label: 'Weekly budget', value: budgetLabel(data.weekly_budget) },
    { icon: '🌤️', label: 'Appetite level', value: data.appetite_level ? appetiteLabel[data.appetite_level] : '—' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Your profile</Text>
        <Text style={styles.title}>Here's what{'\n'}Nori knows{'\n'}about you.</Text>

        <View style={styles.card}>
          {items.map((item, idx) => (
            <View key={item.label} style={[styles.row, idx < items.length - 1 && styles.rowBorder]}>
              <Text style={styles.rowIcon}>{item.icon}</Text>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.note}>
          Nori will use this to generate injection-day aware, protein-first meals that fit your budget — every single week.
        </Text>

        <Button label="This is me — let's go!" onPress={() => router.push('/(onboarding)/17-habit')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing['3xl'], paddingBottom: Spacing['3xl'] },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 38, marginBottom: Spacing['2xl'] },
  card: { backgroundColor: Colors.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xl, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon: { fontSize: 22, width: 30 },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: FontSize.xs, color: Colors.mutedForeground, fontFamily: 'PlusJakartaSans-SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  rowValue: { fontSize: FontSize.base, color: Colors.foreground, fontFamily: 'PlusJakartaSans-SemiBold', marginTop: 2 },
  note: { fontSize: FontSize.sm, color: Colors.mutedForeground, lineHeight: 22, marginBottom: Spacing['2xl'], textAlign: 'center' },
});
