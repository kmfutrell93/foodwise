import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image, Modal, AccessibilityInfo,
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
import { parseProteinGoal, logError } from '@/lib/utils';
import { computeEscalationStatus } from '@/lib/escalation';
import { FREE_PLAN_LIMIT } from '@/lib/constants';
import { generatePlanWithPolling } from '@/lib/generate-plan';
import { SourcesLink } from '@/components/ui/SourcesLink';
import { Celebration, CelebrationVariant, NoriPose } from '@/components/ui/Celebration';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const DAY_SHORT  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const MED_DISPLAY: Record<string,string> = {
  semaglutide: 'Wegovy', tirzepatide: 'Mounjaro',
  liraglutide: 'Victoza', other: 'GLP-1',
};

const SLOT_COLORS: Record<string,string> = {
  breakfast: '#1D9E75', lunch: '#A8F0D8', dinner: '#1D9E75',
  snack: '#64748B', 'morning snack': '#A8F0D8', 'afternoon snack': '#64748B',
};
const MEAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'cafe-outline',
  lunch: 'restaurant-outline',
  dinner: 'fish-outline',
  snack: 'nutrition-outline',
  'morning snack': 'leaf-outline',
  'afternoon snack': 'nutrition-outline',
};
const MEAL_TIMES: Record<string,string> = {
  breakfast: '7am', 'morning snack': '10am', lunch: '12:30pm',
  'afternoon snack': '3pm', snack: '3pm', dinner: '6:30pm',
};

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

function RingCard({
  value, unit, label, subtitle, pct, color, icon, colors, reduceMotion = false, bare = false,
  flourishKey = 0,
}: {
  value: string; unit: string; label: string; subtitle: string;
  pct: number; color: string; icon: keyof typeof Ionicons.glyphMap; colors: ThemeColors;
  reduceMotion?: boolean;
  bare?: boolean;
  /** Increment to play a one-shot scale flourish (protein goal). */
  flourishKey?: number;
}) {
  const dash = Math.min(Math.max(pct, 0), 100);
  const dashAnim = useSharedValue(reduceMotion ? dash : 0);
  const ringScale = useSharedValue(1);
  const hasAnimated = useRef(false);
  const lastFlourish = useRef(0);

  useEffect(() => {
    if (reduceMotion) {
      dashAnim.value = dash;
      ringScale.value = 1;
      return;
    }
    if (dash > 0 && !hasAnimated.current) {
      hasAnimated.current = true;
      dashAnim.value = withTiming(dash, { duration: 1200, easing: Easing.out(Easing.cubic) });
      ringScale.value = withDelay(1200, withSequence(withSpring(1.03), withSpring(1.0)));
    } else if (!reduceMotion) {
      dashAnim.value = withTiming(dash, { duration: 500, easing: Easing.out(Easing.cubic) });
    }
  }, [dash, reduceMotion]);

  useEffect(() => {
    if (!flourishKey || flourishKey === lastFlourish.current || reduceMotion) return;
    lastFlourish.current = flourishKey;
    ringScale.value = withSequence(
      withSpring(1.12, { damping: 8 }),
      withSpring(1.0, { damping: 12 }),
    );
  }, [flourishKey, reduceMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: 100 - dashAnim.value,
  }));

  const cardScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <Animated.View
      style={[
        ring.card,
        bare
          ? { backgroundColor: 'transparent', borderWidth: 0 }
          : { backgroundColor: colors.card, borderColor: colors.border },
        cardScaleStyle,
      ]}
    >
      <View style={ring.svgWrap}>
        <View style={{ transform: [{ rotate: '-90deg' }] }}>
          <Svg viewBox="0 0 36 36" width={56} height={56}>
            <Circle cx="18" cy="18" r="15.9" fill="none" stroke={colors.muted} strokeWidth="4" />
            <AnimatedCircle
              cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="100 100"
              animatedProps={animatedProps}
            />
          </Svg>
        </View>
        <Ionicons
          name={icon}
          size={20}
          color={color}
          style={ring.icon}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
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
  card: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, borderRadius: Radius.lg, borderWidth: 1, alignItems: 'center', minWidth: 0 },
  svgWrap: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  icon: { position: 'absolute' },
  value: { fontSize: 22, fontFamily: 'PlusJakartaSans-ExtraBold' },
  unit: { fontSize: 11, fontFamily: 'PlusJakartaSans-Regular' },
  label: { fontSize: 11, marginTop: 2 },
  subtitle: { fontSize: 11, fontFamily: 'PlusJakartaSans-Bold', marginTop: 2, textAlign: 'center' },
});

const MODE_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; title: string }> = {
  nausea: { icon: 'medkit-outline', title: 'Nausea mode — gentle foods only' },
  constipation: { icon: 'leaf-outline', title: 'High-fibre foods to get things moving' },
  gentle: { icon: 'restaurant-outline', title: 'Easy, nourishing options right now' },
};

const GUIDE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  week1_expectations: 'calendar-outline',
  protein_nonnegotiable: 'barbell-outline',
  injection_day_meals: 'medical-outline',
  zero_appetite: 'nutrition-outline',
  log_today: 'create-outline',
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

  // Reduced-motion preference (iOS Accessibility → Motion)
  const [reduceMotion, setReduceMotion] = useState(false);
  const [motionReady, setMotionReady] = useState(false);

  // Celebrations (event-triggered Lottie — never looping)
  const [celebration, setCelebration] = useState<{
    playKey: number;
    variant: CelebrationVariant;
    noriPose?: NoriPose;
    countTo?: number;
  }>({ playKey: 0, variant: 'confetti' });
  const [proteinFlourishKey, setProteinFlourishKey] = useState(0);
  const prevStreakRef = useRef<number | null>(null);
  const prevProteinGoalHitRef = useRef(false);
  const streakReadyRef = useRef(false);

  function fireCelebration(
    variant: CelebrationVariant,
    opts?: { noriPose?: NoriPose; countTo?: number },
  ) {
    setCelebration((prev) => ({
      playKey: prev.playKey + 1,
      variant,
      noriPose: opts?.noriPose,
      countTo: opts?.countTo,
    }));
  }

  // ── Entry animation values ────────────────────────────────
  const headerAnim    = useSharedValue(0);
  const ringsAnim     = useSharedValue(0);
  const mealsAnim     = useSharedValue(0);
  const emergencyAnim = useSharedValue(0);
  const entryFired    = useRef(false);

  // ── Emergency button pulse ────────────────────────────────
  const emergencyScale         = useSharedValue(1);
  const emergencyBorderOpacity = useSharedValue(1);

  const regenFiredRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!alive) return;
      setReduceMotion(enabled);
      setMotionReady(true);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduceMotion(enabled);
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [profileRes, planRes, streakRes, countRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('meal_plans').select('*').eq('user_id', user.id).order('week_start', { ascending: false }).limit(1).single(),
      supabase.from('streaks').select('*').eq('user_id', user.id).single(),
      supabase.from('meal_plans').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);
    if (!mountedRef.current) return;
    if (profileRes.data) {
      setProfile(profileRes.data);
      setGuideStep(profileRes.data.starter_guide_step ?? 0);
    }
    if (planRes.data) setTodayPlan(planRes.data);
    if (streakRes.data) setStreak(streakRes.data);
    setPlanCount(countRes.count ?? 0);
  }

  useEffect(() => { load(); }, []);

  // If the current plan is more than 6 days old, silently regenerate next
  // week's plan in the background — fires at most once per app session.
  useEffect(() => {
    if (!todayPlan || regenFiredRef.current) return;
    const planAge = Date.now() - new Date(todayPlan.created_at).getTime();
    const sixDays = 6 * 24 * 60 * 60 * 1000;
    if (planAge > sixDays) {
      regenFiredRef.current = true;
      regeneratePlanInBackground();
    }
  }, [todayPlan]);

  async function regeneratePlanInBackground() {
    try {
      const result = await generatePlanWithPolling();
      if (result.success) await load();
    } catch {
      // Silent failure — user never knows this happened
    }
  }

  // Entry sequence — fires once after motion preference is known
  useEffect(() => {
    if (!motionReady || entryFired.current) return;
    entryFired.current = true;
    if (reduceMotion) {
      headerAnim.value = 1;
      ringsAnim.value = 1;
      mealsAnim.value = 1;
      emergencyAnim.value = 1;
      return;
    }
    headerAnim.value    = withTiming(1, { duration: 400 });
    ringsAnim.value     = withDelay(200, withTiming(1, { duration: 400 }));
    mealsAnim.value     = withDelay(350, withTiming(1, { duration: 450 }));
    emergencyAnim.value = withDelay(500, withTiming(1, { duration: 400 }));
  }, [motionReady, reduceMotion]);

  const daysSincePulse = profile?.injection_day ? getDaysSince(profile.injection_day) : -1;
  const pulseInjectionDay = daysSincePulse === 0;

  // Emergency pulse — injection day only; skipped when reduce-motion is on
  useEffect(() => {
    cancelAnimation(emergencyScale);
    cancelAnimation(emergencyBorderOpacity);
    if (reduceMotion || !pulseInjectionDay) {
      emergencyScale.value = 1;
      emergencyBorderOpacity.value = 1;
      return;
    }
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
  }, [reduceMotion, pulseInjectionDay]);

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerAnim.value,
    transform: [{ translateY: interpolate(headerAnim.value, [0, 1], [-20, 0]) }],
  }));
  const ringsStyle = useAnimatedStyle(() => ({ opacity: ringsAnim.value }));
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
      const result = await generatePlanWithPolling();
      if (!result.success) throw new Error(result.error);
      await load();
      if (mountedRef.current) {
        fireCelebration('confetti', { noriPose: 'celebrate' });
      }
    } catch (e: unknown) {
      logError('home:generatePlan', e);
      if (mountedRef.current) setGenerateError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      if (mountedRef.current) setGeneratingPlan(false);
    }
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
    fireCelebration('success', { noriPose: 'happy' });
    if (card.cta_action === 'meal_plan') router.push('/(app)/meal-plan' as any);
    else if (card.cta_action === 'symptom_tracker') router.push('/(app)/symptom-tracker' as any);
  }

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, []);

  const now = new Date();
  const h = now.getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const todayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayDayData = todayPlan?.plan_json?.days?.find((d: { day: string }) =>
    d.day?.toLowerCase()?.trim() === todayName?.toLowerCase()?.trim()
  ) ?? todayPlan?.plan_json?.days?.[0] ?? null;

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

  // Streak increment / milestone celebration (skip first load baseline)
  useEffect(() => {
    if (streak == null) return;
    const current = streak.current_streak ?? 0;
    if (!streakReadyRef.current) {
      streakReadyRef.current = true;
      prevStreakRef.current = current;
      return;
    }
    const prev = prevStreakRef.current ?? 0;
    if (current > prev) {
      const milestones = [3, 7, 14, 21, 30, 60, 100];
      const hitMilestone = milestones.includes(current);
      fireCelebration('flame', {
        noriPose: hitMilestone ? 'celebrate' : 'happy',
        countTo: current,
      });
    }
    prevStreakRef.current = current;
  }, [streak?.current_streak]);

  // Protein goal reached → ring flourish + confetti (skip baseline; once until it drops below)
  const proteinReadyRef = useRef(false);
  useEffect(() => {
    const hit = proteinPct >= 100 && proteinGoal > 0;
    if (!proteinReadyRef.current) {
      proteinReadyRef.current = true;
      prevProteinGoalHitRef.current = hit;
      return;
    }
    if (hit && !prevProteinGoalHitRef.current) {
      prevProteinGoalHitRef.current = true;
      setProteinFlourishKey((k) => k + 1);
      fireCelebration('confetti', { noriPose: 'happy' });
    } else if (!hit) {
      prevProteinGoalHitRef.current = false;
    }
  }, [proteinPct, proteinGoal]);

  const todayMeals: { slot: string; name: string; protein_g: number; calories: number }[] =
    (todayDayData as any)?.meals ?? [];

  // Escalation awareness
  const escalationStatus = profile?.medication
    ? computeEscalationStatus(
        profile.medication as Parameters<typeof computeEscalationStatus>[0],
        profile.dose_mg ?? null,
        profile.dose_start_date ?? null,
      )
    : null;
  const isEscalationWeek = escalationStatus?.is_escalation_week ?? false;
  const isNewDose = (escalationStatus?.days_on_current_dose ?? 99) <= 7;
  const showEscalationCard = isNewDose || isEscalationWeek;

  // Starter guide
  const showStarterGuide = profile?.time_on_medication === 'less_than_1_month' && !profile?.starter_guide_completed;
  const currentGuideCard = showStarterGuide ? STARTER_GUIDE[guideStep] ?? null : null;

  const modeConfig = {
    ...MODE_CONFIG[emergencyData?.mode ?? 'gentle'],
    color: colors.primary,
  };

  const medCardEntering = reduceMotion
    ? undefined
    : isInjectionDay
      ? FadeIn.duration(400)
      : isTomorrow
        ? SlideInRight.duration(300)
        : FadeIn.duration(400);

  const fadeIn = (delay = 0, duration = 400) =>
    reduceMotion ? undefined : FadeIn.delay(delay).duration(duration);
  const bounceIn = (delay = 0, duration = 600) =>
    reduceMotion ? undefined : BounceIn.delay(delay).duration(duration);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <Celebration
        playKey={celebration.playKey}
        variant={celebration.variant}
        reduceMotion={reduceMotion}
        noriPose={celebration.noriPose}
        countTo={celebration.countTo}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <Animated.View style={[s.header, headerStyle]}>
          <View style={s.headerLeft}>
            <View>
              <Image
                source={require('@/assets/images/nori_pointing_right_1.png')}
                style={s.noriAvatar}
                resizeMode="contain"
                accessibilityLabel="Nori"
              />
              <View
                style={[s.onlineDot, { borderColor: colors.background, backgroundColor: colors.primary }]}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            </View>
            <View>
              <Text style={s.greeting}>{greeting},</Text>
              <Text style={s.name}>{firstName}</Text>
            </View>
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
                <Ionicons
                  name="medical-outline"
                  size={20}
                  color={colors.primary}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
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
          <Animated.View entering={fadeIn(100, 400)} style={s.hydrationBanner}>
            <Ionicons
              name="water-outline"
              size={26}
              color={colors.accent}
              style={s.hydrationIcon}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <View style={s.hydrationBody}>
              <Text style={s.hydrationTitle}>Drink water now</Text>
              <Text style={s.hydrationSub}>Staying hydrated may help with comfort on dose day. Have a full glass before your next meal.</Text>
            </View>
          </Animated.View>
        )}

        {/* Escalation awareness card */}
        {showEscalationCard && (
          <Animated.View entering={fadeIn(0, 400)} style={s.escalationCard}>
            <Ionicons
              name="warning-outline"
              size={20}
              color={colors.primary}
              style={{ marginTop: 1 }}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <View style={{ flex: 1 }}>
              <Text style={s.escalationTitle}>
                {isNewDose ? 'New dose this week' : 'Dose escalation this week'}
              </Text>
              <Text style={s.escalationSub}>
                {isNewDose
                  ? 'GI side effects are often more noticeable after a dose increase. Softer textures and steady fluids may help — follow your clinician’s guidance.'
                  : 'A dose increase may be coming up. Your meal plan can favor easier-to-tolerate foods when side effects are stronger.'}
              </Text>
              <SourcesLink prefix="Sources" align="left" style={{ marginTop: 6 }} />
            </View>
          </Animated.View>
        )}

        {/* AI Insight */}
        <View style={s.insightCard} accessibilityRole="summary">
          <Image
            source={require('@/assets/images/nori_pointing_right_1.png')}
            style={s.noriSmall}
            resizeMode="contain"
            accessibilityLabel="Nori"
          />
          <View style={s.insightBody}>
            <Text style={[s.insightLabel, { color: colors.secondary }]}>Nori&apos;s insight for today</Text>
            <Text style={[s.insightText, { color: colors.foreground }]}>{insight}</Text>
            <SourcesLink prefix="Sources" align="left" style={{ marginTop: 8 }} />
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
              <Ionicons
                name={GUIDE_ICONS[currentGuideCard.id] ?? 'sparkles-outline'}
                size={28}
                color={colors.primary}
                style={s.guideCardIcon}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <View style={s.guideCardBody}>
                <Text style={[s.guideCardTitle, { color: colors.foreground }]}>{currentGuideCard.title}</Text>
                <Text style={[s.guideCardBody2, { color: colors.mutedForeground }]}>{currentGuideCard.body}</Text>
                <SourcesLink prefix="Sources" align="left" style={{ marginTop: 8, marginBottom: 4 }} />
                <TouchableOpacity
                  style={[s.guideCardCta, { backgroundColor: colors.primary }]}
                  onPress={() => advanceGuideStep(currentGuideCard)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={currentGuideCard.cta_label}
                >
                  <Text style={[s.guideCardCtaText, { color: colors.primaryForeground }]}>{currentGuideCard.cta_label}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Today — rings + streak in one card */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]} accessibilityRole="header">Today</Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/progress' as any)}
            style={s.sectionLinkHit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="View progress details"
            activeOpacity={0.7}
          >
            <Text style={[s.sectionLink, { color: colors.primary }]}>Details</Text>
          </TouchableOpacity>
        </View>
        <View style={[s.todayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Animated.View style={[ringsStyle, s.ringsRow]}>
            <RingCard
              value={`${proteinG}`}
              unit="g"
              label="Protein"
              subtitle={`${proteinG}g planned today`}
              pct={proteinPct}
              color={colors.primary}
              icon="nutrition-outline"
              colors={colors}
              reduceMotion={reduceMotion}
              bare
              flourishKey={proteinFlourishKey}
            />
            <RingCard
              value={`${calories}`}
              unit=""
              label="Calories"
              subtitle={`${calories}/1,380`}
              pct={caloriePct}
              color={colors.destructive}
              icon="flame-outline"
              colors={colors}
              reduceMotion={reduceMotion}
              bare
            />
          </Animated.View>

          <View style={[s.todayDivider, { backgroundColor: colors.border }]} />

          <View
            style={s.streakRow}
            accessibilityLabel={streakCount > 0 ? `${streakCount} day streak` : 'Start your streak today'}
          >
            <Animated.View entering={bounceIn(0, 600)}>
              <View style={s.streakIconWrap}>
                <Ionicons
                  name="flame"
                  size={22}
                  color={colors.primary}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              </View>
            </Animated.View>
            <View style={s.streakBody}>
              <Animated.View entering={bounceIn(100, 600)}>
                <View style={s.streakTopRow}>
                  <Text style={[s.streakTitle, { color: colors.foreground }]}>
                    {streakCount > 0 ? `${streakCount} Day Streak!` : 'Start your streak today'}
                  </Text>
                  <View style={s.xpBadge}>
                    <Text style={[s.xpText, { color: colors.primary }]}>+50 XP</Text>
                  </View>
                </View>
                <Text style={[s.streakSub, { color: colors.mutedForeground }]}>
                  {streakCount > 0 ? `Logged ${streakCount} days straight. Keep going!` : 'Log your first symptoms to start your streak.'}
                </Text>
              </Animated.View>
              <Animated.View entering={bounceIn(200, 600)}>
                <View style={s.weekDots} accessibilityElementsHidden importantForAccessibility="no">
                  {[0,1,2,3,4,5,6].map(i => (
                    <View key={i} style={[s.weekDot, { backgroundColor: i < Math.min(streakCount, 7) ? colors.primary : colors.muted }]}>
                      <Text style={[s.weekDotText, { color: i < Math.min(streakCount, 7) ? colors.primaryForeground : colors.mutedForeground }]}>
                        {i < Math.min(streakCount, 7) ? '✓' : '·'}
                      </Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            </View>
          </View>
        </View>

        {/* Today's Meals */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]} accessibilityRole="header">Today&apos;s Meals</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={generatePlan}
              disabled={generatingPlan}
              style={s.sectionLinkHit}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={generatingPlan ? 'Generating meal plan' : 'Generate new meal plan'}
              accessibilityState={{ disabled: generatingPlan, busy: generatingPlan }}
              activeOpacity={0.7}
            >
              <Text style={[s.sectionLink, { color: colors.mutedForeground }]}>
                {generatingPlan ? 'Generating…' : 'New plan'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(app)/meal-plan' as any)}
              style={s.sectionLinkHit}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Open full meal plan"
              activeOpacity={0.7}
            >
              <Text style={[s.sectionLink, { color: colors.primary }]}>Full plan</Text>
            </TouchableOpacity>
          </View>
        </View>
        {todayMeals.length === 0 && todayPlan ? (
          <TouchableOpacity
            style={[s.noMealsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(app)/meal-plan' as any)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="No meals scheduled for today. Open full meal plan"
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={colors.mutedForeground}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[s.noMealsText, { color: colors.mutedForeground }]}>
              No meals scheduled for today — tap to view your full plan
            </Text>
          </TouchableOpacity>
        ) : (
        <Animated.View style={mealsStyle}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.mealsScroll} contentContainerStyle={s.mealsContent}>
            {(todayMeals.length > 0 ? todayMeals : DEMO_MEALS).map((meal, i) => {
              const slotKey = meal.slot?.toLowerCase() ?? '';
              const slotColor = SLOT_COLORS[slotKey] ?? colors.primary;
              const mealIcon = MEAL_ICONS[slotKey] ?? 'restaurant-outline';
              const time = MEAL_TIMES[slotKey] ?? '';
              const isRealMeal = todayMeals.length > 0;
              return (
                <TouchableOpacity
                  key={`${meal.slot}-${i}`}
                  style={[s.mealCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={isRealMeal ? 0.75 : 1}
                  disabled={!isRealMeal}
                  accessibilityRole="button"
                  accessibilityLabel={`${meal.slot}: ${meal.name}, ${meal.protein_g} grams protein, ${meal.calories} calories`}
                  accessibilityState={{ disabled: !isRealMeal }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                      pathname: '/(app)/recipe/[id]',
                      params: {
                        id: 'generate',
                        mode: 'generate',
                        source: 'home',
                        mealName: meal.name,
                        mealSlot: meal.slot,
                        proteinG: String(meal.protein_g),
                        calories: String(meal.calories),
                      },
                    } as any);
                  }}
                >
                  <View style={[s.mealEmojiBg, { backgroundColor: colors.muted }]}>
                    <Ionicons
                      name={mealIcon}
                      size={36}
                      color={colors.primary}
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                    />
                  </View>
                  <View style={s.mealCardBody}>
                    <View style={s.mealCardTopRow}>
                      <View style={[s.mealSlotBadge, { backgroundColor: slotColor + '1A' }]}>
                        <Text style={[s.mealSlotText, { color: slotColor }]}>
                          {meal.slot}{time ? ` · ${time}` : ''}
                        </Text>
                      </View>
                      {isRealMeal && (
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={colors.mutedForeground}
                          accessibilityElementsHidden
                          importantForAccessibility="no"
                        />
                      )}
                    </View>
                    <Text style={[s.mealName, { color: colors.foreground }]} numberOfLines={2}>{meal.name}</Text>
                    <Text style={[s.mealMacros, { color: colors.mutedForeground }]}>{meal.protein_g}g protein · {meal.calories} cal</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
        )}

        {/* Smart Fridge entry card */}
        <TouchableOpacity
          style={{ marginHorizontal: Spacing.xl, marginBottom: Spacing.lg }}
          onPress={() => router.push('/(app)/smart-fridge' as any)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="What's in your fridge? Get meal ideas from your ingredients"
        >
          <Animated.View entering={fadeIn(450, 400)}>
            <View style={[s.smartFridgeCard, { borderLeftColor: colors.primary }]}>
              <Image
                source={require('../../assets/nori/nori_lightbulb.png')}
                style={{ width: 44, height: 44 }}
                resizeMode="contain"
                accessibilityLabel="Nori"
              />
              <View style={{ flex: 1 }}>
                <Text style={[s.smartFridgeCardTitle, { color: colors.foreground }]}>
                  What&apos;s in your fridge?
                </Text>
                <Text style={[s.smartFridgeCardSub, { color: colors.mutedForeground }]}>
                  Tap to get meal ideas from your ingredients
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* I feel sick — emergency mode button */}
        <Animated.View style={[emergencyContainerStyle, { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg }]}>
          <TouchableOpacity
            style={s.emergencyBtn}
            onPress={openEmergencyMode}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="I feel sick right now. Get five foods you can eat immediately"
          >
            <Animated.View style={[StyleSheet.absoluteFill, s.emergencyBtnBorderLayer, emergencyBorderStyle]} pointerEvents="none" />
            <View style={s.emergencyBtnLeft}>
              <View style={s.emergencyIcon}>
                <Ionicons
                  name="medkit-outline"
                  size={22}
                  color={colors.destructive}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              </View>
              <View>
                <Text style={s.emergencyBtnTitle}>I feel sick right now</Text>
                <Text style={s.emergencyBtnSub}>Get 5 foods you can eat immediately</Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.destructive}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions — compact icon row */}
        <Text style={[s.actionsTitle, { color: colors.foreground }]} accessibilityRole="header">Quick Actions</Text>
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => router.push('/(app)/meal-plan' as any)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Meal Plan"
          >
            <View style={[s.actionIcon, { backgroundColor: 'rgba(29,158,117,0.12)' }]}>
              <Ionicons name="restaurant-outline" size={22} color={colors.primary} accessibilityElementsHidden importantForAccessibility="no" />
            </View>
            <Text style={[s.actionLabel, { color: colors.foreground }]} numberOfLines={1}>Meals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => router.push('/(app)/grocery-list' as any)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Grocery List"
          >
            <View style={[s.actionIcon, { backgroundColor: 'rgba(29,158,117,0.12)' }]}>
              <Ionicons name="cart-outline" size={22} color={colors.accent} accessibilityElementsHidden importantForAccessibility="no" />
            </View>
            <Text style={[s.actionLabel, { color: colors.foreground }]} numberOfLines={1}>Grocery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => router.push('/(app)/symptom-tracker' as any)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Log Symptoms"
          >
            <View style={[s.actionIcon, { backgroundColor: 'rgba(29,158,117,0.15)' }]}>
              <Ionicons name="clipboard-outline" size={22} color={colors.secondary} accessibilityElementsHidden importantForAccessibility="no" />
            </View>
            <Text style={[s.actionLabel, { color: colors.foreground }]} numberOfLines={1}>Symptoms</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => router.push('/(app)/progress' as any)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="View Trends"
          >
            <View style={[s.actionIcon, { backgroundColor: 'rgba(29,158,117,0.12)' }]}>
              <Ionicons name="trending-up-outline" size={22} color={colors.primary} accessibilityElementsHidden importantForAccessibility="no" />
            </View>
            <Text style={[s.actionLabel, { color: colors.foreground }]} numberOfLines={1}>Trends</Text>
          </TouchableOpacity>
        </View>

        {generateError && <Text style={[s.generateError, { color: colors.destructive }]}>{generateError}</Text>}
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
  modeConfig: { icon: keyof typeof Ionicons.glyphMap; title: string; color: string };
  onClose: () => void;
  colors: ThemeColors;
}) {
  const s = makeSheetStyles(colors);
  const router = useRouter();
  return (
    <SafeAreaView style={s.sheet} edges={['top', 'bottom']}>
      <View style={s.sheetHandle} accessibilityElementsHidden importantForAccessibility="no" />
      <View style={s.sheetHeader}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons
              name={modeConfig.icon}
              size={22}
              color={colors.destructive}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={s.sheetTitle} accessibilityRole="header">I feel sick</Text>
          </View>
          <Text style={s.sheetSub}>{data ? modeConfig.title : 'Finding the right foods…'}</Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={s.closeBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
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
            Based on your {data.medication} medication profile and recent symptom log. These are general suggestions — consult your healthcare provider for medical advice.{' '}
            <Text style={{ color: colors.primary, textDecorationLine: 'underline' }} onPress={() => router.push('/sources' as any)}>
              View sources
            </Text>
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
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.muted, alignItems: 'center', justifyContent: 'center' },
    loadingRow: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl },
    loadingText: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
    sheetScroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'], gap: Spacing.md },
    foodItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: 16, borderRadius: Radius.xl, borderWidth: 1 },
    foodNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.destructive, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
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
    scroll: { paddingBottom: 120 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, marginBottom: Spacing.lg },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    noriAvatar: { width: 56, height: 56 },
    onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
    greeting: { fontSize: FontSize.sm, color: c.mutedForeground, fontFamily: 'PlusJakartaSans-Medium' },
    name: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground },
    medCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.md, padding: 14, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(29,158,117,0.08)', borderWidth: 1, borderColor: 'rgba(29,158,117,0.2)', overflow: 'hidden' },
    medCardGlowBorder: { borderRadius: Radius.xl, borderWidth: 2, borderColor: c.primary },
    medLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
    medIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(29,158,117,0.15)', alignItems: 'center', justifyContent: 'center' },
    medName: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: c.foreground },
    medDay: { color: c.mutedForeground, fontFamily: 'PlusJakartaSans-Regular' },
    dotBars: { flexDirection: 'row', gap: 4, marginTop: 6 },
    dotBar: { width: 20, height: 6, borderRadius: 3 },
    nextBadge: { backgroundColor: 'rgba(29,158,117,0.15)', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 6 },
    nextBadgeText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold' },
    hydrationBanner: { marginHorizontal: Spacing.xl, marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: 12, borderRadius: Radius.xl, backgroundColor: 'rgba(100,180,255,0.1)', borderWidth: 1, borderColor: 'rgba(100,180,255,0.25)' },
    hydrationIcon: { marginTop: 2 },
    hydrationBody: { flex: 1 },
    hydrationTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground },
    hydrationSub: { fontSize: FontSize.xs, color: c.mutedForeground, marginTop: 2, lineHeight: 16 },
    escalationCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: 12, borderRadius: Radius.xl, backgroundColor: 'rgba(29,158,117,0.08)', borderWidth: 1, borderColor: 'rgba(29,158,117,0.3)' },
    escalationTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, marginBottom: 4 },
    escalationSub: { fontSize: FontSize.xs, color: c.mutedForeground, lineHeight: 16 },
    insightCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: 'rgba(29,158,117,0.1)', borderColor: 'rgba(29,158,117,0.2)' },
    noriSmall: { width: 36, height: 36, flexShrink: 0, marginTop: 2 },
    insightBody: { flex: 1 },
    insightLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: 4 },
    insightText: { fontSize: FontSize.sm, lineHeight: 20 },
    guideStrip: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg },
    guideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
    guideHeaderLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.secondary, textTransform: 'uppercase', letterSpacing: 1 },
    guideHeaderPct: { fontSize: FontSize.xs, color: c.mutedForeground },
    guideCard: { borderRadius: Radius.xl, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
    guideCardIcon: { marginTop: 2 },
    guideCardBody: { flex: 1, gap: Spacing.sm },
    guideCardTitle: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold' },
    guideCardBody2: { fontSize: FontSize.sm, lineHeight: 20 },
    guideCardCta: { alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: 12, marginTop: 4, minHeight: 44, justifyContent: 'center' },
    guideCardCtaText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, marginBottom: Spacing.sm },
    sectionTitle: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-ExtraBold' },
    sectionLink: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold' },
    sectionLinkHit: { minHeight: 44, justifyContent: 'center' },
    todayCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1, padding: 12, gap: Spacing.md },
    ringsRow: { flexDirection: 'row', gap: Spacing.sm },
    todayDivider: { height: StyleSheet.hairlineWidth, width: '100%' },
    streakRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    streakIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(29,158,117,0.12)', borderWidth: 1, borderColor: 'rgba(29,158,117,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    streakBody: { flex: 1 },
    streakTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
    streakTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold', flexShrink: 1 },
    xpBadge: { backgroundColor: 'rgba(29,158,117,0.1)', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
    xpText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold' },
    streakSub: { fontSize: FontSize.xs, lineHeight: 16, marginBottom: 4 },
    weekDots: { flexDirection: 'row', gap: 6, marginTop: 2 },
    weekDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    weekDotText: { fontSize: 10, fontFamily: 'PlusJakartaSans-Bold' },
    mealsScroll: { marginBottom: Spacing.lg },
    mealsContent: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
    noMealsCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: 14, borderRadius: Radius.xl, borderWidth: 1 },
    noMealsText: { flex: 1, fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Medium' },
    mealCard: { width: 208, borderRadius: 24, overflow: 'hidden', borderWidth: 1 },
    mealEmojiBg: { height: 88, alignItems: 'center', justifyContent: 'center' },
    mealCardBody: { padding: 12 },
    mealCardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    mealSlotBadge: { alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
    mealSlotText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold' },
    mealName: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: 2, lineHeight: 18 },
    mealMacros: { fontSize: FontSize.xs },
    emergencyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: Radius.xl, backgroundColor: `${c.destructive}12`, borderWidth: 1, borderColor: `${c.destructive}30`, minHeight: 64 },
    emergencyBtnBorderLayer: { borderRadius: Radius.xl, borderWidth: 2, borderColor: c.destructive },
    emergencyBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
    emergencyIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${c.destructive}15`, alignItems: 'center', justifyContent: 'center' },
    emergencyBtnTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.destructive },
    emergencyBtnSub: { fontSize: FontSize.xs, color: c.mutedForeground, marginTop: 2 },
    actionsTitle: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-ExtraBold', paddingHorizontal: Spacing.xl, marginBottom: Spacing.sm },
    actionsRow: { paddingHorizontal: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm, marginBottom: Spacing.lg },
    actionBtn: { flex: 1, alignItems: 'center', gap: 6, minHeight: 72, justifyContent: 'flex-start' },
    actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    actionLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', textAlign: 'center' },
    generateError: { textAlign: 'center', fontSize: FontSize.xs, paddingHorizontal: Spacing.xl, marginTop: Spacing.sm },
    genRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
    genText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold' },
    smartFridgeCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: 14, borderRadius: Radius.xl, backgroundColor: 'rgba(29,158,117,0.08)', borderWidth: 1, borderColor: 'rgba(29,158,117,0.3)', borderLeftWidth: 4, minHeight: 64 },
    smartFridgeCardTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold' },
    smartFridgeCardSub: { fontSize: FontSize.xs, marginTop: 2 },
  });
}
