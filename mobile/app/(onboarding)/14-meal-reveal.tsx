import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { BounceIn, FadeIn } from 'react-native-reanimated';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { supabase, MealDay } from '@/lib/supabase';
import { useOnboarding } from '@/context/OnboardingContext';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

const SLOT_LABEL_COLOR: Record<string, 'primary' | 'secondary' | 'accent'> = {
  breakfast: 'primary', lunch: 'secondary', dinner: 'secondary', snack: 'accent',
  'morning snack': 'accent', 'afternoon snack': 'accent',
};
const SLOT_TIME: Record<string, string> = {
  breakfast: '7:00 AM', 'morning snack': '10:00 AM', lunch: '12:30 PM',
  'afternoon snack': '3:00 PM', snack: '3:00 PM', dinner: '6:30 PM',
};
const APPETITE_LABELS: Record<string, string> = {
  low: 'Low appetite', moderate: 'Moderate appetite', normal: 'Normal appetite',
};

export default function MealReveal() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const { data: onboardingData } = useOnboarding();
  const [day, setDay] = useState<MealDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: plan } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(1)
        .single();
      if (plan?.plan_json?.days?.length > 0) {
        setDay(plan.plan_json.days[0]);
      }
      setLoading(false);
    })();
  }, []);

  const labelColors = {
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
  };

  const budgetLabel = onboardingData.weekly_budget ? `$${onboardingData.weekly_budget} budget` : '';
  const appetiteLabel = onboardingData.appetite_level ? APPETITE_LABELS[onboardingData.appetite_level] : '';
  const headerSub = ['Optimized for GLP-1', budgetLabel, appetiteLabel].filter(Boolean).join(' · ');

  return (
    <OnboardingShell step={14} screenKey="14-meal-reveal">
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Nori header */}
        <Animated.View entering={FadeIn.duration(500)} style={s.header}>
          <Image
            source={require('@/assets/images/nori_character.png')}
            style={s.noriImg}
            resizeMode="contain"
          />
          <View style={s.headerText}>
            <Text style={s.headerLabel}>Nori built this just for you</Text>
            <Text style={s.headerSub}>{headerSub}</Text>
          </View>
        </Animated.View>

        <Text style={s.title}>🎉 Your plan is ready!</Text>

        {loading && (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.loadingText}>Loading your plan…</Text>
          </View>
        )}

        {!loading && !day && (
          <View style={s.loadingBox}>
            <Text style={s.emptyText}>
              We&apos;re still finalizing your plan — tap below to continue, you&apos;ll find it in the Meal Plan tab.
            </Text>
          </View>
        )}

        {!loading && day && (
          <>
            {/* Macro strip */}
            <Animated.View entering={FadeIn.delay(150).duration(400)} style={s.macroStrip}>
              <View style={s.macroItem}>
                <Text style={[s.macroVal, { color: colors.primary }]}>{day.total_protein_g}g</Text>
                <Text style={s.macroLabel}>Protein</Text>
              </View>
              <View style={s.macroDivider} />
              <View style={s.macroItem}>
                <Text style={[s.macroVal, { color: colors.secondary }]}>—</Text>
                <Text style={s.macroLabel}>Fiber</Text>
              </View>
              <View style={s.macroDivider} />
              <View style={s.macroItem}>
                <Text style={[s.macroVal, { color: colors.accent }]}>{day.total_calories.toLocaleString()}</Text>
                <Text style={s.macroLabel}>Calories</Text>
              </View>
              <View style={s.macroDivider} />
              <View style={s.macroItem}>
                <Text style={[s.macroVal, { color: colors.foreground }]}>
                  {day.estimated_cost != null ? `$${day.estimated_cost.toFixed(2)}` : '—'}
                </Text>
                <Text style={s.macroLabel}>Today</Text>
              </View>
            </Animated.View>

            {day.day_note ? (
              <Text style={{ fontSize: FontSize.sm, color: colors.mutedForeground, marginBottom: Spacing.md, lineHeight: 20 }}>
                {day.day_note}
              </Text>
            ) : null}

            {/* Meal cards — staggered BounceIn */}
            <View style={{ gap: Spacing.lg }}>
              {day.meals.map((meal, idx) => {
                const slotKey = meal.slot?.toLowerCase() ?? '';
                const labelColor = SLOT_LABEL_COLOR[slotKey] ?? 'primary';
                const time = SLOT_TIME[slotKey] ?? '';
                return (
                  <Animated.View key={`${meal.slot}-${idx}`} entering={BounceIn.delay(idx * 120).duration(500)}>
                    <View style={s.mealCard}>
                      <View style={s.mealCardHeader}>
                        <View style={[s.mealLabel, { backgroundColor: labelColors[labelColor] + '1A' }]}>
                          <Text style={[s.mealLabelText, { color: labelColors[labelColor] }]}>{meal.slot}</Text>
                        </View>
                        {time ? <Text style={s.mealTime}>{time}</Text> : null}
                      </View>
                      <Text style={s.mealName}>{meal.name}</Text>
                      <View style={s.chips}>
                        <View style={s.chipProtein}>
                          <Text style={[s.chipText, { color: colors.secondary }]}>{meal.protein_g}g protein</Text>
                        </View>
                        <View style={s.chip}>
                          <Text style={[s.chipText, { color: colors.mutedForeground }]}>{meal.calories} cal</Text>
                        </View>
                        {meal.cost != null && (
                          <View style={s.chip}>
                            <Text style={[s.chipText, { color: colors.mutedForeground }]}>${meal.cost.toFixed(2)}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
      <View style={s.footer}>
        <Button label="Love it! Keep going" onPress={() => router.push('/(onboarding)/15-review')} />
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    content: { paddingTop: Spacing.md, paddingBottom: Spacing.md },
    footer: { paddingTop: Spacing.md, paddingBottom: Spacing.xl },

    header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
    noriImg: { width: 40, height: 40 },
    headerText: { flex: 1 },
    headerLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', color: c.primary },
    headerSub: { fontSize: FontSize.xs, color: c.mutedForeground },

    title: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, marginBottom: Spacing.lg },

    loadingBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.lg },
    loadingText: { fontSize: FontSize.sm, color: c.mutedForeground },
    emptyText: { fontSize: FontSize.sm, color: c.mutedForeground, textAlign: 'center', lineHeight: 20, paddingHorizontal: Spacing.lg },

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
    chipProtein: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: 'rgba(29,158,117,0.15)' },
    chipText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold' },
  });
}
