import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, MealPlan, MealDay, Profile } from '@/lib/supabase';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MealPlanScreen() {
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState<MealDay | null>(null);
  const [swapping, setSwapping] = useState<{ dayIndex: number; slot: string } | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: prof }, { data: latestPlan }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('meal_plans').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).single(),
    ]);
    setProfile(prof);
    setPlan(latestPlan);
    if (latestPlan?.plan_json?.days?.[0]) setSelectedDay(latestPlan.plan_json.days[0]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function generatePlan() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setGenerating(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const { data, error } = await supabase.functions.invoke('meal-plans/generate', {
      body: { user_id: user.id },
    });

    if (!error && data) {
      await load();
    }
    setGenerating(false);
  }

  async function swapMeal(dayIndex: number, slot: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !plan) return;
    setSwapping({ dayIndex, slot });
    Haptics.selectionAsync();

    const { data, error } = await supabase.functions.invoke('meal-plans/swap-meal', {
      body: { plan_id: plan.id, day_index: dayIndex, slot, user_id: user.id },
    });

    if (!error && data?.plan_json) {
      setPlan(prev => prev ? { ...prev, plan_json: data.plan_json } : prev);
      const updated = data.plan_json.days.find((_: any, i: number) => i === dayIndex);
      if (updated) setSelectedDay(updated);
    }
    setSwapping(null);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meal Plan</Text>
        <TouchableOpacity
          style={[styles.genBtn, generating && styles.genBtnLoading]}
          onPress={generatePlan}
          disabled={generating}
          activeOpacity={0.8}
        >
          {generating
            ? <ActivityIndicator size="small" color={Colors.primaryForeground} />
            : <Text style={styles.genBtnText}>⚡ Generate</Text>}
        </TouchableOpacity>
      </View>

      {!plan ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No plan yet</Text>
          <Text style={styles.emptySub}>Tap "Generate" to build your personalized 7-day meal plan.</Text>
        </View>
      ) : (
        <>
          {/* 7-day grid */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll} contentContainerStyle={styles.dayScrollContent}>
            {plan.plan_json.days.map((day, idx) => {
              const date = new Date(day.date);
              const isSelected = selectedDay?.date === day.date;
              return (
                <TouchableOpacity
                  key={day.date}
                  style={[styles.dayChip, isSelected && styles.dayChipSelected, day.is_injection_day && styles.dayChipInjection]}
                  onPress={() => { setSelectedDay(day); Haptics.selectionAsync(); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dayShort, isSelected && styles.dayShortSelected]}>{DAY_SHORT[date.getDay()]}</Text>
                  <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>{date.getDate()}</Text>
                  {day.is_injection_day && <Text style={styles.injBadge}>💉</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Selected day detail */}
          {selectedDay && (
            <ScrollView contentContainerStyle={styles.dayDetail} showsVerticalScrollIndicator={false}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayHeaderTitle}>
                  {new Date(selectedDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </Text>
                {selectedDay.is_injection_day && (
                  <View style={styles.injBadgeLarge}>
                    <Text style={styles.injBadgeLargeText}>💉 Injection Day</Text>
                  </View>
                )}
              </View>

              <View style={styles.totals}>
                {[
                  { label: 'Protein', val: `${selectedDay.totals.protein_g}g` },
                  { label: 'Calories', val: `${selectedDay.totals.calories}` },
                  { label: 'Cost', val: `$${selectedDay.totals.cost_usd.toFixed(2)}` },
                ].map(t => (
                  <View key={t.label} style={styles.total}>
                    <Text style={styles.totalVal}>{t.val}</Text>
                    <Text style={styles.totalLabel}>{t.label}</Text>
                  </View>
                ))}
              </View>

              {Object.entries(selectedDay.meals).map(([slot, meal], idx) => (
                <View key={slot} style={styles.mealCard}>
                  <View style={styles.mealCardHeader}>
                    <Text style={styles.mealSlot}>{slot.charAt(0).toUpperCase() + slot.slice(1)}</Text>
                    <TouchableOpacity
                      style={styles.swapBtn}
                      onPress={() => swapMeal(plan.plan_json.days.indexOf(selectedDay), slot)}
                      disabled={!!swapping}
                      activeOpacity={0.75}
                    >
                      {swapping?.slot === slot
                        ? <ActivityIndicator size="small" color={Colors.primary} />
                        : <Text style={styles.swapBtnText}>↻ Swap</Text>}
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealDesc}>{meal.description}</Text>
                  <View style={styles.mealMeta}>
                    <Text style={styles.metaChip}>🥩 {meal.protein_g}g</Text>
                    <Text style={styles.metaChip}>🔥 {meal.calories} cal</Text>
                    <Text style={styles.metaChip}>💰 ${meal.cost_usd.toFixed(2)}</Text>
                    <Text style={styles.metaChip}>⏱ {meal.prep_minutes}min</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  headerTitle: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground },
  genBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: 10 },
  genBtnLoading: { opacity: 0.7 },
  genBtnText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primaryForeground },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground },
  emptySub: { fontSize: FontSize.base, color: Colors.mutedForeground, textAlign: 'center', lineHeight: 24 },
  dayScroll: { maxHeight: 100 },
  dayScrollContent: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, gap: Spacing.sm },
  dayChip: { width: 60, padding: Spacing.sm, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 2 },
  dayChipSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(232,157,53,0.12)' },
  dayChipInjection: { borderColor: 'rgba(232,157,53,0.3)' },
  dayShort: { fontSize: FontSize.xs, color: Colors.mutedForeground, fontFamily: 'PlusJakartaSans-SemiBold' },
  dayShortSelected: { color: Colors.primary },
  dayNum: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground },
  dayNumSelected: { color: Colors.primary },
  injBadge: { fontSize: FontSize.xs },
  dayDetail: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'], gap: Spacing.md },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  dayHeaderTitle: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground },
  injBadgeLarge: { backgroundColor: 'rgba(232,157,53,0.15)', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  injBadgeLargeText: { fontSize: FontSize.xs, color: Colors.primary, fontFamily: 'PlusJakartaSans-SemiBold' },
  totals: { flexDirection: 'row', gap: Spacing.sm },
  total: { flex: 1, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 2 },
  totalVal: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.primary },
  totalLabel: { fontSize: FontSize.xs, color: Colors.mutedForeground },
  mealCard: { padding: Spacing.lg, borderRadius: Radius.xl, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  mealCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealSlot: { fontSize: FontSize.xs, color: Colors.mutedForeground, fontFamily: 'PlusJakartaSans-Bold', textTransform: 'uppercase', letterSpacing: 1 },
  swapBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  swapBtnText: { fontSize: FontSize.xs, color: Colors.primary, fontFamily: 'PlusJakartaSans-SemiBold' },
  mealName: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-Bold', color: Colors.foreground },
  mealDesc: { fontSize: FontSize.sm, color: Colors.mutedForeground, lineHeight: 20 },
  mealMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metaChip: { fontSize: FontSize.xs, color: Colors.foreground, backgroundColor: Colors.muted, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
});
