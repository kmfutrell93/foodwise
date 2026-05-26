import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { supabase, Profile, MealPlan, MealDay, Streak } from '@/lib/supabase';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── Protein Ring ──────────────────────────────────────────────────────────────
function ProteinRing({ eaten, goal }: { eaten: number; goal: number }) {
  const size = 160;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(eaten / goal, 1);
  const dash = pct * circ;

  return (
    <View style={ring.container}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={Colors.muted} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={pct >= 1 ? Colors.secondary : Colors.primary}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={ring.center}>
        <Text style={ring.eaten}>{eaten}g</Text>
        <Text style={ring.goal}>of {goal}g</Text>
        <Text style={ring.label}>protein</Text>
      </View>
    </View>
  );
}

const ring = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  center: { position: 'absolute', alignItems: 'center' },
  eaten: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground },
  goal: { fontSize: FontSize.sm, color: Colors.mutedForeground },
  label: { fontSize: FontSize.xs, color: Colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1 },
});

// ── Streak Badge ──────────────────────────────────────────────────────────────
function StreakBadge({ icon, label, count }: { icon: string; label: string; count: number }) {
  return (
    <View style={badge.wrap}>
      <Text style={badge.icon}>{icon}</Text>
      <Text style={badge.count}>{count}</Text>
      <Text style={badge.label}>{label}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, gap: 2 },
  icon: { fontSize: 20 },
  count: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.primary },
  label: { fontSize: FontSize.xs, color: Colors.mutedForeground, textAlign: 'center' },
});

// ── Injection Countdown ────────────────────────────────────────────────────────
function InjectionCountdown({ injectionDay, isToday }: { injectionDay: number | null; isToday: boolean }) {
  if (injectionDay === null) return null;
  const today = new Date().getDay();
  let daysLeft = (injectionDay - today + 7) % 7;

  if (isToday || daysLeft === 0) {
    return (
      <View style={[injection.banner, injection.bannerToday]}>
        <Text style={injection.icon}>💉</Text>
        <View>
          <Text style={[injection.title, injection.titleToday]}>Injection Day</Text>
          <Text style={injection.sub}>Softer meals scheduled today — nausea may peak</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={injection.banner}>
      <Text style={injection.icon}>💉</Text>
      <View>
        <Text style={injection.title}>Next injection in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</Text>
        <Text style={injection.sub}>{DAY_NAMES[injectionDay]}</Text>
      </View>
    </View>
  );
}

const injection = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  bannerToday: { borderColor: 'rgba(232,157,53,0.5)', backgroundColor: 'rgba(232,157,53,0.08)' },
  icon: { fontSize: 24 },
  title: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.foreground },
  titleToday: { color: Colors.primary },
  sub: { fontSize: FontSize.xs, color: Colors.mutedForeground, marginTop: 2 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mealsExpanded, setMealsExpanded] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: prof }, { data: plan }, { data: str }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('meal_plans').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('streaks').select('*').eq('user_id', user.id).single(),
    ]);

    setProfile(prof);
    setActivePlan(plan);
    setStreak(str);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function generatePlan() {
    if (!profile) return;
    const free = !profile.is_pro;
    const count = profile.meal_plans_generated ?? 0;
    if (free && count >= 3) {
      router.push('/(onboarding)/22-paywall');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/(app)/meal-plan');
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const today = new Date();
  const todayIndex = today.getDay();
  const isInjectionDay = profile?.injection_day === todayIndex;
  const todayMeals = getTodayMeals(activePlan, today);
  const proteinEaten = 0; // Will be computed from check-ins in a future iteration
  const proteinGoal = getProteinGoal(profile);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getGreeting()},</Text>
            <Text style={styles.headerTitle}>Here's your day 👋</Text>
          </View>
          <Text style={styles.noriIcon}>🦉</Text>
        </View>

        {/* Injection day banner */}
        <InjectionCountdown injectionDay={profile?.injection_day ?? null} isToday={isInjectionDay} />

        {/* Protein ring + streaks */}
        <View style={styles.ringRow}>
          <ProteinRing eaten={proteinEaten} goal={proteinGoal} />
          <View style={styles.streakCol}>
            <StreakBadge icon="🥩" label="Protein" count={streak?.protein_streak ?? 0} />
            <StreakBadge icon="✅" label="Check-in" count={streak?.checkin_streak ?? 0} />
            <StreakBadge icon="📅" label="Plan" count={streak?.plan_streak ?? 0} />
          </View>
        </View>

        {/* Today's meals */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setMealsExpanded(e => !e)}
            activeOpacity={0.75}
          >
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            <Text style={styles.chevron}>{mealsExpanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {todayMeals ? (
            mealsExpanded ? (
              <View style={styles.mealsFull}>
                {Object.entries(todayMeals.meals).map(([slot, meal]) => (
                  <View key={slot} style={styles.mealRow}>
                    <Text style={styles.mealSlot}>{slot.charAt(0).toUpperCase() + slot.slice(1)}</Text>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealName}>{meal.name}</Text>
                      <Text style={styles.mealMacros}>{meal.protein_g}g protein · {meal.calories} cal · ${meal.cost_usd.toFixed(2)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.mealPreview}>
                <Text style={styles.mealPreviewText}>
                  {Object.values(todayMeals.meals).map(m => m.name).join(' · ')}
                </Text>
                <Text style={styles.mealPreviewMacros}>
                  {todayMeals.totals.protein_g}g protein · {todayMeals.totals.calories} cal
                </Text>
              </View>
            )
          ) : (
            <View style={styles.emptyMeals}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={styles.emptyTitle}>No plan yet</Text>
              <Text style={styles.emptySub}>Generate your first 7-day plan below</Text>
            </View>
          )}
        </View>

        {/* Daily check-in card */}
        <CheckInCard profile={profile} onComplete={load} />

        {/* Generate plan button */}
        <TouchableOpacity style={styles.generateBtn} onPress={generatePlan} activeOpacity={0.85}>
          <Text style={styles.generateIcon}>⚡</Text>
          <View>
            <Text style={styles.generateTitle}>Generate New Plan</Text>
            <Text style={styles.generateSub}>
              {!profile?.is_pro
                ? `${3 - (profile?.meal_plans_generated ?? 0)} of 3 free generations remaining`
                : 'Unlimited regeneration — Pro'}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Check-in Card ─────────────────────────────────────────────────────────────
function CheckInCard({ profile, onComplete }: { profile: Profile | null; onComplete: () => void }) {
  const [done, setDone] = useState(false);
  const [logging, setLogging] = useState(false);

  async function handleCheckIn() {
    setLogging(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Update checkin streak
      await supabase.rpc('increment_streak', { p_user_id: user.id, p_streak_type: 'checkin' });
    }
    setDone(true);
    setLogging(false);
    onComplete();
  }

  if (done) {
    return (
      <View style={[checkin.card, checkin.cardDone]}>
        <Text style={checkin.doneIcon}>✅</Text>
        <Text style={checkin.doneText}>Check-in complete!</Text>
      </View>
    );
  }

  return (
    <View style={checkin.card}>
      <View style={checkin.top}>
        <Text style={checkin.title}>Daily Check-In</Text>
        <Text style={checkin.sub}>How are you feeling today?</Text>
      </View>
      <TouchableOpacity style={checkin.btn} onPress={handleCheckIn} disabled={logging} activeOpacity={0.8}>
        {logging ? <ActivityIndicator color={Colors.primaryForeground} size="small" /> : <Text style={checkin.btnText}>Log check-in ✓</Text>}
      </TouchableOpacity>
    </View>
  );
}

const checkin = StyleSheet.create({
  card: { padding: Spacing.xl, borderRadius: Radius.xl, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  cardDone: { borderColor: Colors.secondary, backgroundColor: 'rgba(138,154,124,0.08)', flexDirection: 'row', alignItems: 'center' },
  top: { gap: Spacing.xs },
  title: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-Bold', color: Colors.foreground },
  sub: { fontSize: FontSize.sm, color: Colors.mutedForeground },
  btn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primaryForeground },
  doneIcon: { fontSize: 24, marginRight: Spacing.md },
  doneText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-SemiBold', color: Colors.secondary },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function getProteinGoal(profile: Profile | null): number {
  const map: Record<string, number> = {
    under25: 60, '25-50': 80, '50-75': 100, '75-100': 120, '100plus': 140, unsure: 100,
  };
  return map[profile?.protein_goal_range ?? 'unsure'] ?? 100;
}

function getTodayMeals(plan: MealPlan | null, date: Date): MealDay | null {
  if (!plan) return null;
  const today = date.toISOString().split('T')[0];
  return plan.plan_json.days.find(d => d.date === today) ?? plan.plan_json.days[0] ?? null;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing['3xl'], gap: Spacing.lg },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: FontSize.sm, color: Colors.mutedForeground },
  headerTitle: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground },
  noriIcon: { fontSize: 36 },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  streakCol: { flex: 1, gap: Spacing.sm },
  section: { backgroundColor: Colors.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg },
  sectionTitle: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold', color: Colors.foreground },
  chevron: { color: Colors.mutedForeground, fontSize: FontSize.xs },
  mealsFull: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.md },
  mealRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  mealSlot: { width: 70, fontSize: FontSize.xs, color: Colors.mutedForeground, fontFamily: 'PlusJakartaSans-Bold', textTransform: 'uppercase', paddingTop: 2 },
  mealInfo: { flex: 1 },
  mealName: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: Colors.foreground },
  mealMacros: { fontSize: FontSize.xs, color: Colors.mutedForeground, marginTop: 2 },
  mealPreview: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  mealPreviewText: { fontSize: FontSize.sm, color: Colors.foreground, lineHeight: 22 },
  mealPreviewMacros: { fontSize: FontSize.xs, color: Colors.primary, marginTop: Spacing.xs },
  emptyMeals: { alignItems: 'center', padding: Spacing['2xl'], gap: Spacing.sm },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold', color: Colors.foreground },
  emptySub: { fontSize: FontSize.sm, color: Colors.mutedForeground, textAlign: 'center' },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(232,157,53,0.4)',
    backgroundColor: 'rgba(232,157,53,0.06)',
  },
  generateIcon: { fontSize: 28 },
  generateTitle: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary },
  generateSub: { fontSize: FontSize.sm, color: Colors.mutedForeground, marginTop: 2 },
});
