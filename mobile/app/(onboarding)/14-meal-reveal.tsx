import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';

const SAMPLE_MEALS = [
  { day: 'Monday', isInjection: false, meals: ['Greek yogurt parfait', 'Grilled chicken bowl', 'Salmon + roasted veg'] },
  { day: 'Tuesday 💉', isInjection: true, meals: ['Soft scrambled eggs', 'Pureed lentil soup', 'Mashed sweet potato + turkey'] },
  { day: 'Wednesday', isInjection: false, meals: ['Protein smoothie', 'Turkey lettuce wraps', 'Lean beef stir-fry'] },
];

export default function MealReveal() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Your plan preview</Text>
        <Text style={styles.title}>Here's a taste{'\n'}of what's coming.</Text>
        <Text style={styles.sub}>Real plan generates after setup. Injection days automatically get softer, gentler meals.</Text>

        <View style={styles.cards}>
          {SAMPLE_MEALS.map((day) => (
            <View key={day.day} style={[styles.dayCard, day.isInjection && styles.injectionCard]}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayLabel, day.isInjection && styles.injectionLabel]}>{day.day}</Text>
                {day.isInjection && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Injection Day</Text>
                  </View>
                )}
              </View>
              <View style={styles.mealList}>
                {day.meals.map((meal, i) => (
                  <View key={meal} style={styles.mealRow}>
                    <Text style={styles.mealTime}>{['B', 'L', 'D'][i]}</Text>
                    <Text style={styles.mealName}>{meal}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.statRow}>
          {[['~120g', 'Protein/day'], ['~$10', 'Cost/day'], ['~30min', 'Prep/day']].map(([val, lbl]) => (
            <View key={lbl} style={styles.stat}>
              <Text style={styles.statVal}>{val}</Text>
              <Text style={styles.statLbl}>{lbl}</Text>
            </View>
          ))}
        </View>

        <Button label="I love it — continue" onPress={() => router.push('/(onboarding)/15-review')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing['3xl'], paddingBottom: Spacing['3xl'] },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 38, marginBottom: Spacing.sm },
  sub: { fontSize: FontSize.sm, color: Colors.mutedForeground, lineHeight: 20, marginBottom: Spacing['2xl'] },
  cards: { gap: Spacing.sm, marginBottom: Spacing.xl },
  dayCard: { padding: Spacing.lg, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  injectionCard: { borderColor: 'rgba(232,157,53,0.4)', backgroundColor: 'rgba(232,157,53,0.06)' },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  dayLabel: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold', color: Colors.foreground },
  injectionLabel: { color: Colors.primary },
  badge: { backgroundColor: 'rgba(232,157,53,0.15)', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: FontSize.xs, color: Colors.primary, fontFamily: 'PlusJakartaSans-SemiBold' },
  mealList: { gap: Spacing.xs },
  mealRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  mealTime: { width: 18, fontSize: FontSize.xs, color: Colors.mutedForeground, fontFamily: 'PlusJakartaSans-Bold' },
  mealName: { fontSize: FontSize.sm, color: Colors.foreground },
  statRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  stat: { flex: 1, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 2 },
  statVal: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.primary },
  statLbl: { fontSize: FontSize.xs, color: Colors.mutedForeground },
});
