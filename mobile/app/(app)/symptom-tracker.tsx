import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { supabase, SymptomLog } from '@/lib/supabase';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import { trackSymptomLogged, trackInsightViewed } from '@/lib/analytics';
import { INSIGHT_TIMEOUT_MS } from '@/lib/constants';
import { logError } from '@/lib/utils';

const SYMPTOMS = ['nausea', 'fatigue', 'constipation', 'bloating', 'vomiting', 'headache', 'dizziness', 'heartburn'];
const SYMPTOM_ICONS: Record<string, string> = {
  nausea: '🤢', fatigue: '😴', constipation: '😣', bloating: '🫧',
  vomiting: '🤮', headache: '🤕', dizziness: '😵', heartburn: '🔥',
};

function formatGroupLabel(isoStr: string): string {
  const d = new Date(isoStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatLogTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function groupLogsByDate(logs: SymptomLog[]): { label: string; logs: SymptomLog[] }[] {
  const groups: { label: string; logs: SymptomLog[] }[] = [];
  for (const log of logs) {
    const label = formatGroupLabel(log.logged_at);
    const existing = groups.find(g => g.label === label);
    if (existing) existing.logs.push(log);
    else groups.push({ label, logs: [log] });
  }
  return groups;
}

// Compares the first half vs second half of the last 7 days' logs for the
// most frequently-logged symptom, so the user sees whether it's trending up
// or down rather than just a flat history list.
function compute7DaySummary(logs: SymptomLog[]): { topSymptom: string; avg: number; trend: 'improving' | 'worsening' | 'stable' } | null {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recent = logs.filter(l => new Date(l.logged_at) >= sevenDaysAgo);
  if (recent.length < 2) return null;

  const counts: Record<string, number> = {};
  for (const l of recent) for (const sym of l.symptoms as string[]) counts[sym] = (counts[sym] ?? 0) + 1;
  const topSymptom = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!topSymptom) return null;

  const withTop = recent.filter(l => (l.symptoms as string[]).includes(topSymptom));
  if (withTop.length < 2) return null;

  const avg = withTop.reduce((sum, l) => sum + l.severity, 0) / withTop.length;
  const sorted = [...withTop].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
  const half = Math.max(1, Math.floor(sorted.length / 2));
  const firstHalfAvg = sorted.slice(0, half).reduce((sum, l) => sum + l.severity, 0) / half;
  const secondHalfAvg = sorted.slice(half).reduce((sum, l) => sum + l.severity, 0) / (sorted.length - half || 1);
  const diff = secondHalfAvg - firstHalfAvg;
  const trend = diff < -0.3 ? 'improving' : diff > 0.3 ? 'worsening' : 'stable';

  return { topSymptom, avg, trend };
}

export default function SymptomTracker() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const [logs, setLogs] = useState<SymptomLog[]>([]);
  const [severity, setSeverity] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [insight, setInsight] = useState<{ insight: string; recommendation?: string } | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const fetchingInsightRef = useRef(false);
  const [foodAversions, setFoodAversions] = useState<string[]>([]);

  async function loadLogs() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data }, { data: profileData }, { count }] = await Promise.all([
      supabase
        .from('symptom_logs').select('*').eq('user_id', user.id)
        .order('logged_at', { ascending: false }).limit(10),
      supabase
        .from('profiles')
        .select('food_aversions, latest_symptom_recommendation')
        .eq('id', user.id)
        .single(),
      supabase.from('symptom_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);
    if (data) setLogs(data);
    setFoodAversions(profileData?.food_aversions ?? []);
    if (profileData?.latest_symptom_recommendation && !insight) {
      setInsight({
        insight: profileData.latest_symptom_recommendation,
        recommendation: profileData.latest_symptom_recommendation,
      });
    }
    // Backfill: users with 3+ logs but no recommendation never got a successful insight call
    if ((count ?? 0) >= 3 && !profileData?.latest_symptom_recommendation) {
      console.log('[symptoms] loadLogs: count>=3 and no recommendation — triggering insight');
      void fetchInsight();
    }
  }

  useEffect(() => { loadLogs(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  }, []);

  function toggleSymptom(sym: string) {
    Haptics.selectionAsync();
    setSelectedSymptoms(prev => prev.includes(sym) ? prev.filter(x => x !== sym) : [...prev, sym]);
  }

  async function saveLog() {
    if (selectedSymptoms.length === 0) return;
    setSaving(true);
    const symptomsSnapshot = [...selectedSymptoms];
    const notesSnapshot = notes.trim();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error: insertError } = await supabase.from('symptom_logs').insert({
        user_id: user.id, symptoms: symptomsSnapshot, severity,
        energy_level: energyLevel, notes: notesSnapshot || null,
        logged_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;
      console.log('[symptoms] log saved');
      await supabase.rpc('increment_streak', { p_user_id: user.id });
      setSelectedSymptoms([]);
      setNotes('');
      setSeverity(3);
      setEnergyLevel(5);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      trackSymptomLogged({
        symptoms: symptomsSnapshot,
        severity,
        energy_level: energyLevel,
        has_notes: notesSnapshot.length > 0,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await loadLogs();
      // Fetch AI insight after 3+ logs — await so we surface errors
      const { count } = await supabase.from('symptom_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      console.log('[symptoms] log count after save:', count);
      if ((count ?? 0) >= 3) {
        console.log('[symptoms] triggering insights (count>=3)');
        await fetchInsight();
      }
    } catch (e: unknown) {
      logError('symptom-tracker:saveLog', e);
      Alert.alert('Could not save log', 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function fetchInsight() {
    if (fetchingInsightRef.current) return;
    fetchingInsightRef.current = true;
    setLoadingInsight(true);
    setInsightError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('[symptoms] fetchInsight: no session');
        return;
      }
      console.log('[symptoms] calling symptoms-insights…');
      // 60s timeout — Claude + profile write; short abort was killing the write.
      const res = await fetchWithTimeout(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/symptoms-insights`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({}) },
        INSIGHT_TIMEOUT_MS
      );
      console.log('[symptoms] insights status:', res.status);
      if (res.ok) {
        const body = await res.json();
        setInsight(body);
        trackInsightViewed('symptom_tracker');
        // Confirm DB write landed
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('latest_symptom_recommendation')
            .eq('id', user.id)
            .single();
          console.log(
            '[symptoms] profile recommendation present:',
            !!prof?.latest_symptom_recommendation,
            'len:',
            prof?.latest_symptom_recommendation?.length ?? 0,
          );
        }
      } else {
        const errBody = await res.json().catch(() => ({}));
        console.warn('[symptoms] insights error body:', errBody);
        setInsightError('Could not load insight. Check your connection and try again.');
      }
    } catch (e: unknown) {
      logError('symptom-tracker:fetchInsight', e);
      setInsightError(e instanceof Error ? e.message : 'Could not load insight. Check your connection and try again.');
    } finally {
      setLoadingInsight(false);
      fetchingInsightRef.current = false;
    }
  }

  const weekSummary = compute7DaySummary(logs);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.screenTitle}>Symptom tracker</Text>

        <View style={s.card}>
          <Text style={s.cardTitle}>Log today&apos;s symptoms</Text>
          <Text style={s.cardSub}>Select all that apply</Text>
          <View style={s.tags}>
            {SYMPTOMS.map(sym => {
              const sel = selectedSymptoms.includes(sym);
              return (
                <TouchableOpacity
                  key={sym}
                  style={[s.tag, sel && { borderColor: colors.accent, backgroundColor: colors.accent + '1F' }]}
                  onPress={() => toggleSymptom(sym)}
                  activeOpacity={0.75}
                >
                  <Text style={s.tagEmoji}>{SYMPTOM_ICONS[sym]}</Text>
                  <Text style={[s.tagText, sel && { color: colors.accent }]}>
                    {sym.charAt(0).toUpperCase() + sym.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={s.sliderLabel}>Overall severity: <Text style={s.sliderVal}>{severity}/5</Text></Text>
          <Slider
            style={s.slider}
            minimumValue={1} maximumValue={5} step={1} value={severity}
            onValueChange={setSeverity}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.accent}
          />

          <Text style={s.sliderLabel}>Energy level: <Text style={s.sliderVal}>{energyLevel}/10</Text></Text>
          <Slider
            style={s.slider}
            minimumValue={1} maximumValue={10} step={1} value={energyLevel}
            onValueChange={setEnergyLevel}
            minimumTrackTintColor={colors.secondary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.secondary}
          />

          <TextInput
            style={s.notesInput}
            placeholder="Any notes? (optional)"
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[s.logBtn, (selectedSymptoms.length === 0 || saving) && s.logBtnDisabled]}
            onPress={saveLog}
            disabled={selectedSymptoms.length === 0 || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <Text style={s.logBtnText}>{saved ? '✓ Logged!' : 'Log symptoms'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {(insight || loadingInsight || insightError) && (
          <View style={[s.insightCard, { backgroundColor: 'rgba(29,158,117,0.1)', borderColor: 'rgba(29,158,117,0.2)' }]}>
            <Text style={[s.insightTitle, { color: colors.secondary }]}>🌿 Nori&apos;s insight</Text>
            {loadingInsight ? (
              <ActivityIndicator color={colors.secondary} />
            ) : insightError ? (
              <>
                <Text style={[s.insightText, { color: colors.foreground }]}>{insightError}</Text>
                <TouchableOpacity onPress={fetchInsight} style={{ marginTop: Spacing.sm }}>
                  <Text style={[s.insightRec, { color: colors.secondary }]}>Try again</Text>
                </TouchableOpacity>
              </>
            ) : insight ? (
              <>
                <Text style={[s.insightText, { color: colors.foreground }]}>{insight.insight}</Text>
                {insight.recommendation && (
                  <Text style={[s.insightRec, { color: colors.secondary }]}>💡 {insight.recommendation}</Text>
                )}
              </>
            ) : null}
          </View>
        )}

        {logs.length > 0 && (
          <View style={s.historySection}>
            <Text style={s.historyTitle}>Recent logs</Text>

            {weekSummary && (
              <View style={[s.summaryRow, { backgroundColor: colors.muted }]}>
                <Text style={s.summaryText}>
                  Last 7 days: {weekSummary.topSymptom.charAt(0).toUpperCase() + weekSummary.topSymptom.slice(1)} avg {weekSummary.avg.toFixed(1)}/5{' '}
                  {weekSummary.trend === 'improving' ? '↓ improving' : weekSummary.trend === 'worsening' ? '↑ worsening' : '— stable'}
                </Text>
              </View>
            )}

            {foodAversions.length > 0 && (
              <View style={s.aversionsRow}>
                <Text style={s.aversionsLabel}>Known aversions:</Text>
                <Text style={s.aversionsText}>{foodAversions.join(', ')}</Text>
              </View>
            )}

            {groupLogsByDate(logs).map(group => (
              <View key={group.label} style={s.dateGroup}>
                <Text style={s.dateGroupLabel}>{group.label}</Text>
                {group.logs.map(log => (
                  <View key={log.id} style={s.logCard}>
                    <View style={s.logHeader}>
                      <Text style={s.logDate}>{formatLogTime(log.logged_at)}</Text>
                      <Text style={s.logSeverity}>Sev {log.severity}/5 · Energy {log.energy_level}/10</Text>
                    </View>
                    <View style={s.logSymptoms}>
                      {(log.symptoms as string[]).map(sym => (
                        <View key={sym} style={s.logTag}>
                          <Text style={s.logTagText}>{SYMPTOM_ICONS[sym]} {sym}</Text>
                        </View>
                      ))}
                    </View>
                    {log.notes && <Text style={s.logNotes}>{log.notes}</Text>}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: 120 },
    screenTitle: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, marginBottom: Spacing.xl },
    card: { backgroundColor: c.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: c.border, padding: Spacing.xl, marginBottom: Spacing['2xl'] },
    cardTitle: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, marginBottom: 4 },
    cardSub: { fontSize: FontSize.sm, color: c.mutedForeground, marginBottom: Spacing.xl },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
    tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.background },
    tagEmoji: { fontSize: 14 },
    tagText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: c.foreground },
    sliderLabel: { fontSize: FontSize.sm, color: c.mutedForeground, fontFamily: 'PlusJakartaSans-SemiBold', marginBottom: 4 },
    sliderVal: { color: c.foreground },
    slider: { width: '100%', height: 40, marginBottom: Spacing.md },
    notesInput: { backgroundColor: c.input, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.border, padding: Spacing.lg, fontSize: FontSize.sm, color: c.foreground, fontFamily: 'PlusJakartaSans-Regular', height: 80, marginBottom: Spacing.xl },
    logBtn: { backgroundColor: c.primary, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
    logBtnDisabled: { opacity: 0.4 },
    logBtnText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.primaryForeground },
    insightCard: { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.xl, marginBottom: Spacing['2xl'] },
    insightTitle: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
    insightText: { fontSize: FontSize.sm, lineHeight: 22, marginBottom: Spacing.sm },
    insightRec: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', lineHeight: 20 },
    historySection: {},
    historyTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: c.mutedForeground, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: Spacing.md },
    summaryRow: { borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md },
    summaryText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: c.foreground },
    aversionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: Spacing.lg },
    aversionsLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', color: c.mutedForeground },
    aversionsText: { fontSize: FontSize.xs, color: c.mutedForeground, flexShrink: 1 },
    dateGroup: { marginBottom: Spacing.lg },
    dateGroupLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
    logCard: { backgroundColor: c.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.border, padding: Spacing.lg, marginBottom: Spacing.sm },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
    logDate: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: c.foreground },
    logSeverity: { fontSize: FontSize.xs, color: c.mutedForeground },
    logSymptoms: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
    logTag: { backgroundColor: c.accent + '1A', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
    logTagText: { fontSize: FontSize.xs, color: c.accent, fontFamily: 'PlusJakartaSans-SemiBold' },
    logNotes: { fontSize: FontSize.xs, color: c.mutedForeground, fontStyle: 'italic', marginTop: 4 },
  });
}
