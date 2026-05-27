import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { supabase, SymptomLog } from '@/lib/supabase';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import { trackSymptomLogged, trackInsightViewed } from '@/lib/analytics';

const SYMPTOMS = ['nausea', 'fatigue', 'constipation', 'bloating', 'vomiting', 'headache', 'dizziness', 'heartburn'];
const SYMPTOM_ICONS: Record<string, string> = {
  nausea: '🤢', fatigue: '😴', constipation: '😣', bloating: '🫧',
  vomiting: '🤮', headache: '🤕', dizziness: '😵', heartburn: '🔥',
};

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

  async function loadLogs() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('symptom_logs').select('*').eq('user_id', user.id)
      .order('logged_at', { ascending: false }).limit(10);
    if (data) setLogs(data);
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('symptom_logs').insert({
        user_id: user.id, symptoms: selectedSymptoms, severity,
        energy_level: energyLevel, notes: notes.trim() || null,
        logged_at: new Date().toISOString(),
      });
      await supabase.rpc('increment_streak', { p_user_id: user.id });
      setSelectedSymptoms([]);
      setNotes('');
      setSeverity(3);
      setEnergyLevel(5);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      trackSymptomLogged({ symptoms: selectedSymptoms, severity, energy_level: energyLevel, has_notes: notes.trim().length > 0 });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await loadLogs();
      // Fetch AI insight in background after 3+ logs
      const { count } = await supabase.from('symptom_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      if ((count ?? 0) >= 3) fetchInsight();
    } finally {
      setSaving(false);
    }
  }

  async function fetchInsight() {
    setLoadingInsight(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/symptoms-insights`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({}) }
      );
      if (res.ok) {
        setInsight(await res.json());
        trackInsightViewed('symptom_tracker');
      }
    } finally {
      setLoadingInsight(false);
    }
  }

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
          <Text style={s.cardTitle}>Log today's symptoms</Text>
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

        {(insight || loadingInsight) && (
          <View style={[s.insightCard, { backgroundColor: 'rgba(29,158,117,0.1)', borderColor: 'rgba(29,158,117,0.2)' }]}>
            <Text style={[s.insightTitle, { color: colors.secondary }]}>🌿 Nori's insight</Text>
            {loadingInsight ? (
              <ActivityIndicator color={colors.secondary} />
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
            {logs.map(log => (
              <View key={log.id} style={s.logCard}>
                <View style={s.logHeader}>
                  <Text style={s.logDate}>
                    {new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </Text>
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
