import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { supabase, SymptomLog } from '@/lib/supabase';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const AVERSION_OPTIONS = [
  'meat', 'chicken', 'fish', 'eggs', 'dairy', 'bread',
  'greasy food', 'sweet food', 'spicy food', 'raw veg',
];

type Insight = { adjustment: string; reason: string } | null;

export default function SymptomTracker() {
  const [nausea, setNausea] = useState(1);
  const [constipation, setConstipation] = useState(1);
  const [fatigue, setFatigue] = useState(1);
  const [aversions, setAversions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [insight, setInsight] = useState<Insight>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [logCount, setLogCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase.from('symptom_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      setLogCount(count ?? 0);

      if ((count ?? 0) >= 7) {
        fetchInsight(user.id);
      }
    })();
  }, []);

  async function fetchInsight(userId: string) {
    setLoadingInsight(true);
    const { data } = await supabase.functions.invoke('symptoms/insights', {
      body: { user_id: userId },
    });
    if (data?.adjustment) setInsight(data);
    setLoadingInsight(false);
  }

  async function save() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);

    await supabase.from('symptom_logs').insert({
      user_id: user.id,
      nausea,
      constipation,
      fatigue,
      food_aversions: aversions,
      notes: notes.trim() || null,
    });

    // Update streak
    await supabase.rpc('increment_streak', { p_user_id: user.id, p_streak_type: 'checkin' });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setSaving(false);

    const newCount = logCount + 1;
    setLogCount(newCount);
    if (newCount >= 7) fetchInsight(user.id);
  }

  function toggleAversion(a: string) {
    Haptics.selectionAsync();
    setAversions(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  const sliderLabel = (v: number) => ['', 'None', 'Mild', 'Moderate', 'Significant', 'Severe'][v] ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.screenTitle}>Symptom Tracker</Text>
        <Text style={styles.sub}>How are you feeling today? This helps Nori adjust your meals.</Text>

        {/* AI Insight Card */}
        {logCount >= 7 && (
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>🧠 AI Insight</Text>
            {loadingInsight ? (
              <ActivityIndicator color={Colors.primary} />
            ) : insight ? (
              <>
                <Text style={styles.insightText}>{insight.adjustment}</Text>
                <Text style={styles.insightReason}>{insight.reason}</Text>
              </>
            ) : (
              <Text style={styles.insightEmpty}>Insight will appear after 7 days of data.</Text>
            )}
          </View>
        )}

        {saved ? (
          <View style={styles.savedCard}>
            <Text style={styles.savedIcon}>✅</Text>
            <Text style={styles.savedTitle}>Logged!</Text>
            <Text style={styles.savedSub}>
              {logCount >= 7
                ? 'Nori is analyzing your patterns.'
                : `${7 - logCount} more days until your first AI insight.`}
            </Text>
            <TouchableOpacity onPress={() => setSaved(false)} style={styles.logAgainBtn} activeOpacity={0.75}>
              <Text style={styles.logAgainText}>Log another day</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Symptom sliders */}
            {[
              { label: 'Nausea', value: nausea, onChange: (v: number) => { setNausea(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } },
              { label: 'Constipation', value: constipation, onChange: (v: number) => { setConstipation(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } },
              { label: 'Fatigue', value: fatigue, onChange: (v: number) => { setFatigue(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } },
            ].map(({ label, value, onChange }) => (
              <View key={label} style={styles.sliderCard}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderLabel}>{label}</Text>
                  <Text style={styles.sliderValue}>{sliderLabel(value)}</Text>
                </View>
                <Slider
                  minimumValue={1}
                  maximumValue={5}
                  step={1}
                  value={value}
                  onValueChange={onChange}
                  minimumTrackTintColor={Colors.accent}
                  maximumTrackTintColor={Colors.border}
                  thumbTintColor={Colors.accent}
                  style={{ height: 36 }}
                />
                <View style={styles.sliderTicks}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <Text key={n} style={[styles.tick, value === n && styles.tickActive]}>{n}</Text>
                  ))}
                </View>
              </View>
            ))}

            {/* Food aversions */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Food Aversions Today</Text>
              <Text style={styles.cardSub}>What doesn't appeal to you right now?</Text>
              <View style={styles.tags}>
                {AVERSION_OPTIONS.map(a => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.tag, aversions.includes(a) && styles.tagSelected]}
                    onPress={() => toggleAversion(a)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.tagText, aversions.includes(a) && styles.tagTextSelected]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Notes (optional)</Text>
              <TextInput
                style={styles.input}
                value={notes}
                onChangeText={setNotes}
                placeholder="Anything else Nori should know?"
                placeholderTextColor={Colors.mutedForeground}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnLoading]}
              onPress={save}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color={Colors.primaryForeground} />
                : <Text style={styles.saveBtnText}>Log symptoms ✓</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing['3xl'], gap: Spacing.lg },
  screenTitle: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground },
  sub: { fontSize: FontSize.sm, color: Colors.mutedForeground, lineHeight: 22 },
  insightCard: { padding: Spacing.xl, borderRadius: Radius.xl, backgroundColor: 'rgba(138,154,124,0.1)', borderWidth: 1.5, borderColor: 'rgba(138,154,124,0.3)', gap: Spacing.sm },
  insightLabel: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.secondary, letterSpacing: 0.5 },
  insightText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-SemiBold', color: Colors.foreground, lineHeight: 24 },
  insightReason: { fontSize: FontSize.sm, color: Colors.mutedForeground, lineHeight: 20 },
  insightEmpty: { fontSize: FontSize.sm, color: Colors.mutedForeground },
  savedCard: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border },
  savedIcon: { fontSize: 48 },
  savedTitle: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground },
  savedSub: { fontSize: FontSize.base, color: Colors.mutedForeground, textAlign: 'center', lineHeight: 24 },
  logAgainBtn: { paddingHorizontal: Spacing.xl, paddingVertical: 12, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  logAgainText: { fontSize: FontSize.sm, color: Colors.mutedForeground, fontFamily: 'PlusJakartaSans-SemiBold' },
  sliderCard: { padding: Spacing.xl, borderRadius: Radius.xl, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sliderLabel: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold', color: Colors.foreground },
  sliderValue: { fontSize: FontSize.sm, color: Colors.accent, fontFamily: 'PlusJakartaSans-SemiBold' },
  sliderTicks: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  tick: { fontSize: FontSize.xs, color: Colors.mutedForeground, width: 20, textAlign: 'center' },
  tickActive: { color: Colors.accent, fontFamily: 'PlusJakartaSans-Bold' },
  card: { padding: Spacing.xl, borderRadius: Radius.xl, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  cardTitle: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold', color: Colors.foreground },
  cardSub: { fontSize: FontSize.sm, color: Colors.mutedForeground },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.muted },
  tagSelected: { borderColor: Colors.accent, backgroundColor: 'rgba(216,127,99,0.12)' },
  tagText: { fontSize: FontSize.sm, color: Colors.foreground },
  tagTextSelected: { color: Colors.accent, fontFamily: 'PlusJakartaSans-SemiBold' },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg, color: Colors.foreground, fontSize: FontSize.base, backgroundColor: Colors.muted, minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 18, alignItems: 'center' },
  saveBtnLoading: { opacity: 0.7 },
  saveBtnText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primaryForeground },
});
