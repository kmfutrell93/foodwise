import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withTiming, withSpring, withRepeat, withSequence, withDelay,
  cancelAnimation, BounceIn, FadeIn, SlideInRight,
  Easing, interpolate,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase, Profile, MealPlan, Streak } from '@/lib/supabase';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import { usePaywallGate } from '@/lib/usePaywallGate';
import { STARTER_GUIDE, GuideCard } from '@/lib/starter-guide';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const DAY_SHORT  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const MED_DISPLAY: Record<string,string> = {
  semaglutide: 'Wegovy', tirzepatide: 'Mounjaro',
  liraglutide: 'Victoza', other: 'GLP-1',
};

const SLOT_COLORS: Record<string,string> = {
  breakfast: '#E89D35', lunch: '#8A9A7C', dinner: '#D87F63', snack: '#9B968C',
};
const MEAL_EMOJIS: Record<string,string> = {
  breakfast: '🥣', lunch: '🥗', dinner: '🐟', snack: '🍎', 'morning snack': '🥒',
};
const MEAL_TIMES: Record<string,string> = {
  breakfast: '7am', 'morning snack': '10am', lunch: '12:30pm',
  'afternoon snack': '3pm', snack: '3pm', dinner: '6:30pm',
};
const DESTRUCTIVE = '#E06555';

type EmergencyItem = { name: string; reason: string; prep_mins: number };
type EmergencyResult = { items: EmergencyItem[]; mode: string; nausea_score: number; medication: string };

function getDaysSince(injectionDay: string): number {
  const today = new Date().getDay();
  const injDay = DAY_NAMES.indexOf(injectionDay.toLowerCase());
  if (injDay === -1) return 0;
  let diff = today - injDay;
  if (diff < 0) diff += 7;
  return diff;
}

function getNextDay(injectionDay: string): string {
  const idx = DAY_NAMES.indexOf(injectionDay.toLowerCase());
  return idx !== -1 ? (DAY_SHORT[idx] ?? '') : '';
}

function getInsight(daysSince: number, name: string): string {
  if (daysSince === 0) return `It's injection day, ${name}. Stick to soft, low-nausea foods — appetite suppression will be strongest today.`;
  if (daysSince === 1) return `Day after injection — nausea may peak. Focus on protein shakes, soft foods, and staying hydrated.`;
  if (daysSince <= 3) return `It's Day ${daysSince}. Appetite suppression is still strong. Make every bite count — prioritize protein above all.`;
  if (daysSince <= 5) return `It's Day ${daysSince} — appetite may return slightly. Use this window to hit protein early. Start with your yogurt parfait!`;
  return `It's Day ${daysSince}. Appetite returning before your next injection. Stay consistent with protein targets to preserve muscle.`;
}

function parseProteinGoal(range: string | null | undefined): number {
  if (!range) return 120;
  const nums = range.match(/\d+/g);
  return nums ? parseInt(nums[nums.length - 1]) : 120;
}

function RingCard({
  value, unit, label, subtitle, pct, color, icon, colors,
}: {
  value: string; unit: string; label: string; subtitle: string;
  pct: number; color: string; icon: string; colors: ThemeColors;
}) {
  const dash = Math.min(Math.max(pct, 0), 100);
  const dashAnim = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (dash > 0 && !hasAnimated.current) {
      hasAnimated.current = true;
      dashAnim.value = withTiming(dash, { duration: 1200, easing: Easing.out(Easing.cubic) });
      ringScale.value = withDelay(1200, withSequence(withSpring(1.03), withSpring(1.0)));
    }
  }, [dash]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: 100 - dashAnim.value,
  }));

  const cardScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <Animated.View style={[ring.card, { backgroundColor: colors.card, borderColor: colors.border }, cardScaleStyle]}>
      <View style={ring.svgWrap}>
        <View style={{ transform: [{ rotate: '-90deg' }] }}>
          <Svg viewBox="0 0 36 36" width={64} height={64}>
            <Circle cx="18" cy="18" r="15.9" fill="none" stroke={colors.muted} strokeWidth="4" />
            <AnimatedCircle
              cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="100 100"
              animatedProps={animatedProps}
            />
          </Svg>
        </View>
        <Text style={[ring.icon, { color }]}>{icon}</Text>
      </View>
      <Text style={[ring.value, { color: colors.foreground }]}>
        {value}<Text style={[ring.unit, { color: colors.mutedForeground }]}>{unit}</Text>
      </Text>
      <Text style={[ring.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[ring.subtitle, { color }]}>{subtitle}</Text>
    </Animated.View>
  );
}

const ring = StyleSheet.create({
  card: { width: 144, padding: 16, borderRadius: 24, borderWidth: 1, alignItems: 'center' },
  svgWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  icon: { position: 'absolute', fontSize: 20 },
  value: { fontSize: 24, fontFamily: 'PlusJakartaSans-ExtraBold' },
  unit: { fontSize: 11, fontFamily: 'PlusJakartaSans-Regular' },
  label: { fontSize: 11, marginTop: 2 },
  subtitle: { fontSize: 11, fontFamily: 'PlusJakartaSans-Bold', marginTop: 4 },
});

const MODE_CONFIG: Record<string, { icon: string; title: string; color: string }> = {
  nausea: { icon: '🤢', title: 'Nausea mode — gentle foods only', color: '#8A9A7C' },
  constipation: { icon: '🌿', title: 'High-fibre foods to get things moving', color: '#E89D35' },
  gentle: { icon: '🥣', title: 'Easy, nourishing options right now', color: '#8A9A7C' },
};

export default function Home() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayPlan, setTodayPlan] = useState<MealPlan | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [planCount, setPlanCount] = useState(0);
  const requirePro = usePaywallGate();

  // Emergency mode
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyData, setEmergencyData] = useState<EmergencyResult | null>(null);

  // Starter guide
  const [guideStep, setGuideStep] = useState(0);

  // ── Entry animation values ────────────────────────────────
  const headerAnim    = useSharedValue(0);
  const ringsAnim     = useSharedValue(0);
  const streakAnim    = useSharedValue(0);
  const mealsAnim     = useSharedValue(0);
  const emergencyAnim = useSharedValue(0);
  const entryFired    = useRef(false);

  // ── Emergency button pulse ────────────────────────────────
  const emergencyScale         = useSharedValue(1);
  const emergencyBorderOpacity = useSharedValue(1);

  const FREE_PLAN_LIMIT = 3;

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [profileRes, planRes, streakRes, countRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('meal_plans').select('*').eq('user_id', user.id).order('week_start', { ascending: false }).limit(1).single(),
      supabase.from('streaks').select('*').eq('user_id', user.id).single(),
      supabase.from('meal_plans').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);
    if (profileRes.data) {
      setProfile(profileRes.data);
      setGuideStep(profileRes.data.starter_guide_step ?? 0);
    }
    if (planRes.data) setTodayPlan(planRes.data);
    if (streakRes.data) setStreak(streakRes.data);
    setPlanCount(countRes.count ?? 0);
  }

  useEffect(() => { load(); }, []);

  // Entry sequence — fires once on mount
  useEffect(() => {
    if (entryFired.current) return;
    entryFired.current = true;
    headerAnim.value    = withTiming(1, { duration: 400 });
    ringsAnim.value     = withDelay(200, withTiming(1, { duration: 400 }));
    streakAnim.value    = withDelay(200, withTiming(1, { duration: 400 }));
    mealsAnim.value     = withDelay(350, withTiming(1, { duration: 450 }));
    emergencyAnim.value = withDelay(500, withTiming(1, { duration: 400 }));
  }, []);

  // Emergency pulse — continuous
  useEffect(() => {
    emergencyScale.value = withRepeat(
      withSequence(withTiming(1.04, { duration: 1000 }), withTiming(1.0, { duration: 1000 })),
      -1, false,
    );
    emergencyBorderOpacity.value = withRepeat(
      withSequence(withTiming(0.5, { duration: 750 }), withTiming(1.0, { duration: 750 })),
      -1, false,
    );
    return () => {
      cancelAnimation(emergencyScale);
      cancelAnimation(emergencyBorderOpacity);
    };
  }, []);

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerAnim.value,
    transform: [{ translateY: interpolate(headerAnim.value, [0, 1], [-20, 0]) }],
  }));
  const ringsStyle = useAnimatedStyle(() => ({ opacity: ringsAnim.value }));
  const streakStyle = useAnimatedStyle(() => ({ opacity: streakAnim.value }));
  const mealsStyle = useAnimatedStyle(() => ({
    opacity: mealsAnim.value,
    transform: [{ translateY: interpolate(mealsAnim.value, [0, 1], [30, 0]) }],
  }));
  const emergencyContainerStyle = useAnimatedStyle(() => ({
    opacity: emergencyAnim.value,
    transform: [{ scale: emergencyScale.value }],
  }));
  const emergencyBorderStyle = useAnimatedStyle(() => ({
    opacity: emergencyBorderOpacity.value,
  }));

  async function generatePlan() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (planCount >= FREE_PLAN_LIMIT) {
      const allowed = await requirePro();
      if (!allowed) return;
    }
    setGeneratingPlan(true);
    setGenerateError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/meal-plans/generate`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({}) }
      );
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error ?? 'Generation failed'); }
      await load();
    } catch (e: unknown) {
      setGenerateError(e instanceof Error ? e.message : 'Something went wrong');
    } finally { setGeneratingPlan(false); }
  }

  async function openEmergencyMode() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setEmergencyOpen(true);
    if (!emergencyData) {
      setEmergencyLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/emergency-meal`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        if (res.ok) setEmergencyData(await res.json());
      } finally {
        setEmergencyLoading(false);
      }
    }
  }

  async function advanceGuideStep(card: GuideCard) {
    Haptics.selectionAsync();
    const nextStep = guideStep + 1;
    const isLast = nextStep >= STARTER_GUIDE.length;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({
      starter_guide_step: nextStep,
      starter_guide_completed: isLast,
    }).eq('id', user.id);
    setGuideStep(nextStep);
    if (card.cta_action === 'meal_plan') router.push('/(app)/meal-plan' as any);
    else if (card.cta_action === 'symptom_tracker') router.push('/(app)/symptom-tracker' as any);
  }

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, []);

  const now = new Date();
  const h = now.getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const todayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayDayData = todayPlan?.plan_json?.days?.find((d: { day: string }) => d.day.toLowerCase() === todayName);

  const daysSince = profile?.injection_day ? getDaysSince(profile.injection_day) : 4;
  const isInjectionDay = daysSince === 0;
  const isTomorrow = daysSince === 1;
  const insight = getInsight(daysSince, firstName);
  const medName = MED_DISPLAY[profile?.medication ?? ''] ?? 'GLP-1';
  const nextDay = profile?.injection_day ? getNextDay(profile.injection_day) : '';

  const proteinGoal = parseProteinGoal(profile?.protein_goal_range);
  const proteinG = todayDayData?.total_protein_g ?? 0;
  const calories = todayDayData?.total_calories ?? 0;
  const proteinPct = Math.round((proteinG / proteinGoal) * 100);
  const caloriePct = Math.round((calories / 1380) * 100);
  const streakCount = streak?.current_streak ?? 0;

  const todayMeals: { slot: string; name: string; protein_g: number; calories: number }[] =
    (todayDayData as any)?.meals ?? [];

  // Escalation awareness
  const daysOnDose = profile?.dose_start_date
    ? Math.floor((Date.now() - new Date(profile.dose_start_date).getTime()) / 86_400_000)
    : null;
  const isNewDose = daysOnDose !== null && daysOnDose <= 7;
  const isEscalationWeek = daysOnDose !== null && daysOnDose > 7 && (28 - daysOnDose) <= 7;
  const showEscalationCard = isNewDose || isEscalationWeek;

  // Starter guide
  const showStarterGuide = profile?.time_on_medication === 'less_than_1_month' && !profile?.starter_guide_completed;
  const currentGuideCard = showStarterGuide ? STARTER_GUIDE[guideStep] ?? null : null;

  const modeConfig = MODE_CONFIG[emergencyData?.mode ?? 'gentle'];

  const medCardEntering = isInjectionDay
    ? FadeIn.duration(400)
    : isTomorrow
      ? SlideInRight.duration(300)
      : FadeIn.duration(400);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <Animated.View style={[s.header, headerStyle]}>
          <View style={s.headerLeft}>
            <View>
              <Image source={require('@/assets/images/nori_pointing_right_1.png')} style={s.noriAvatar} resizeMode="contain" />
              <View style={[s.onlineDot, { borderColor: colors.background }]} />
            </View>
            <View>
              <Text style={s.greeting}>{greeting},</Text>
              <Text style={s.name}>{firstName} 👋</Text>
            </View>
          </View>
          <View style={[s.bellBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[s.bellDot, { backgroundColor: DESTRUCTIVE, borderColor: colors.background }]} />
            <Ionicons name="notifications-outline" size={22} color={colors.mutedForeground} />
          </View>
        </Animated.View>

        {/* Injection day card */}
        {profile?.medication && profile?.injection_day && (
          <Animated.View entering={medCardEntering} style={s.medCard}>
            {isInjectionDay && (
              <Animated.View
                style={[StyleSheet.absoluteFill, s.medCardGlowBorder, emergencyBorderStyle]}
                pointerEvents="none"
              />
            )}
            <View style={s.medLeft}>
              <View style={s.medIconCircle}>
                <Ionicons name="medical-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={s.medName}>
                  {medName}
                  <Text style={s.medDay}> · Day {daysSince} of 7</Text>
                </Text>
                <View style={s.dotBars}>
                  {[0,1,2,3,4,5,6].map(i => (
                    <View key={i} style={[s.dotBar, { backgroundColor: i < daysSince ? colors.primary : colors.muted }]} />
                  ))}
                </View>
              </View>
            </View>
            {nextDay ? (
              <View style={s.nextBadge}>
                <Text style={[s.nextBadgeText, { color: colors.primary }]}>Next: {nextDay}</Text>
              </View>
            ) : null}
          </Animated.View>
        )}

        {/* Hydration banner — injection day only */}
        {isInjectionDay && (
          <Animated.View entering={FadeIn.delay(100).duration(400)} style={s.hydrationBanner}>
            <Text style={s.hydrationIcon}>💧</Text>
            <View style={s.hydrationBody}>
              <Text style={s.hydrationTitle}>Drink water now</Text>
              <Text style={s.hydrationSub}>Hydration cuts nausea on dose day. Have a full glass before your next meal.</Text>
            </View>
          </Animated.View>
        )}

        {/* Escalation awareness card */}
        {showEscalationCard && (
          <Animated.View entering={FadeIn.duration(400)} style={s.escalationCard}>
            <Ionicons name="warning-outline" size={20} color={colors.primary} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.escalationTitle}>
                {isNewDose ? 'New dose this week' : 'Dose escalation this week'}
              </Text>
              <Text style={s.escalationSub}>
                {isNewDose
                  ? 'Side effects are strongest in the first 7 days on a new dose. Soft textures, lots of water.'
                  : 'Your next dose increase is coming up. Meal plan is already adjusted for stronger side effects.'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* AI Insight */}
        <View style={s.insightCard}>
          <Image source={require('@/assets/images/nori_pointing_right_1.png')} style={s.noriSmall} resizeMode="contain" />
          <View style={s.insightBody}>
            <Text style={[s.insightLabel, { color: colors.secondary }]}>Nori's insight for today</Text>
            <Text style={[s.insightText, { color: colors.foreground }]}>{insight}</Text>
          </View>
        </View>

        {/* Starter Guide strip — new users only */}
        {currentGuideCard && (
          <View style={s.guideStrip}>
            <View style={s.guideHeader}>
              <Text style={s.guideHeaderLabel}>New Starter Guide</Text>
              <Text style={s.guideHeaderPct}>{guideStep + 1} of {STARTER_GUIDE.length}</Text>
            </View>
            <View style={[s.guideCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={s.guideCardIcon}>{currentGuideCard.icon}</Text>
              <View style={s.guideCardBody}>
                <Text style={[s.guideCardTitle, { color: colors.foreground }]}>{currentGuideCard.title}</Text>
                <Text style={[s.guideCardBody2, { color: colors.mutedForeground }]}>{currentGuideCard.body}</Text>
                <TouchableOpacity
                  style={[s.guideCardCta, { backgroundColor: colors.primary }]}
                  onPress={() => advanceGuideStep(currentGuideCard)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.guideCardCtaText, { color: colors.primaryForeground }]}>{currentGuideCard.cta_label}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Daily Progress */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Daily Progress</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/progress' as any)}>
            <Text style={[s.sectionLink, { color: colors.primary }]}>Details</Text>
          </TouchableOpacity>
        </View>
        <Animated.View style={ringsStyle}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.ringsScroll} contentContainerStyle={s.ringsContent}>
            <RingCard value={`${proteinG}`} unit="g" label="Protein" subtitle={`${proteinG}/${proteinGoal}g`} pct={proteinPct} color={colors.primary} icon="🥩" colors={colors} />
            <RingCard value="15" unit="g" label="Fiber" subtitle="15/25g" pct={60} color={colors.secondary} icon="🌿" colors={colors} />
            <RingCard value="48" unit="oz" label="Hydration" subtitle="48/80oz" pct={60} color={colors.accent} icon="💧" colors={colors} />
            <RingCard value={`${calories}`} unit="" label="Calories" subtitle={`${calories}/1,380`} pct={caloriePct} color={DESTRUCTIVE} icon="🔥" colors={colors} />
          </ScrollView>
        </Animated.View>

        {/* Streak card */}
        <Animated.View
          entering={BounceIn.delay(300).duration(600)}
          style={[s.streakCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Animated.View style={streakStyle}>
            <View style={s.streakIconWrap}>
              <Ionicons name="flame" size={28} color={colors.primary} />
            </View>
          </Animated.View>
          <View style={s.streakBody}>
            <View style={s.streakTopRow}>
              <Text style={[s.streakTitle, { color: colors.foreground }]}>{streakCount} Day Streak! 🔥</Text>
              <View style={s.xpBadge}>
                <Text style={[s.xpText, { color: colors.primary }]}>+50 XP</Text>
              </View>
            </View>
            <Text style={[s.streakSub, { color: colors.mutedForeground }]}>
              {streakCount > 0 ? `Protein goal hit ${streakCount} days straight. Keep going!` : 'Log your first symptoms to start your streak.'}
            </Text>
            <View style={s.weekDots}>
              {[0,1,2,3,4,5,6].map(i => (
                <View key={i} style={[s.weekDot, { backgroundColor: i < Math.min(streakCount, 7) ? colors.primary : colors.muted }]}>
                  <Text style={[s.weekDotText, { color: i < Math.min(streakCount, 7) ? colors.primaryForeground : colors.mutedForeground }]}>
                    {i < Math.min(streakCount, 7) ? '✓' : '·'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Today's Meals */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Today's Meals</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center' }}>
            <TouchableOpacity onPress={generatePlan} disabled={generatingPlan}>
              <Text style={[s.sectionLink, { color: colors.mutedForeground }]}>
                {generatingPlan ? 'Generating…' : 'New plan'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(app)/meal-plan' as any)}>
              <Text style={[s.sectionLink, { color: colors.primary }]}>Full plan</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Animated.View style={mealsStyle}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.mealsScroll} contentContainerStyle={s.mealsContent}>
            {(todayMeals.length > 0 ? todayMeals : DEMO_MEALS).map((meal, i) => {
              const slotKey = meal.slot?.toLowerCase() ?? '';
              const slotColor = SLOT_COLORS[slotKey] ?? colors.primary;
              const emoji = MEAL_EMOJIS[slotKey] ?? '🍽️';
              const time = MEAL_TIMES[slotKey] ?? '';
              return (
                <View key={i} style={[s.mealCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[s.mealEmojiBg, { backgroundColor: colors.muted }]}>
                    <Text style={s.mealEmoji}>{emoji}</Text>
                  </View>
                  <View style={s.mealCardBody}>
                    <View style={[s.mealSlotBadge, { backgroundColor: slotColor + '1A' }]}>
                      <Text style={[s.mealSlotText, { color: slotColor }]}>
                        {meal.slot}{time ? ` · ${time}` : ''}
                      </Text>
                    </View>
                    <Text style={[s.mealName, { color: colors.foreground }]} numberOfLines={2}>{meal.name}</Text>
                    <Text style={[s.mealMacros, { color: colors.mutedForeground }]}>{meal.protein_g}g protein · {meal.calories} cal</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Smart Fridge entry card */}
        <TouchableOpacity
          style={{ marginHorizontal: Spacing.xl, marginBottom: Spacing.xl }}
          onPress={() => router.push('/(app)/smart-fridge' as any)}
          activeOpacity={0.85}
        >
          <Animated.View entering={FadeIn.delay(450).duration(400)}>
            <View style={s.smartFridgeCard}>
              <Image
                source={require('../../assets/nori/nori_lightbulb.png')}
                style={{ width: 44, height: 44 }}
                resizeMode="contain"
              />
              <View style={{ flex: 1 }}>
                <Text style={[s.smartFridgeCardTitle, { color: colors.foreground }]}>
                  What's in your fridge?
                </Text>
                <Text style={[s.smartFridgeCardSub, { color: colors.mutedForeground }]}>
                  Tap to get meal ideas from your ingredients
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#1D9E75" />
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* I feel sick — emergency mode button */}
        <Animated.View style={[emergencyContainerStyle, { marginHorizontal: Spacing.xl, marginBottom: Spacing.xl }]}>
          <TouchableOpacity
            style={s.emergencyBtn}
            onPress={openEmergencyMode}
            activeOpacity={0.85}
          >
            <Animated.View style={[StyleSheet.absoluteFill, s.emergencyBtnBorderLayer, emergencyBorderStyle]} pointerEvents="none" />
            <View style={s.emergencyBtnLeft}>
              <View style={s.emergencyIcon}>
                <Text style={{ fontSize: 22 }}>🤢</Text>
              </View>
              <View>
                <Text style={s.emergencyBtnTitle}>I feel sick right now</Text>
                <Text style={s.emergencyBtnSub}>Get 5 foods you can eat immediately</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={DESTRUCTIVE} />
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions */}
        <Text style={[s.actionsTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          <TouchableOpacity
            style={[s.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(app)/meal-plan' as any)}
            activeOpacity={0.8}
          >
            <View style={[s.actionIcon, { backgroundColor: 'rgba(232,157,53,0.12)' }]}>
              <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[s.actionLabel, { color: colors.foreground }]}>Meal Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(app)/grocery-list' as any)}
            activeOpacity={0.8}
          >
            <View style={[s.actionIcon, { backgroundColor: 'rgba(216,127,99,0.12)' }]}>
              <Ionicons name="cart-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[s.actionLabel, { color: colors.foreground }]}>Grocery List</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionCard, { backgroundColor: 'rgba(138,154,124,0.1)', borderColor: 'rgba(138,154,124,0.2)' }]}
            onPress={() => router.push('/(app)/symptom-tracker' as any)}
            activeOpacity={0.8}
          >
            <View style={[s.actionIcon, { backgroundColor: 'rgba(138,154,124,0.15)' }]}>
              <Ionicons name="clipboard-outline" size={20} color={colors.secondary} />
            </View>
            <Text style={[s.actionLabel, { color: colors.foreground }]}>Log Symptoms</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(app)/progress' as any)}
            activeOpacity={0.8}
          >
            <View style={[s.actionIcon, { backgroundColor: 'rgba(232,157,53,0.12)' }]}>
              <Ionicons name="trending-up-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[s.actionLabel, { color: colors.foreground }]}>View Trends</Text>
          </TouchableOpacity>
        </View>

        {generateError && <Text style={[s.generateError, { color: DESTRUCTIVE }]}>{generateError}</Text>}
        {generatingPlan && (
          <View style={s.genRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[s.genText, { color: colors.mutedForeground }]}>Generating your plan…</Text>
          </View>
        )}
      </ScrollView>

      {/* Emergency mode modal */}
      <Modal
        visible={emergencyOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEmergencyOpen(false)}
      >
        <EmergencySheet
          loading={emergencyLoading}
          data={emergencyData}
          modeConfig={modeConfig}
          onClose={() => setEmergencyOpen(false)}
          colors={colors}
        />
      </Modal>
    </SafeAreaView>
  );
}

function EmergencySheet({
  loading, data, modeConfig, onClose, colors,
}: {
  loading: boolean;
  data: EmergencyResult | null;
  modeConfig: { icon: string; title: string; color: string };
  onClose: () => void;
  colors: ThemeColors;
}) {
  const s = makeSheetStyles(colors);
  return (
    <SafeAreaView style={s.sheet} edges={['top', 'bottom']}>
      <View style={s.sheetHandle} />
      <View style={s.sheetHeader}>
        <View>
          <Text style={s.sheetTitle}>{modeConfig.icon} I feel sick</Text>
          <Text style={s.sheetSub}>{data ? modeConfig.title : 'Finding the right foods…'}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={s.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
      {loading && (
        <View style={s.loadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>Personalising for your medication…</Text>
        </View>
      )}
      {!loading && data && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.sheetScroll}>
          {data.items.map((item, i) => (
            <View key={i} style={[s.foodItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.foodNum}>
                <Text style={[s.foodNumText, { color: colors.primaryForeground }]}>{i + 1}</Text>
              </View>
              <View style={s.foodBody}>
                <Text style={[s.foodName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[s.foodReason, { color: colors.mutedForeground }]}>{item.reason}</Text>
                <Text style={[s.foodPrep, { color: modeConfig.color }]}>{item.prep_mins === 0 ? 'No prep' : `${item.prep_mins} min prep`}</Text>
              </View>
            </View>
          ))}
          <Text style={[s.disclaimer, { color: colors.mutedForeground }]}>
            Based on your {data.medication} medication profile and recent symptom log. These are general suggestions — consult your healthcare provider for medical advice.
          </Text>
        </ScrollView>
      )}
      {!loading && !data && (
        <View style={s.loadingRow}>
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>Could not load suggestions. Check your connection.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function makeSheetStyles(c: ThemeColors) {
  return StyleSheet.create({
    sheet: { flex: 1, backgroundColor: c.background },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginTop: 8, marginBottom: 16 },
    sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
    sheetTitle: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground },
    sheetSub: { fontSize: FontSize.sm, color: c.mutedForeground, marginTop: 4 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.muted, alignItems: 'center', justifyContent: 'center' },
    loadingRow: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl },
    loadingText: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
    sheetScroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'], gap: Spacing.md },
    foodItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: 16, borderRadius: Radius.xl, borderWidth: 1 },
    foodNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E06555', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
    foodNumText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold' },
    foodBody: { flex: 1, gap: 4 },
    foodName: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold' },
    foodReason: { fontSize: FontSize.xs, lineHeight: 18 },
    foodPrep: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold' },
    disclaimer: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: Spacing.xl },
  });
}

const DEMO_MEALS = [
  { slot: 'Breakfast', name: 'Greek Yogurt Parfait', protein_g: 26, calories: 280 },
  { slot: 'Lunch', name: 'Turkey Egg Roll Bowl', protein_g: 42, calories: 420 },
  { slot: 'Dinner', name: 'Lemon Herb Salmon', protein_g: 32, calories: 530 },
];

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    scroll: { paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, marginBottom: Spacing['2xl'] },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    noriAvatar: { width: 56, height: 56 },
    onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: '#4ade80', borderWidth: 2 },
    greeting: { fontSize: FontSize.sm, color: c.mutedForeground, fontFamily: 'PlusJakartaSans-Medium' },
    name: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground },
    bellBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    bellDot: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, borderWidth: 2, zIndex: 1 },
    medCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, padding: 16, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(232,157,53,0.08)', borderWidth: 1, borderColor: 'rgba(232,157,53,0.2)', overflow: 'hidden' },
    medCardGlowBorder: { borderRadius: Radius.xl, borderWidth: 2, borderColor: '#1D9E75' },
    medLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
    medIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(232,157,53,0.15)', alignItems: 'center', justifyContent: 'center' },
    medName: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: c.foreground },
    medDay: { color: c.mutedForeground, fontFamily: 'PlusJakartaSans-Regular' },
    dotBars: { flexDirection: 'row', gap: 4, marginTop: 6 },
    dotBar: { width: 20, height: 6, borderRadius: 3 },
    nextBadge: { backgroundColor: 'rgba(232,157,53,0.15)', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 6 },
    nextBadgeText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold' },
    hydrationBanner: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: 14, borderRadius: Radius.xl, backgroundColor: 'rgba(100,180,255,0.1)', borderWidth: 1, borderColor: 'rgba(100,180,255,0.25)' },
    hydrationIcon: { fontSize: 26 },
    hydrationBody: { flex: 1 },
    hydrationTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground },
    hydrationSub: { fontSize: FontSize.xs, color: c.mutedForeground, marginTop: 2, lineHeight: 16 },
    escalationCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: 14, borderRadius: Radius.xl, backgroundColor: 'rgba(232,157,53,0.08)', borderWidth: 1, borderColor: 'rgba(232,157,53,0.3)' },
    escalationTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, marginBottom: 4 },
    escalationSub: { fontSize: FontSize.xs, color: c.mutedForeground, lineHeight: 16 },
    insightCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing['2xl'], borderRadius: Radius.xl, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: 'rgba(138,154,124,0.1)', borderColor: 'rgba(138,154,124,0.2)' },
    noriSmall: { width: 36, height: 36, flexShrink: 0, marginTop: 2 },
    insightBody: { flex: 1 },
    insightLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: 4 },
    insightText: { fontSize: FontSize.sm, lineHeight: 20 },
    guideStrip: { marginHorizontal: Spacing.xl, marginBottom: Spacing['2xl'] },
    guideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
    guideHeaderLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.secondary, textTransform: 'uppercase', letterSpacing: 1 },
    guideHeaderPct: { fontSize: FontSize.xs, color: c.mutedForeground },
    guideCard: { borderRadius: Radius.xl, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
    guideCardIcon: { fontSize: 28 },
    guideCardBody: { flex: 1, gap: Spacing.sm },
    guideCardTitle: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold' },
    guideCardBody2: { fontSize: FontSize.sm, lineHeight: 20 },
    guideCardCta: { alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: 8, marginTop: 4 },
    guideCardCtaText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
    sectionTitle: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-ExtraBold' },
    sectionLink: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold' },
    ringsScroll: { marginBottom: Spacing['2xl'] },
    ringsContent: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
    streakCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing['2xl'], borderRadius: 24, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    streakIconWrap: { width: 56, height: 56, borderRadius: 14, backgroundColor: 'rgba(232,157,53,0.12)', borderWidth: 1, borderColor: 'rgba(232,157,53,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    streakBody: { flex: 1 },
    streakTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    streakTitle: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold' },
    xpBadge: { backgroundColor: 'rgba(232,157,53,0.1)', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
    xpText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold' },
    streakSub: { fontSize: FontSize.xs, lineHeight: 16, marginBottom: 8 },
    weekDots: { flexDirection: 'row', gap: 6, marginTop: 4 },
    weekDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    weekDotText: { fontSize: 10, fontFamily: 'PlusJakartaSans-Bold' },
    mealsScroll: { marginBottom: Spacing.xl },
    mealsContent: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
    mealCard: { width: 208, borderRadius: 24, overflow: 'hidden', borderWidth: 1 },
    mealEmojiBg: { height: 96, alignItems: 'center', justifyContent: 'center' },
    mealEmoji: { fontSize: 40 },
    mealCardBody: { padding: 12 },
    mealSlotBadge: { alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6 },
    mealSlotText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold' },
    mealName: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: 2, lineHeight: 18 },
    mealMacros: { fontSize: FontSize.xs },
    emergencyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: Radius.xl, backgroundColor: `${DESTRUCTIVE}12`, borderWidth: 1, borderColor: `${DESTRUCTIVE}30` },
    emergencyBtnBorderLayer: { borderRadius: Radius.xl, borderWidth: 2, borderColor: DESTRUCTIVE },
    emergencyBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
    emergencyIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${DESTRUCTIVE}15`, alignItems: 'center', justifyContent: 'center' },
    emergencyBtnTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold', color: DESTRUCTIVE },
    emergencyBtnSub: { fontSize: FontSize.xs, color: c.mutedForeground, marginTop: 2 },
    actionsTitle: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-ExtraBold', paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
    actionsGrid: { paddingHorizontal: Spacing.xl, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing['2xl'] },
    actionCard: { width: '47%', padding: 16, borderRadius: Radius.xl, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    actionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    actionLabel: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', flex: 1 },
    generateError: { textAlign: 'center', fontSize: FontSize.xs, paddingHorizontal: Spacing.xl, marginTop: Spacing.sm },
    genRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
    genText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold' },
    smartFridgeCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: 16, borderRadius: Radius.xl, backgroundColor: 'rgba(29,158,117,0.08)', borderWidth: 1, borderColor: 'rgba(29,158,117,0.3)', borderLeftWidth: 4, borderLeftColor: '#1D9E75' },
    smartFridgeCardTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold' },
    smartFridgeCardSub: { fontSize: FontSize.xs, marginTop: 2 },
  });
}
