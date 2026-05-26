import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import { getDoseOptions } from '@/lib/escalation';
import * as Haptics from 'expo-haptics';

type Medication = 'semaglutide' | 'tirzepatide' | 'liraglutide' | 'other';
type InjectionDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type CheckInTime = 'morning' | 'midday' | 'evening';

const MEDICATIONS: { value: Medication; label: string; sub: string; badge?: string }[] = [
  { value: 'semaglutide', label: 'Ozempic / Wegovy', sub: 'Semaglutide · GLP-1' },
  { value: 'tirzepatide', label: 'Mounjaro / Zepbound', sub: 'Tirzepatide · GLP-1 / GIP', badge: 'More intense nausea in weeks 1–8' },
  { value: 'liraglutide', label: 'Saxenda / Victoza', sub: 'Liraglutide · GLP-1' },
  { value: 'other', label: 'Other / Not sure', sub: '' },
];

const DAYS: InjectionDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<InjectionDay, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

const CHECK_IN_TIMES: { value: CheckInTime; label: string; icon: string }[] = [
  { value: 'morning', label: 'Morning', icon: '🌅' },
  { value: 'midday', label: 'Midday', icon: '☀️' },
  { value: 'evening', label: 'Evening', icon: '🌙' },
];

const TIME_ON_MED_OPTIONS: { value: string; label: string }[] = [
  { value: 'less_than_1_month', label: 'Less than 1 month' },
  { value: '1_3_months', label: '1–3 months' },
  { value: '3_6_months', label: '3–6 months' },
  { value: '6_plus_months', label: '6+ months' },
];

// Rough dose_start_date offset by time_on_medication bucket
const TIME_ON_MED_DAYS: Record<string, number> = {
  less_than_1_month: 14,
  '1_3_months': 60,
  '3_6_months': 120,
  '6_plus_months': 200,
};

export default function Habit() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const { setField, saveStep } = useOnboarding();
  const [medication, setMedication] = useState<Medication | null>(null);
  const [injectionDay, setInjectionDay] = useState<InjectionDay | null>(null);
  const [checkInTime, setCheckInTime] = useState<CheckInTime | null>(null);
  const [doseMg, setDoseMg] = useState<number | null>(null);
  const [timeOnMed, setTimeOnMed] = useState<string | null>(null);

  const doseOptions = medication ? getDoseOptions(medication) : [];
  const showDosePicker = doseOptions.length > 1;

  const canProceed = medication !== null && injectionDay !== null && checkInTime !== null;

  async function handleNext() {
    if (!canProceed) return;
    setField('medication', medication!);
    setField('injection_day', injectionDay!);
    setField('check_in_time', checkInTime!);

    if (doseMg !== null) {
      setField('dose_mg' as any, doseMg);
    }
    if (timeOnMed) {
      setField('time_on_medication' as any, timeOnMed);
      // Derive an approximate dose_start_date from the time bucket
      const daysAgo = TIME_ON_MED_DAYS[timeOnMed] ?? 14;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      setField('dose_start_date' as any, startDate.toISOString().split('T')[0]);
    }

    await saveStep(17);
    router.push('/(onboarding)/18-commitment');
  }

  function select<T>(setter: (v: T) => void, value: T) {
    setter(value);
    Haptics.selectionAsync();
  }

  return (
    <OnboardingShell step={17}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <Text style={s.label}>Medication</Text>
        <Text style={s.title}>Your GLP-1{'\n'}details.</Text>
        <Text style={s.sub}>This powers injection-day meal adjustments — the most important part of your plan.</Text>

        <Text style={s.sectionTitle}>Which medication?</Text>
        <View style={s.medGrid}>
          {MEDICATIONS.map(med => (
            <TouchableOpacity
              key={med.value}
              style={[s.medCard, medication === med.value && s.medCardSelected]}
              onPress={() => { select(setMedication, med.value); setDoseMg(null); }}
              activeOpacity={0.75}
            >
              <Text style={[s.medLabel, medication === med.value && s.medLabelSelected]}>{med.label}</Text>
              {med.sub ? <Text style={s.medSub}>{med.sub}</Text> : null}
              {med.badge && medication === med.value ? (
                <View style={s.medBadge}>
                  <Text style={s.medBadgeText}>⚠️ {med.badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        {showDosePicker && (
          <>
            <Text style={s.sectionTitle}>Current dose</Text>
            <View style={s.doseGrid}>
              {doseOptions.map(dose => (
                <TouchableOpacity
                  key={dose}
                  style={[s.doseChip, doseMg === dose && s.doseChipSelected]}
                  onPress={() => select(setDoseMg, dose)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.doseChipText, doseMg === dose && s.doseChipTextSelected]}>
                    {dose} mg
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[s.doseChip, doseMg === null && s.doseChipSelected]}
                onPress={() => select(setDoseMg, null)}
                activeOpacity={0.75}
              >
                <Text style={[s.doseChipText, doseMg === null && s.doseChipTextSelected]}>Not sure</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <Text style={s.sectionTitle}>How long have you been on it?</Text>
        <View style={s.timeOnMedGrid}>
          {TIME_ON_MED_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[s.timeOnMedChip, timeOnMed === opt.value && s.timeOnMedChipSelected]}
              onPress={() => select(setTimeOnMed, opt.value)}
              activeOpacity={0.75}
            >
              <Text style={[s.timeOnMedText, timeOnMed === opt.value && s.timeOnMedTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>Injection day</Text>
        <View style={s.daysRow}>
          {DAYS.map(day => (
            <TouchableOpacity
              key={day}
              style={[s.dayBtn, injectionDay === day && s.dayBtnSelected]}
              onPress={() => select(setInjectionDay, day)}
              activeOpacity={0.75}
            >
              <Text style={[s.dayText, injectionDay === day && s.dayTextSelected]}>{DAY_LABELS[day]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>Best time to check in?</Text>
        <View style={s.timeRow}>
          {CHECK_IN_TIMES.map(t => (
            <TouchableOpacity
              key={t.value}
              style={[s.timeBtn, checkInTime === t.value && s.timeBtnSelected]}
              onPress={() => select(setCheckInTime, t.value)}
              activeOpacity={0.75}
            >
              <Text style={s.timeIcon}>{t.icon}</Text>
              <Text style={[s.timeLabel, checkInTime === t.value && s.timeLabelSelected]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.spacer} />
        <Button label="Continue" onPress={handleNext} disabled={!canProceed} />
      </ScrollView>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    content: { paddingTop: Spacing.lg, paddingBottom: Spacing['3xl'] },
    label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: c.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
    title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, lineHeight: 38, marginBottom: Spacing.sm },
    sub: { fontSize: FontSize.sm, color: c.mutedForeground, lineHeight: 20, marginBottom: Spacing['2xl'] },
    sectionTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: c.foreground, marginBottom: Spacing.md, marginTop: Spacing.md },
    medGrid: { gap: Spacing.sm, marginBottom: Spacing.md },
    medCard: { padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.card },
    medCardSelected: { borderColor: c.primary, backgroundColor: 'rgba(232,157,53,0.08)' },
    medLabel: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold', color: c.foreground },
    medLabelSelected: { color: c.primary },
    medSub: { fontSize: FontSize.xs, color: c.mutedForeground, marginTop: 2 },
    medBadge: { marginTop: Spacing.sm, backgroundColor: 'rgba(232,157,53,0.15)', borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4, alignSelf: 'flex-start' },
    medBadgeText: { fontSize: FontSize.xs, color: c.primary, fontFamily: 'PlusJakartaSans-SemiBold' },
    doseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
    doseChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.card },
    doseChipSelected: { borderColor: c.primary, backgroundColor: 'rgba(232,157,53,0.12)' },
    doseChipText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: c.mutedForeground },
    doseChipTextSelected: { color: c.primary },
    timeOnMedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
    timeOnMedChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.card },
    timeOnMedChipSelected: { borderColor: c.primary, backgroundColor: 'rgba(232,157,53,0.12)' },
    timeOnMedText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: c.mutedForeground },
    timeOnMedTextSelected: { color: c.primary },
    daysRow: { flexDirection: 'row', gap: 6, marginBottom: Spacing.md },
    dayBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, alignItems: 'center' },
    dayBtnSelected: { borderColor: c.primary, backgroundColor: 'rgba(232,157,53,0.12)' },
    dayText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold', color: c.mutedForeground },
    dayTextSelected: { color: c.primary },
    timeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    timeBtn: { flex: 1, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, alignItems: 'center', gap: 4 },
    timeBtnSelected: { borderColor: c.primary, backgroundColor: 'rgba(232,157,53,0.12)' },
    timeIcon: { fontSize: 22 },
    timeLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold', color: c.mutedForeground },
    timeLabelSelected: { color: c.primary },
    spacer: { height: Spacing.xl },
  });
}
