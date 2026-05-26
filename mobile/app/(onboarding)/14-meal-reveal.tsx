import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { BounceIn, FadeIn } from 'react-native-reanimated';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

const SAMPLE_MEALS = [
  {
    label: 'Breakfast',
    labelColor: 'primary' as const,
    labelBg: 'rgba(232,157,53,0.10)',
    time: '7:00 AM',
    name: 'Greek Yogurt Protein Parfait',
    desc: '2% Greek yogurt, mixed berries, hemp seeds, honey drizzle',
    protein: '26g protein',
    cals: '280 cal',
    cost: '$2.10',
  },
  {
    label: 'Lunch',
    labelColor: 'secondary' as const,
    labelBg: 'rgba(138,154,124,0.10)',
    time: '12:30 PM',
    name: 'Turkey & Edamame Egg Roll Bowl',
    desc: 'Ground turkey, shredded cabbage, edamame, soy-ginger sauce, sesame',
    protein: '42g protein',
    cals: '420 cal',
    cost: '$4.20',
  },
  {
    label: 'Snack',
    labelColor: 'accent' as const,
    labelBg: 'rgba(216,127,99,0.10)',
    time: '3:00 PM',
    name: 'Cottage Cheese & Cucumber Bites',
    desc: 'Low-fat cottage cheese, sliced cucumbers, everything bagel seasoning',
    protein: '18g protein',
    cals: '150 cal',
    cost: '$1.50',
  },
  {
    label: 'Dinner',
    labelColor: 'secondary' as const,
    labelBg: 'rgba(138,154,124,0.08)',
    time: '6:30 PM',
    name: 'Lemon Herb Salmon & Broccoli',
    desc: 'Pan-seared salmon fillet, steamed broccoli, lemon-dill sauce',
    protein: '32g protein',
    cals: '530 cal',
    cost: '$2.70',
  },
];

export default function MealReveal() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();

  const labelColors = {
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
  };

  return (
    <OnboardingShell step={14}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* Nori header */}
        <Animated.View entering={FadeIn.duration(500)} style={s.header}>
          <Image
            source={require('@/assets/images/nori_character.png')}
            style={s.noriImg}
            resizeMode="contain"
          />
          <View style={s.headerText}>
            <Text style={s.headerLabel}>Nori built this just for you</Text>
            <Text style={s.headerSub}>Optimized for GLP-1 · $75 budget · Low appetite</Text>
          </View>
        </Animated.View>

        <Text style={s.title}>🎉 Your plan is ready!</Text>

        {/* Macro strip */}
        <Animated.View entering={FadeIn.delay(150).duration(400)} style={s.macroStrip}>
          <View style={s.macroItem}>
            <Text style={[s.macroVal, { color: colors.primary }]}>118g</Text>
            <Text style={s.macroLabel}>Protein</Text>
          </View>
          <View style={s.macroDivider} />
          <View style={s.macroItem}>
            <Text style={[s.macroVal, { color: colors.secondary }]}>24g</Text>
            <Text style={s.macroLabel}>Fiber</Text>
          </View>
          <View style={s.macroDivider} />
          <View style={s.macroItem}>
            <Text style={[s.macroVal, { color: colors.accent }]}>1,380</Text>
            <Text style={s.macroLabel}>Calories</Text>
          </View>
          <View style={s.macroDivider} />
          <View style={s.macroItem}>
            <Text style={[s.macroVal, { color: colors.foreground }]}>$10.50</Text>
            <Text style={s.macroLabel}>Today</Text>
          </View>
        </Animated.View>

        {/* Meal cards — staggered BounceIn */}
        <View style={{ gap: Spacing.lg }}>
          {SAMPLE_MEALS.map((meal, idx) => (
            <Animated.View key={meal.name} entering={BounceIn.delay(idx * 120).duration(500)}>
            <View style={s.mealCard}>
              <View style={s.mealCardHeader}>
                <View style={[s.mealLabel, { backgroundColor: meal.labelBg }]}>
                  <Text style={[s.mealLabelText, { color: labelColors[meal.labelColor] }]}>{meal.label}</Text>
                </View>
                <Text style={s.mealTime}>{meal.time}</Text>
              </View>
              <Text style={s.mealName}>{meal.name}</Text>
              <Text style={s.mealDesc}>{meal.desc}</Text>
              <View style={s.chips}>
                <View style={s.chipProtein}>
                  <Text style={[s.chipText, { color: colors.secondary }]}>{meal.protein}</Text>
                </View>
                <View style={s.chip}>
                  <Text style={[s.chipText, { color: colors.mutedForeground }]}>{meal.cals}</Text>
                </View>
                <View style={s.chip}>
                  <Text style={[s.chipText, { color: colors.mutedForeground }]}>{meal.cost}</Text>
                </View>
              </View>
            </View>
            </Animated.View>
          ))}
        </View>

        <View style={{ height: Spacing['2xl'] }} />
        <Button label="Love it! Keep going" onPress={() => router.push('/(onboarding)/15-review')} />
      </ScrollView>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    content: { paddingTop: Spacing.md, paddingBottom: Spacing['3xl'] },

    header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
    noriImg: { width: 40, height: 40 },
    headerText: { flex: 1 },
    headerLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', color: c.primary },
    headerSub: { fontSize: FontSize.xs, color: c.mutedForeground },

    title: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, marginBottom: Spacing.lg },

    macroStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.lg,
      borderRadius: Radius.xl,
      backgroundColor: c.muted,
      marginBottom: Spacing['2xl'],
    },
    macroItem: { alignItems: 'center', flex: 1 },
    macroVal: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-ExtraBold' },
    macroLabel: { fontSize: FontSize.xs, color: c.mutedForeground, marginTop: 2 },
    macroDivider: { width: 1, height: 32, backgroundColor: c.border },

    mealCard: {
      padding: Spacing.lg,
      borderRadius: Radius.xl,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    mealCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
    mealLabel: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
    mealLabelText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
    mealTime: { fontSize: FontSize.xs, color: c.mutedForeground },
    mealName: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, marginBottom: 4 },
    mealDesc: { fontSize: FontSize.xs, color: c.mutedForeground, lineHeight: 16, marginBottom: Spacing.md },
    chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: c.muted },
    chipProtein: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: 'rgba(138,154,124,0.15)' },
    chipText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold' },
  });
}
