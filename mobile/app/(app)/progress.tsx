import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Polyline, Line } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withTiming, withSpring, withSequence, withDelay,
  runOnJS, ZoomIn, FadeIn,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { supabase, Streak, Milestone, WeeklyReport, SymptomLog, WeightLog, Profile } from '@/lib/supabase';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import {
  trackProgressScreenViewed, trackWeeklyReportOpened, trackInsightViewed,
  trackWeightLogged, trackWeightChartViewed,
} from '@/lib/analytics';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const TEAL = '#1D9E75';
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CHART_WIDTH = Dimensions.get('window').width - 48;
const CHART_HEIGHT = 140;
const C_PAD = { top: 16, bottom: 28, left: 8, right: 8 };

const MILESTONE_LABELS: Record<string, { icon: string; label: string }> = {
  first_log: { icon: '✏️', label: 'First log' },
  '7day_streak': { icon: '🔥', label: '7-day streak' },
  '30day_streak': { icon: '🏆', label: '30-day streak' },
  first_insight: { icon: '💡', label: 'First insight' },
  first_week_under_budget: { icon: '💰', label: 'Under budget' },
  plan_streak_7: { icon: '📋', label: '7 plans followed' },
};

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ProteinRing({ pct, size = 140, colors }: { pct: number; size?: number; colors: ThemeColors }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const targetDash = Math.min(pct / 100, 1) * circ;

  const dashAnim = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (targetDash > 0 && !hasAnimated.current) {
      hasAnimated.current = true;
      dashAnim.value = withTiming(targetDash, { duration: 1200, easing: Easing.out(Easing.cubic) });
      ringScale.value = withDelay(1200, withSequence(withSpring(1.04), withSpring(1.0)));
    }
  }, [targetDash]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circ - dashAnim.value,
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <Animated.View style={scaleStyle}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={r}
          stroke={colors.primary} strokeWidth={stroke} fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          animatedProps={animatedProps}
        />
      </Svg>
    </Animated.View>
  );
}

function WeightChart({ logs, colors, onTrend }: { logs: WeightLog[]; colors: ThemeColors; onTrend?: (hasBadge: boolean) => void }) {
  if (logs.length < 2) return null;
  const cw = CHART_WIDTH - C_PAD.left - C_PAD.right;
  const ch = CHART_HEIGHT - C_PAD.top - C_PAD.bottom;
  const weights = logs.map(l => Number(l.weight_lbs));
  const minW = Math.min(...weights) - 2;
  const maxW = Math.max(...weights) + 2;
  const range = maxW - minW || 1;

  const toX = (i: number) => C_PAD.left + (logs.length > 1 ? (i / (logs.length - 1)) * cw : cw / 2);
  const toY = (w: number) => C_PAD.top + (1 - (w - minW) / range) * ch;

  const points = logs.map((l, i) => `${toX(i)},${toY(Number(l.weight_lbs))}`).join(' ');
  const guideYs = [0.25, 0.5, 0.75].map(frac => toY(minW + range * frac));

  let trend: 'down' | 'stable' | null = null;
  if (logs.length >= 6) {
    const last3 = logs.slice(-3).map(l => Number(l.weight_lbs));
    const prev3 = logs.slice(-6, -3).map(l => Number(l.weight_lbs));
    const avgLast = last3.reduce((s, v) => s + v, 0) / 3;
    const avgPrev = prev3.reduce((s, v) => s + v, 0) / 3;
    const diff = avgLast - avgPrev;
    if (diff < -0.5) trend = 'down';
    else if (diff > 0.5) trend = 'stable';
  }

  React.useEffect(() => { onTrend?.(trend !== null); }, [trend]);

  return (
    <View>
      <View style={{ position: 'relative' }}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {guideYs.map((y, i) => (
            <Line key={i} x1={C_PAD.left} y1={y} x2={CHART_WIDTH - C_PAD.right} y2={y}
              stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
          ))}
          <Polyline points={points as string} fill="none" stroke={TEAL} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        {trend && (
          <View style={[chartS.trendBadge, trend === 'down' ? chartS.trendDown : chartS.trendUp]}>
            <Text style={chartS.trendText}>{trend === 'down' ? '↓ trending' : '— stable'}</Text>
          </View>
        )}
      </View>
      <View style={chartS.dateRow}>
        <Text style={[chartS.dateLabel, { color: colors.mutedForeground }]}>
          {formatDateShort(logs[0].logged_date)}
        </Text>
        <Text style={[chartS.dateLabel, { color: colors.mutedForeground }]}>
          {formatDateShort(logs[logs.length - 1].logged_date)}
        </Text>
      </View>
    </View>
  );
}

const chartS = StyleSheet.create({
  trendBadge: { position: 'absolute', top: 8, right: 8, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  trendDown: { backgroundColor: 'rgba(29,158,117,0.15)' },
  trendUp: { backgroundColor: 'rgba(155,150,140,0.15)' },
  trendText: { fontSize: 13, fontFamily: 'PlusJakartaSans-ExtraBold' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: C_PAD.left, marginTop: 4 },
  dateLabel: { fontSize: 11 },
});

export default function Progress() {
  const colors = useThemeColors();
  const s = makeStyles(colors);

  const [streak, setStreak] = useState<Streak | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [recentLogs, setRecentLogs] = useState<SymptomLog[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [proteinPct, setProteinPct] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // 7-day streak celebration modal
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [showReviewBtn, setShowReviewBtn] = useState(false);
  const celebrationChecked = useRef(false);

  // Weight log modal
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [weightNote, setWeightNote] = useState('');
  const [weightError, setWeightError] = useState<string | null>(null);
  const [weightSaving, setWeightSaving] = useState(false);
  const [hasTrendBadge, setHasTrendBadge] = useState(false);
  const weightSectionTracked = useRef(false);

  // Reanimated — logged success banner
  const loggedOpacity = useSharedValue(0);
  const loggedBannerStyle = useAnimatedStyle(() => ({ opacity: loggedOpacity.value }));

  // Reanimated — weight modal entrance/exit
  const modalTranslateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (weightModalOpen) {
      overlayOpacity.value = withTiming(1, { duration: 200 });
      modalTranslateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    }
  }, [weightModalOpen]);

  function closeWeightModal() {
    overlayOpacity.value = withTiming(0, { duration: 200 });
    modalTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, (finished) => {
      'worklet';
      if (finished) runOnJS(setWeightModalOpen)(false);
    });
  }

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const modalSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
  }));

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [profileRes, streakRes, milestonesRes, reportRes, logsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('streaks').select('*').eq('user_id', user.id).single(),
      supabase.from('milestones').select('*').eq('user_id', user.id).order('earned_at', { ascending: false }),
      supabase.from('weekly_reports').select('*').eq('user_id', user.id).order('week_start', { ascending: false }).limit(1).single(),
      supabase.from('symptom_logs').select('*').eq('user_id', user.id).gte('logged_at', sevenDaysAgo.toISOString()).order('logged_at', { ascending: true }),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (streakRes.data) setStreak(streakRes.data);
    if (milestonesRes.data) setMilestones(milestonesRes.data);
    if (reportRes.data) setWeeklyReport(reportRes.data);
    if (logsRes.data) setRecentLogs(logsRes.data);
    if (streakRes.data) setProteinPct(Math.min(100, (streakRes.data.current_streak / 7) * 100));

    const showWeight = profileRes.data?.show_weight_log ?? true;
    if (showWeight) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const res = await fetch(
            `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/weight-logs?days=90`,
            { headers: { Authorization: `Bearer ${session.access_token}` } }
          );
          if (res.ok) setWeightLogs(await res.json());
        } catch { /* silent */ }
      }
    }
  }

  useEffect(() => { load(); trackProgressScreenViewed(); }, []);

  useEffect(() => {
    if (celebrationChecked.current || milestones.length === 0) return;
    const has7Day = milestones.some(m => m.milestone_type === '7day_streak');
    if (!has7Day) return;
    celebrationChecked.current = true;
    AsyncStorage.getItem('review_prompt_shown').then(already => {
      if (!already) {
        setShowReviewBtn(true);
        setCelebrationOpen(true);
      }
    });
  }, [milestones]);

  async function generateWeeklyReport() {
    setGeneratingReport(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/weekly-report`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({}) }
      );
      if (res.ok) {
        setWeeklyReport(await res.json());
        trackWeeklyReportOpened();
        trackInsightViewed('progress');
      }
    } finally { setGeneratingReport(false); }
  }

  async function saveWeight() {
    const lbs = parseFloat(weightInput);
    if (isNaN(lbs) || lbs < 50 || lbs > 700) {
      setWeightError('Please enter a weight between 50 and 700 lbs.');
      return;
    }
    setWeightError(null);
    setWeightSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/weight-logs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ weight_lbs: lbs, note: weightNote || null, logged_date: today }),
        }
      );
      if (!res.ok) throw new Error('Failed to save');
      trackWeightLogged({ source: 'manual', weight_lbs: lbs, has_note: !!weightNote });
      closeWeightModal();
      setWeightInput('');
      setWeightNote('');
      const logsRes = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/weight-logs?days=90`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (logsRes.ok) setWeightLogs(await logsRes.json());
      // Success banner (Reanimated)
      loggedOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(2000, withTiming(0, { duration: 300 })),
      );
    } catch {
      setWeightError('Could not save. Please try again.');
    } finally { setWeightSaving(false); }
  }

  function closeCelebration() {
    setCelebrationOpen(false);
    AsyncStorage.setItem('review_prompt_shown', '1');
  }

  async function handleReviewPress() {
    closeCelebration();
    await StoreReview.requestReview();
  }

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, []);

  const showWeightSection = profile?.show_weight_log ?? true;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = weightLogs.find(l => l.logged_date === todayStr);
  const healthConnected = profile?.health_connected ?? false;
  const alreadySynced = healthConnected && todayLog?.source === 'apple_health';

  const milestoneEntries = Object.entries(MILESTONE_LABELS);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={s.screenTitle}>Your progress</Text>

        {/* Protein ring + streak stats */}
        <Animated.View entering={FadeIn.duration(500)} style={s.ringCard}>
          <View style={s.ringCenter}>
            <ProteinRing pct={proteinPct} colors={colors} />
            <View style={s.ringLabel}>
              <Text style={s.ringPct}>{Math.round(proteinPct)}%</Text>
              <Text style={s.ringLabelText}>Protein{'\n'}goal</Text>
            </View>
          </View>
          <View style={s.ringStats}>
            <View style={s.ringStat}>
              <Text style={s.ringStatVal}>{streak?.current_streak ?? 0}</Text>
              <Text style={s.ringStatLabel}>Day streak</Text>
            </View>
            <View style={s.ringStat}>
              <Text style={s.ringStatVal}>{streak?.longest_streak ?? 0}</Text>
              <Text style={s.ringStatLabel}>Best</Text>
            </View>
            <View style={s.ringStat}>
              <Text style={s.ringStatVal}>{streak?.total_logs ?? 0}</Text>
              <Text style={s.ringStatLabel}>Total logs</Text>
            </View>
          </View>
        </Animated.View>

        {/* Weekly insight */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Weekly insight</Text>
          {weeklyReport ? (
            <View style={s.insightCard}>
              <Text style={s.insightText}>{weeklyReport.insight_text}</Text>
              {weeklyReport.avg_protein_g != null && (
                <Text style={s.insightMeta}>Avg protein this week: {weeklyReport.avg_protein_g}g/day</Text>
              )}
            </View>
          ) : (
            <TouchableOpacity style={[s.insightCard, s.insightCardEmpty]} onPress={generateWeeklyReport}
              disabled={generatingReport} activeOpacity={0.8}>
              {generatingReport ? <ActivityIndicator color={colors.primary} /> : (
                <>
                  <Text style={s.insightEmptyIcon}>💡</Text>
                  <Text style={s.insightEmptyText}>Tap to generate your weekly AI insight</Text>
                  <Text style={s.insightEmptySub}>Needs at least 2 symptom logs this week</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* 7-day activity */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>7-day activity</Text>
          <View style={s.activityCard}>
            <View style={s.activityRow}>
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                const dayKey = d.toDateString();
                const log = recentLogs.find(l => new Date(l.logged_at).toDateString() === dayKey);
                const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                const letter = dayLetters[d.getDay()];
                const isToday = i === 6;
                return (
                  <View key={i} style={s.activityDay}>
                    <Text style={[s.activityDayLabel, isToday && { color: colors.primary }]}>{letter}</Text>
                    <View style={[
                      s.activityDot,
                      log ? { backgroundColor: colors.primary } : { backgroundColor: colors.muted, borderColor: colors.border },
                      isToday && !log && { borderColor: colors.primary, borderWidth: 1.5 },
                    ]}>
                      {log && <Text style={s.activityDotEnergy}>{log.energy_level}</Text>}
                    </View>
                    {log ? (
                      <Text style={[s.activitySev, { color: colors.primary }]}>S{log.severity}</Text>
                    ) : (
                      <Text style={s.activitySev}> </Text>
                    )}
                  </View>
                );
              })}
            </View>
            {recentLogs.length > 0 && (
              <View style={s.activityStats}>
                <View style={s.activityStat}>
                  <Text style={s.activityStatVal}>
                    {(recentLogs.reduce((sum, l) => sum + l.energy_level, 0) / recentLogs.length).toFixed(1)}
                  </Text>
                  <Text style={s.activityStatLabel}>Avg energy</Text>
                </View>
                <View style={s.activityStatDivider} />
                <View style={s.activityStat}>
                  <Text style={s.activityStatVal}>
                    {(recentLogs.reduce((sum, l) => sum + l.severity, 0) / recentLogs.length).toFixed(1)}
                  </Text>
                  <Text style={s.activityStatLabel}>Avg severity</Text>
                </View>
                <View style={s.activityStatDivider} />
                <View style={s.activityStat}>
                  <Text style={s.activityStatVal}>{recentLogs.length}</Text>
                  <Text style={s.activityStatLabel}>Logs this week</Text>
                </View>
              </View>
            )}
            {recentLogs.length === 0 && (
              <Text style={s.activityEmpty}>No logs this week yet — tap "Log Symptoms" to start!</Text>
            )}
          </View>
        </View>

        {/* ── Weight Log Section ─────────────────────────────────────── */}
        {showWeightSection && (
          <View
            style={s.section}
            onLayout={() => {
              if (!weightSectionTracked.current) {
                weightSectionTracked.current = true;
                trackWeightChartViewed({ data_points_count: weightLogs.length, has_trend_badge: hasTrendBadge });
              }
            }}
          >
            <Text style={s.sectionTitle}>Weight</Text>

            {weightLogs.length >= 2 ? (
              <View style={[s.weightChartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <WeightChart logs={weightLogs} colors={colors} onTrend={setHasTrendBadge} />
              </View>
            ) : (
              <View style={[s.weightEmptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Svg width={64} height={64} style={{ marginBottom: Spacing.md }}>
                  <Circle cx={32} cy={32} r={30} fill="none" stroke={colors.border} strokeWidth={2} />
                  <Circle cx={32} cy={32} r={18} fill="none" stroke={colors.primary} strokeWidth={2} />
                </Svg>
                <Text style={[s.weightEmptyTitle, { color: colors.foreground }]}>Your weight journey</Text>
                <Text style={[s.weightEmptySub, { color: colors.mutedForeground }]}>
                  Log your first weight when you're ready. No pressure — it's here when it feels right.
                </Text>
              </View>
            )}

            {/* Non-scale victories card */}
            <View style={[s.nsvCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="heart-outline" size={20} color={TEAL} style={{ marginTop: 2, flexShrink: 0 }} />
              <View style={{ flex: 1 }}>
                <Text style={[s.nsvTitle, { color: colors.foreground }]}>Other wins this week</Text>
                <Text style={[s.nsvBody, { color: colors.mutedForeground }]}>
                  {weeklyReport?.insight_text
                    ?? 'Your first weekly insight appears after 7 days of tracking.'}
                </Text>
              </View>
            </View>

            {alreadySynced && todayLog ? (
              <View style={s.syncedRow}>
                <Ionicons name="checkmark-circle" size={18} color={TEAL} />
                <Text style={[s.syncedText, { color: colors.mutedForeground }]}>
                  Synced from Apple Health · {Number(todayLog.weight_lbs).toFixed(1)} lbs
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[s.logWeightBtn, { borderColor: TEAL }]}
                onPress={() => { setWeightInput(''); setWeightNote(''); setWeightError(null); setWeightModalOpen(true); }}
                activeOpacity={0.8}
              >
                <Text style={[s.logWeightBtnText, { color: TEAL }]}>Log today's weight</Text>
              </TouchableOpacity>
            )}

            {/* Success banner — Reanimated */}
            <Animated.View style={[s.loggedBanner, loggedBannerStyle]}>
              <Ionicons name="checkmark-circle" size={16} color={TEAL} />
              <Text style={[s.loggedBannerText, { color: TEAL }]}>Logged!</Text>
            </Animated.View>
          </View>
        )}

        {/* Milestones */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Milestones</Text>
          {milestones.length === 0 ? (
            <View style={s.emptyMilestone}>
              <Text style={s.emptyMilestoneText}>Keep logging to unlock milestones 🏅</Text>
            </View>
          ) : (
            <View style={s.milestoneGrid}>
              {milestoneEntries.map(([type, { icon, label }], idx) => {
                const earned = milestones.find(m => m.milestone_type === type);
                const delay = Math.min(idx, 11) * 80;
                return (
                  <Animated.View
                    key={type}
                    entering={ZoomIn.delay(delay).duration(350)}
                    style={[s.milestoneCard, !earned && s.milestoneCardLocked]}
                  >
                    <Text style={[s.milestoneIcon, !earned && s.milestoneLocked]}>{icon}</Text>
                    <Text style={[s.milestoneLabel, !earned && s.milestoneLabelLocked]}>{label}</Text>
                    {earned && (
                      <Text style={s.milestoneDate}>
                        {new Date(earned.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    )}
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 7-day streak celebration modal */}
      <Modal visible={celebrationOpen} animationType="fade" transparent onRequestClose={closeCelebration}>
        <View style={s.celebOverlay}>
          <View style={[s.celebCard, { backgroundColor: colors.card }]}>
            <Text style={s.celebEmoji}>🏆</Text>
            <Text style={[s.celebTitle, { color: colors.foreground }]}>7-Day Streak Earned!</Text>
            <View style={s.confettiRow}>
              {['🎉', '🎊', '🎉'].map((e, i) => <Text key={i} style={s.confettiEmoji}>{e}</Text>)}
            </View>
            <Text style={[s.celebSub, { color: colors.mutedForeground }]}>
              You logged every day this week. That's a real habit forming.
            </Text>
            {showReviewBtn && (
              <TouchableOpacity onPress={handleReviewPress} style={s.reviewBtn} activeOpacity={0.7}>
                <Text style={[s.reviewBtnText, { color: TEAL }]}>⭐ Enjoying FoodWise? Leave a review</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={closeCelebration} style={[s.celebCloseBtn, { backgroundColor: TEAL }]} activeOpacity={0.85}>
              <Text style={s.celebCloseBtnText}>Keep it up!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Weight log modal */}
      <Modal
        visible={weightModalOpen}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeWeightModal}
      >
        <View style={{ flex: 1 }}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }, overlayStyle]}>
            <TouchableOpacity style={{ flex: 1 }} onPress={closeWeightModal} activeOpacity={1} />
          </Animated.View>
          <Animated.View style={[s.modalSheet, modalSheetStyle]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <SafeAreaView style={[s.modalSafe, { backgroundColor: colors.background }]} edges={['bottom']}>
                <View style={s.modalHandle} />
                <View style={s.modalHeader}>
                  <Text style={[s.modalTitle, { color: colors.foreground }]}>Log today's weight</Text>
                  <TouchableOpacity onPress={closeWeightModal} style={s.modalCloseBtn}>
                    <Ionicons name="close" size={22} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
                <View style={s.modalBody}>
                  <Text style={[s.modalLabel, { color: colors.mutedForeground }]}>Weight (lbs)</Text>
                  <TextInput
                    style={[s.modalInput, { backgroundColor: colors.card, borderColor: weightError ? '#EF4444' : colors.border, color: colors.foreground }]}
                    placeholder="e.g. 185.5"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="decimal-pad"
                    value={weightInput}
                    onChangeText={v => { setWeightInput(v); setWeightError(null); }}
                    autoFocus
                  />
                  {weightError && <Text style={s.weightErrorText}>{weightError}</Text>}
                  <Text style={[s.modalLabel, { color: colors.mutedForeground, marginTop: Spacing.lg }]}>Note (optional)</Text>
                  <TextInput
                    style={[s.modalInput, s.modalInputMultiline, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    placeholder="Any non-scale wins today? e.g. more energy, less nausea"
                    placeholderTextColor={colors.mutedForeground}
                    multiline
                    numberOfLines={3}
                    value={weightNote}
                    onChangeText={setWeightNote}
                  />
                  <TouchableOpacity
                    style={[s.saveBtn, { backgroundColor: TEAL }, weightSaving && { opacity: 0.6 }]}
                    onPress={saveWeight}
                    disabled={weightSaving}
                    activeOpacity={0.85}
                  >
                    {weightSaving
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={s.saveBtnText}>Save</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={closeWeightModal} style={s.cancelBtn}>
                    <Text style={[s.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing['3xl'] },
    screenTitle: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, marginBottom: Spacing.xl },
    ringCard: { backgroundColor: c.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: c.border, padding: Spacing.xl, flexDirection: 'row', alignItems: 'center', gap: Spacing['2xl'], marginBottom: Spacing['2xl'] },
    ringCenter: { position: 'relative', width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
    ringLabel: { position: 'absolute', alignItems: 'center' },
    ringPct: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.primary },
    ringLabelText: { fontSize: FontSize.xs, color: c.mutedForeground, textAlign: 'center', marginTop: 2 },
    ringStats: { flex: 1, gap: Spacing.lg },
    ringStat: {},
    ringStatVal: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground },
    ringStatLabel: { fontSize: FontSize.xs, color: c.mutedForeground },
    section: { marginBottom: Spacing['2xl'] },
    sectionTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: c.mutedForeground, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: Spacing.md },
    insightCard: { backgroundColor: c.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.secondary + '4D', padding: Spacing.xl },
    insightCardEmpty: { alignItems: 'center', gap: Spacing.sm },
    insightEmptyIcon: { fontSize: 32 },
    insightEmptyText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-SemiBold', color: c.foreground, textAlign: 'center' },
    insightEmptySub: { fontSize: FontSize.xs, color: c.mutedForeground, textAlign: 'center' },
    insightText: { fontSize: FontSize.sm, color: c.foreground, lineHeight: 22 },
    insightMeta: { fontSize: FontSize.xs, color: c.secondary, marginTop: Spacing.sm, fontFamily: 'PlusJakartaSans-SemiBold' },
    activityCard: { backgroundColor: c.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: c.border, padding: Spacing.xl },
    activityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl },
    activityDay: { alignItems: 'center', gap: 6, flex: 1 },
    activityDayLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', color: c.mutedForeground },
    activityDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    activityDotEnergy: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.primaryForeground },
    activitySev: { fontSize: 10, color: c.mutedForeground, fontFamily: 'PlusJakartaSans-SemiBold' },
    activityStats: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: c.border, paddingTop: Spacing.lg },
    activityStat: { flex: 1, alignItems: 'center' },
    activityStatVal: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground },
    activityStatLabel: { fontSize: FontSize.xs, color: c.mutedForeground, marginTop: 2 },
    activityStatDivider: { width: 1, height: 32, backgroundColor: c.border },
    activityEmpty: { fontSize: FontSize.sm, color: c.mutedForeground, textAlign: 'center', lineHeight: 20 },
    weightChartCard: { borderRadius: Radius.xl, borderWidth: 1, padding: 16, marginBottom: Spacing.md, overflow: 'hidden' },
    weightEmptyCard: { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md },
    weightEmptyTitle: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: Spacing.sm },
    weightEmptySub: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
    nsvCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: 14, borderRadius: Radius.lg, borderWidth: 1, borderLeftWidth: 3, borderLeftColor: TEAL, marginBottom: Spacing.md },
    nsvTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: 4 },
    nsvBody: { fontSize: FontSize.xs, lineHeight: 18 },
    logWeightBtn: { borderWidth: 1.5, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', marginBottom: 4 },
    logWeightBtnText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold' },
    syncedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: Spacing.md },
    syncedText: { fontSize: FontSize.sm },
    loggedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
    loggedBannerText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold' },
    emptyMilestone: { backgroundColor: c.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.border, padding: Spacing.xl, alignItems: 'center' },
    emptyMilestoneText: { fontSize: FontSize.sm, color: c.mutedForeground },
    milestoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    milestoneCard: { width: '30%', backgroundColor: c.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.primary + '4D', padding: Spacing.md, alignItems: 'center', gap: 4 },
    milestoneCardLocked: { borderColor: c.border, opacity: 0.5 },
    milestoneIcon: { fontSize: 28 },
    milestoneLocked: { opacity: 0.3 },
    milestoneLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold', color: c.foreground, textAlign: 'center' },
    milestoneLabelLocked: { color: c.mutedForeground },
    milestoneDate: { fontSize: FontSize.xs, color: c.primary },
    modalSafe: { flex: 1 },
    modalSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SCREEN_HEIGHT * 0.85, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: c.background, overflow: 'hidden' },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginTop: 8, marginBottom: 16 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
    modalTitle: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-ExtraBold' },
    modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.muted, alignItems: 'center', justifyContent: 'center' },
    modalBody: { paddingHorizontal: Spacing.xl, flex: 1 },
    modalLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
    modalInput: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Regular' },
    modalInputMultiline: { height: 80, textAlignVertical: 'top' },
    weightErrorText: { fontSize: FontSize.xs, color: '#EF4444', marginTop: 6, fontFamily: 'PlusJakartaSans-SemiBold' },
    saveBtn: { borderRadius: Radius.lg, paddingVertical: 15, alignItems: 'center', marginTop: Spacing.xl, marginBottom: Spacing.md },
    saveBtnText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#fff' },
    cancelBtn: { alignItems: 'center', paddingVertical: Spacing.md },
    cancelBtnText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold' },
    celebOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
    celebCard: { borderRadius: Radius.xl, padding: Spacing['2xl'], alignItems: 'center', width: '100%', maxWidth: 340 },
    celebEmoji: { fontSize: 56, marginBottom: Spacing.md },
    celebTitle: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', textAlign: 'center', marginBottom: Spacing.sm },
    confettiRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
    confettiEmoji: { fontSize: 24 },
    celebSub: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xl },
    reviewBtn: { paddingVertical: Spacing.md, marginBottom: Spacing.md },
    reviewBtnText: { fontSize: 13, fontFamily: 'PlusJakartaSans-SemiBold', textAlign: 'center' },
    celebCloseBtn: { borderRadius: Radius.full, paddingVertical: 14, paddingHorizontal: 48 },
    celebCloseBtnText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#fff' },
  });
}
