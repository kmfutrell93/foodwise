import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

const WITHOUT_MEALS = [
  { name: 'Breakfast — Coffee & toast', protein: '4g protein' },
  { name: 'Lunch — Skipped (not hungry)', protein: '0g protein' },
  { name: 'Dinner — Small salad', protein: '8g protein' },
];
const WITH_MEALS = [
  { name: 'Breakfast — Greek yogurt parfait', protein: '24g protein' },
  { name: 'Lunch — Turkey egg roll bowl', protein: '38g protein' },
  { name: 'Dinner — Salmon & edamame', protein: '52g protein' },
];

const COPY: Record<string, { headline: string; sub: string; cta: string }> = {
  under25: {
    headline: "Starting from scratch is actually the easiest to fix.",
    sub: "When you're far from goal, every small improvement moves the needle. FoodWise front-loads your day with protein so you hit it before appetite crashes.",
    cta: 'Build my protein plan',
  },
  '25-50': {
    headline: "You're halfway there. The right plan closes the gap.",
    sub: "Most people stuck at 25–50% are missing easy protein windows — breakfast and snacks. FoodWise plugs those gaps automatically.",
    cta: 'Close the gap',
  },
  '50-75': {
    headline: "You're close. FoodWise can get you over the line.",
    sub: "At 50–75%, you're already doing the hard work. A few meal swaps and you'll be hitting goal consistently.",
    cta: 'Get to 100%',
  },
  '75-100': {
    headline: "You're already building great habits.",
    sub: "FoodWise will lock in your success and make sure you keep hitting goal even on tough injection days.",
    cta: 'Lock in my habits',
  },
  '100plus': {
    headline: "You're a protein pro. Let's optimize everything else.",
    sub: "FoodWise will fine-tune your injection-day textures, symptom tracking, and budget to keep you performing at this level.",
    cta: 'Optimize my plan',
  },
  unsure: {
    headline: "That's okay — most GLP-1 users have never been given a real target.",
    sub: "FoodWise will calculate your personal protein target and set a realistic, achievable daily floor you can actually hit.",
    cta: 'Set my target',
  },
};

export default function Mirror2() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const { data } = useOnboarding();
  const copy = COPY[data.protein_goal_range ?? 'unsure'];

  return (
    <OnboardingShell step={8} skipRoute="/(onboarding)/10-restrictions">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* Empathy header */}
        <View style={s.header}>
          <Image
            source={require('@/assets/images/nori_character.png')}
            style={s.nori}
            resizeMode="contain"
          />
          <Text style={s.headline}>{copy.headline}</Text>
          <Text style={s.sub}>{copy.sub}</Text>
        </View>

        {/* Without FoodWise card */}
        <View style={s.card}>
          <Text style={s.cardLabel}>Typical day without FoodWise</Text>
          {WITHOUT_MEALS.map(m => (
            <View key={m.name} style={s.mealRow}>
              <Text style={s.mealName}>{m.name}</Text>
              <Text style={[s.mealProtein, { color: colors.accent }]}>{m.protein}</Text>
            </View>
          ))}
          <View style={s.barBg}>
            <View style={[s.barFill, { width: '12%', backgroundColor: colors.destructive }]} />
          </View>
          <Text style={[s.barNote, { color: colors.destructive }]}>12g / 120g daily goal (10%)</Text>
        </View>

        {/* With FoodWise card */}
        <View style={[s.card, s.cardGood]}>
          <Text style={[s.cardLabel, { color: colors.secondary }]}>✓ With FoodWise</Text>
          {WITH_MEALS.map(m => (
            <View key={m.name} style={s.mealRow}>
              <Text style={s.mealName}>{m.name}</Text>
              <Text style={[s.mealProtein, { color: colors.secondary }]}>{m.protein}</Text>
            </View>
          ))}
          <View style={s.barBg}>
            <View style={[s.barFill, { width: '95%', backgroundColor: colors.secondary }]} />
          </View>
          <Text style={[s.barNote, { color: colors.secondary }]}>114g / 120g daily goal (95%)</Text>
        </View>

        <Button label={copy.cta} onPress={() => router.push('/(onboarding)/08b-apple-health' as any)} />
      </ScrollView>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    content: { paddingTop: Spacing.md, paddingBottom: Spacing['2xl'] },

    header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
    nori: { width: 48, height: 48, marginBottom: Spacing.md },
    headline: {
      fontSize: FontSize['2xl'],
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.foreground,
      lineHeight: 32,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    sub: { fontSize: FontSize.sm, color: c.mutedForeground, lineHeight: 20, textAlign: 'center' },

    card: {
      padding: Spacing['2xl'],
      borderRadius: Radius.xl,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    cardGood: {
      backgroundColor: 'rgba(29,158,117,0.10)',
      borderColor: 'rgba(29,158,117,0.25)',
    },
    cardLabel: {
      fontSize: FontSize.xs,
      fontFamily: 'PlusJakartaSans-Bold',
      color: c.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.sm,
    },
    mealRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    mealName: { fontSize: FontSize.xs, color: c.foreground, flex: 1 },
    mealProtein: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold' },
    barBg: { height: 12, borderRadius: 6, backgroundColor: c.muted, overflow: 'hidden', marginTop: Spacing.sm },
    barFill: { height: '100%', borderRadius: 6 },
    barNote: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', marginTop: 4 },
  });
}
