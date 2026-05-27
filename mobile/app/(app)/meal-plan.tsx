import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase, MealPlan, MealDay, MealItem } from '@/lib/supabase';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import { trackMealSwapped, trackRecipeViewed } from '@/lib/analytics';

const DAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

const SLOT_COLORS: Record<string, string> = {
  breakfast: '#1D9E75', 'morning snack': '#A8F0D8',
  lunch: '#A8F0D8', snack: '#64748B', dinner: '#1D9E75', 'afternoon snack': '#64748B',
};

const MEAL_EMOJIS: Record<string, string> = {
  breakfast: '🥣', 'morning snack': '🥒',
  lunch: '🥢', snack: '🍎', dinner: '🐟',
};

export default function MealPlanScreen() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [swapping, setSwapping] = useState<string | null>(null);
  const [swapModal, setSwapModal] = useState<{ day: string; slot: string } | null>(null);
  const [swapReason, setSwapReason] = useState('');

  async function loadPlan() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(1)
      .single();
    if (data) setPlan(data);
  }

  useEffect(() => { loadPlan(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPlan();
    setRefreshing(false);
  }, []);

  async function swapMeal(day: string, slot: string, reason: string) {
    if (!plan) return;
    setSwapping(slot);
    setSwapModal(null);
    setSwapReason('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/meal-plans/swap-meal`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ plan_id: plan.id, day, slot, reason }),
        }
      );
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error ?? 'Swap failed'); }
      trackMealSwapped({ slot, day });
      await loadPlan();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Swap failed');
    } finally { setSwapping(null); }
  }

  async function generatePlan() {
    setGenerating(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/meal-plans/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({}),
        }
      );
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error ?? 'Generation failed'); }
      await loadPlan();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally { setGenerating(false); }
  }

  const days: MealDay[] = plan?.plan_json?.days ?? [];
  const day = days[selectedDay];
  const weekStart = plan ? new Date(plan.week_start) : null;
  const weekEnd = weekStart ? new Date(weekStart.getTime() + 6 * 86400000) : null;
  const weekLabel = weekStart && weekEnd
    ? `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : '';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.screenTitle}>Weekly Plan</Text>
            {weekLabel ? <Text style={[s.weekSub, { color: colors.mutedForeground }]}>{weekLabel}</Text> : null}
          </View>
          <TouchableOpacity
            style={[s.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={generatePlan}
            activeOpacity={0.8}
          >
            {generating
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Ionicons name="sparkles-outline" size={22} color={colors.primary} />}
          </TouchableOpacity>
        </View>

        {error && (
          <View style={[s.errorBox, { backgroundColor: 'rgba(29,158,117,0.13)', borderColor: 'rgba(29,158,117,0.27)' }]}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* Empty state */}
        {!plan && !generating && (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🍽️</Text>
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>No plan yet</Text>
            <Text style={[s.emptySub, { color: colors.mutedForeground }]}>Generate your first GLP-1 optimized 7-day meal plan.</Text>
            <TouchableOpacity style={[s.generateBtn, { backgroundColor: colors.primary }]} onPress={generatePlan} activeOpacity={0.85}>
              <Ionicons name="sparkles-outline" size={18} color={colors.primaryForeground} />
              <Text style={[s.generateBtnText, { color: colors.primaryForeground }]}>Generate my plan</Text>
            </TouchableOpacity>
          </View>
        )}

        {generating && !plan && (
          <View style={s.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[s.loadingText, { color: colors.mutedForeground }]}>Building your personalized plan…</Text>
          </View>
        )}

        {plan && (
          <>
            {/* Injection banner */}
            {day?.is_injection_day && (
              <View style={s.injBanner}>
                <Ionicons name="medical-outline" size={16} color={colors.accent} style={{ flexShrink: 0 }} />
                <Text style={[s.injBannerText, { color: colors.foreground }]}>
                  <Text style={{ color: colors.accent, fontFamily: 'PlusJakartaSans-Bold' }}>Injection day. </Text>
                  Gentle, low-nausea meals scheduled automatically.
                </Text>
              </View>
            )}

            {/* Day selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dayScroll} contentContainerStyle={s.dayScrollContent}>
              {days.map((d, i) => {
                const isActive = i === selectedDay;
                const isInjection = d.is_injection_day;
                return (
                  <TouchableOpacity
                    key={d.day}
                    style={[
                      s.dayPill,
                      { backgroundColor: isActive ? colors.primary : colors.card, borderColor: isActive ? colors.primary : isInjection ? 'rgba(29,158,117,0.5)' : colors.border },
                    ]}
                    onPress={() => setSelectedDay(i)}
                    activeOpacity={0.75}
                  >
                    {isInjection && !isActive && (
                      <Ionicons name="medical-outline" size={10} color={colors.accent} />
                    )}
                    <Text style={[
                      s.dayPillShort,
                      { color: isActive ? colors.primaryForeground + 'CC' : isInjection ? colors.accent : colors.mutedForeground },
                    ]}>
                      {DAY_SHORT[d.day.toLowerCase()] ?? d.day.slice(0, 3).toUpperCase()}
                    </Text>
                    <Text style={[
                      s.dayPillNum,
                      { color: isActive ? colors.primaryForeground : isInjection ? colors.accent : colors.foreground },
                    ]}>
                      {i + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {day && (
              <>
                {/* Flat macros row */}
                <View style={[s.macrosRow, { backgroundColor: colors.muted }]}>
                  <View style={s.macroStat}>
                    <Text style={[s.macroValue, { color: colors.primary }]}>{day.total_protein_g}g</Text>
                    <Text style={[s.macroLabel, { color: colors.mutedForeground }]}>Protein</Text>
                  </View>
                  <View style={[s.macroDivider, { backgroundColor: colors.border }]} />
                  <View style={s.macroStat}>
                    <Text style={[s.macroValue, { color: colors.secondary }]}>—</Text>
                    <Text style={[s.macroLabel, { color: colors.mutedForeground }]}>Fiber</Text>
                  </View>
                  <View style={[s.macroDivider, { backgroundColor: colors.border }]} />
                  <View style={s.macroStat}>
                    <Text style={[s.macroValue, { color: colors.accent }]}>{day.total_calories.toLocaleString()}</Text>
                    <Text style={[s.macroLabel, { color: colors.mutedForeground }]}>Calories</Text>
                  </View>
                  <View style={[s.macroDivider, { backgroundColor: colors.border }]} />
                  <View style={s.macroStat}>
                    <Text style={[s.macroValue, { color: colors.foreground }]}>
                      {day.estimated_cost != null ? `$${day.estimated_cost.toFixed(2)}` : '—'}
                    </Text>
                    <Text style={[s.macroLabel, { color: colors.mutedForeground }]}>Budget</Text>
                  </View>
                </View>

                {/* Meals */}
                <View style={s.mealsList}>
                  {day.meals?.map((meal: MealItem, mi: number) => {
                    const slotKey = meal.slot?.toLowerCase() ?? '';
                    const slotColor = SLOT_COLORS[slotKey] ?? colors.primary;
                    const emoji = MEAL_EMOJIS[slotKey] ?? '🍽️';
                    const delay = Math.min(mi, 6) * 60;
                    return (
                      <TouchableOpacity
                        key={mi}
                        activeOpacity={0.88}
                        onPress={() => {
                          trackRecipeViewed({ recipe_id: 'ai-meal', recipe_name: meal.name, meal_type: meal.slot, source: 'meal_plan' });
                          router.push({ pathname: '/(app)/recipe/[id]' as any, params: { id: 'ai-meal', name: meal.name, protein_g: String(meal.protein_g), calories: String(meal.calories), slot: meal.slot } });
                        }}
                      >
                      <Animated.View entering={FadeIn.delay(delay).duration(400)} style={[s.mealCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={s.mealCardTop}>
                          <View style={s.mealCardLeft}>
                            <View style={[s.slotBadge, { backgroundColor: slotColor + '1A' }]}>
                              <Text style={[s.slotBadgeText, { color: slotColor }]}>{meal.slot}</Text>
                            </View>
                            <Text style={[s.mealName, { color: colors.foreground }]}>{meal.name}</Text>
                            {meal.note ? (
                              <Text style={[s.mealDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{meal.note}</Text>
                            ) : null}
                          </View>
                          <View style={s.mealRight}>
                            <Text style={s.mealEmoji}>{emoji}</Text>
                            {swapping === meal.slot
                              ? <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />
                              : (
                                <TouchableOpacity
                                  style={[s.swapBtn, { backgroundColor: colors.muted + '80' }]}
                                  onPress={() => setSwapModal({ day: day.day, slot: meal.slot })}
                                  activeOpacity={0.7}
                                >
                                  <Ionicons name="refresh-outline" size={14} color={colors.mutedForeground} />
                                </TouchableOpacity>
                              )}
                          </View>
                        </View>
                        <View style={s.macroTags}>
                          <View style={[s.macroTag, { backgroundColor: 'rgba(29,158,117,0.12)' }]}>
                            <Text style={[s.macroTagText, { color: colors.secondary }]}>{meal.protein_g}g protein</Text>
                          </View>
                          <View style={[s.macroTag, { backgroundColor: colors.muted }]}>
                            <Text style={[s.macroTagText, { color: colors.mutedForeground }]}>{meal.calories} cal</Text>
                          </View>
                          {meal.cost != null && (
                            <View style={[s.macroTag, { backgroundColor: colors.muted }]}>
                              <Text style={[s.macroTagText, { color: colors.mutedForeground }]}>${meal.cost.toFixed(2)}</Text>
                            </View>
                          )}
                        </View>
                      </Animated.View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Regenerate */}
                <TouchableOpacity
                  style={[s.regenBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                  onPress={generatePlan}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh-outline" size={18} color={colors.mutedForeground} />
                  <Text style={[s.regenText, { color: colors.mutedForeground }]}>Regenerate This Day's Plan</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Swap modal */}
      <Modal visible={!!swapModal} transparent animationType="slide" onRequestClose={() => setSwapModal(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setSwapModal(null)} />
        <View style={[s.modalSheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Text style={[s.modalTitle, { color: colors.foreground }]}>Swap {swapModal?.slot}</Text>
          <Text style={[s.modalSub, { color: colors.mutedForeground }]}>Optional: tell us why so we can find a better match</Text>
          <TextInput
            style={[s.modalInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. Don't feel like fish, too expensive, nauseous…"
            placeholderTextColor={colors.mutedForeground}
            value={swapReason}
            onChangeText={setSwapReason}
            multiline
            autoFocus
          />
          <TouchableOpacity
            style={[s.modalBtn, { backgroundColor: colors.primary }]}
            onPress={() => swapModal && swapMeal(swapModal.day, swapModal.slot, swapReason)}
            activeOpacity={0.85}
          >
            <Text style={[s.modalBtnText, { color: colors.primaryForeground }]}>Find a replacement</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.modalCancel} onPress={() => setSwapModal(null)} activeOpacity={0.7}>
            <Text style={[s.modalCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    scroll: { paddingBottom: 120 },
    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, marginBottom: Spacing.lg },
    screenTitle: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, marginBottom: 2 },
    weekSub: { fontSize: FontSize.sm },
    headerBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    errorBox: { marginHorizontal: Spacing.xl, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.lg },
    errorText: { color: '#EF4444', fontSize: FontSize.sm },
    emptyState: { alignItems: 'center', paddingTop: Spacing['3xl'], paddingHorizontal: Spacing.xl },
    emptyIcon: { fontSize: 64, marginBottom: Spacing.xl },
    emptyTitle: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: Spacing.sm },
    emptySub: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20, marginBottom: Spacing['2xl'] },
    generateBtn: { borderRadius: Radius.full, paddingVertical: 16, paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center', gap: 8 },
    generateBtnText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold' },
    loadingState: { alignItems: 'center', paddingTop: Spacing['3xl'], gap: Spacing.xl },
    loadingText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-SemiBold' },
    injBanner: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, padding: 12, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: 'rgba(29,158,117,0.08)', borderWidth: 1, borderColor: 'rgba(29,158,117,0.2)' },
    injBannerText: { fontSize: FontSize.xs, flex: 1, lineHeight: 18 },
    dayScroll: { marginBottom: Spacing['2xl'] },
    dayScrollContent: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
    dayPill: { width: 56, height: 72, borderRadius: Radius.full, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 1 },
    dayPillShort: { fontSize: 10, fontFamily: 'PlusJakartaSans-Bold', textTransform: 'uppercase' },
    dayPillNum: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-ExtraBold' },
    macrosRow: { marginHorizontal: Spacing.xl, borderRadius: Radius.xl, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing['2xl'] },
    macroStat: { flex: 1, alignItems: 'center' },
    macroValue: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold' },
    macroLabel: { fontSize: FontSize.xs, marginTop: 2 },
    macroDivider: { width: 1, height: 24 },
    mealsList: { paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing['2xl'] },
    mealCard: { borderRadius: 24, borderWidth: 1, padding: 16 },
    mealCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
    mealCardLeft: { flex: 1, marginRight: Spacing.md },
    slotBadge: { alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8 },
    slotBadgeText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold' },
    mealName: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold', lineHeight: 22, marginBottom: 4 },
    mealDesc: { fontSize: FontSize.xs, lineHeight: 16 },
    mealRight: { alignItems: 'center', gap: 6 },
    mealEmoji: { fontSize: 32 },
    swapBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    macroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    macroTag: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 4 },
    macroTagText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold' },
    regenBtn: { marginHorizontal: Spacing.xl, borderRadius: Radius.full, borderWidth: 1, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    regenText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, paddingBottom: 40, borderTopWidth: 1 },
    modalTitle: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: 4 },
    modalSub: { fontSize: FontSize.sm, marginBottom: Spacing.xl },
    modalInput: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Regular', minHeight: 80, textAlignVertical: 'top', marginBottom: Spacing.xl },
    modalBtn: { borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', marginBottom: Spacing.sm },
    modalBtnText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold' },
    modalCancel: { alignItems: 'center', paddingVertical: Spacing.sm },
    modalCancelText: { fontSize: FontSize.sm },
  });
}
