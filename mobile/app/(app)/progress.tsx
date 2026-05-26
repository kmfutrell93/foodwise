import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, Streak, Milestone, WeeklyReport, SymptomLog } from '@/lib/supabase';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';

const MILESTONE_META: Record<string, { icon: string; label: string; desc: string }> = {
  first_log: { icon: '📝', label: 'First Log', desc: 'Logged your first symptom check-in' },
  '7day_streak': { icon: '🔥', label: '7-Day Streak', desc: 'Hit your goal 7 days in a row' },
  '30day_streak': { icon: '💎', label: '30-Day Streak', desc: 'Unstoppable — 30 days straight' },
  first_insight: { icon: '🧠', label: 'First Insight', desc: 'Got your first AI meal adjustment' },
  first_week_under_budget: { icon: '💰', label: 'Budget Win', desc: 'First week under grocery budget' },
  plan_streak_7: { icon: '📅', label: 'Plan Streak', desc: 'Generated a plan 7 weeks in a row' },
};

function DotCalendar({ logs }: { logs: SymptomLog[] }) {
  const today = new Date();
  const dots = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const logged = logs.some(l => l.logged_at.startsWith(dateStr));
    return { date: dateStr, logged };
  });

  return (
    <View style={cal.grid}>
      {dots.map((dot) => (
        <View key={dot.date} style={[cal.dot, dot.logged && cal.dotFilled]} />
      ))}
    </View>
  );
}

const cal = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.border },
  dotFilled: { backgroundColor: Colors.primary },
});

export default function ProgressScreen() {
  const [streak, setStreak] = useState<Streak | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [logs, setLogs] = useState<SymptomLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: str }, { data: miles }, { data: rpts }, { data: symLogs }] = await Promise.all([
      supabase.from('streaks').select('*').eq('user_id', user.id).single(),
      supabase.from('milestones').select('*').eq('user_id', user.id),
      supabase.from('weekly_reports').select('*').eq('user_id', user.id).order('week_of', { ascending: false }).limit(10),
      supabase.from('symptom_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(30),
    ]);

    setStreak(str);
    setMilestones(miles ?? []);
    setReports(rpts ?? []);
    setLogs(symLogs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const earnedTypes = new Set(milestones.map(m => m.type));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Progress</Text>

        {/* Streaks */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🔥 Streaks</Text>
          <View style={styles.streakRow}>
            {[
              { icon: '🥩', label: 'Protein', count: streak?.protein_streak ?? 0 },
              { icon: '✅', label: 'Check-in', count: streak?.checkin_streak ?? 0 },
              { icon: '📅', label: 'Plan', count: streak?.plan_streak ?? 0 },
            ].map((s) => (
              <View key={s.label} style={styles.streakItem}>
                <Text style={styles.streakIcon}>{s.icon}</Text>
                <Text style={styles.streakCount}>{s.count}</Text>
                <Text style={styles.streakLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>30-day activity</Text>
          <DotCalendar logs={logs} />
        </View>

        {/* This week stats */}
        {logs.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📊 This Week</Text>
            <View style={styles.statsRow}>
              {(() => {
                const week = logs.slice(0, 7);
                const avgNausea = week.filter(l => l.nausea).reduce((a, l) => a + (l.nausea ?? 0), 0) / (week.filter(l => l.nausea).length || 1);
                const avgFatigue = week.filter(l => l.fatigue).reduce((a, l) => a + (l.fatigue ?? 0), 0) / (week.filter(l => l.fatigue).length || 1);
                return [
                  { label: 'Logs', val: `${week.length}`, sub: 'this week' },
                  { label: 'Avg Nausea', val: avgNausea.toFixed(1), sub: 'out of 5' },
                  { label: 'Avg Fatigue', val: avgFatigue.toFixed(1), sub: 'out of 5' },
                ].map(s => (
                  <View key={s.label} style={styles.statItem}>
                    <Text style={styles.statVal}>{s.val}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                    <Text style={styles.statSub}>{s.sub}</Text>
                  </View>
                ));
              })()}
            </View>
          </View>
        )}

        {/* Milestones */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🏆 Milestones</Text>
          <View style={styles.milestoneGrid}>
            {Object.entries(MILESTONE_META).map(([type, meta]) => {
              const earned = earnedTypes.has(type as any);
              return (
                <View key={type} style={[styles.milestoneBadge, !earned && styles.milestoneBadgeLocked]}>
                  <Text style={[styles.milestoneIcon, !earned && styles.milestoneIconLocked]}>{meta.icon}</Text>
                  <Text style={[styles.milestoneLabel, !earned && styles.milestoneLabelLocked]}>{meta.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Weekly reports */}
        {reports.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📬 Weekly Reports</Text>
            <View style={styles.reports}>
              {reports.map((r) => (
                <View key={r.id} style={styles.reportCard}>
                  <Text style={styles.reportDate}>
                    Week of {new Date(r.week_of).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.reportText}>{r.summary}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing['3xl'], gap: Spacing.lg },
  screenTitle: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground },
  card: { padding: Spacing.xl, borderRadius: Radius.xl, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, gap: Spacing.lg },
  sectionTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1 },
  streakRow: { flexDirection: 'row', gap: Spacing.sm },
  streakItem: { flex: 1, alignItems: 'center', gap: 2, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.muted },
  streakIcon: { fontSize: 20 },
  streakCount: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.primary },
  streakLabel: { fontSize: FontSize.xs, color: Colors.mutedForeground },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statItem: { flex: 1, alignItems: 'center', padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.muted, gap: 2 },
  statVal: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground },
  statLabel: { fontSize: FontSize.xs, color: Colors.mutedForeground, fontFamily: 'PlusJakartaSans-SemiBold' },
  statSub: { fontSize: FontSize.xs, color: Colors.mutedForeground },
  milestoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  milestoneBadge: { width: '30%', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: 'rgba(232,157,53,0.1)', borderWidth: 1, borderColor: 'rgba(232,157,53,0.3)', gap: 4 },
  milestoneBadgeLocked: { backgroundColor: Colors.muted, borderColor: Colors.border },
  milestoneIcon: { fontSize: 28 },
  milestoneIconLocked: { opacity: 0.3 },
  milestoneLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold', color: Colors.primary, textAlign: 'center' },
  milestoneLabelLocked: { color: Colors.mutedForeground },
  reports: { gap: Spacing.md },
  reportCard: { padding: Spacing.lg, borderRadius: Radius.lg, backgroundColor: Colors.muted, gap: Spacing.sm },
  reportDate: { fontSize: FontSize.xs, color: Colors.mutedForeground, fontFamily: 'PlusJakartaSans-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  reportText: { fontSize: FontSize.base, color: Colors.foreground, lineHeight: 24 },
});
