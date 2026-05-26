import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';
import { useOnboarding } from '@/context/OnboardingContext';
import * as Haptics from 'expo-haptics';

const TIMES = ['06:00', '07:00', '08:00', '09:00', '10:00', '12:00'];
const TIME_LABELS: Record<string, string> = {
  '06:00': '6:00 AM', '07:00': '7:00 AM', '08:00': '8:00 AM',
  '09:00': '9:00 AM', '10:00': '10:00 AM', '12:00': '12:00 PM',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MEDICATIONS = [
  { value: 'ozempic', label: 'Ozempic', sub: 'Semaglutide (weekly)' },
  { value: 'wegovy', label: 'Wegovy', sub: 'Semaglutide (weekly)' },
  { value: 'mounjaro', label: 'Mounjaro', sub: 'Tirzepatide (weekly)' },
  { value: 'zepbound', label: 'Zepbound', sub: 'Tirzepatide (weekly)' },
  { value: 'other', label: 'Other / Not listed', sub: '' },
];

export default function Habit() {
  const router = useRouter();
  const { setField, saveStep } = useOnboarding();
  const [checkInTime, setCheckInTime] = useState('08:00');
  const [medication, setMedication] = useState<string | null>(null);
  const [injectionDay, setInjectionDay] = useState<number | null>(null);

  async function handleNext() {
    setField('check_in_time', checkInTime);
    setField('medication', medication as any);
    setField('injection_day', injectionDay);
    await saveStep(17);
    router.push('/(onboarding)/18-commitment');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Daily habit</Text>
        <Text style={styles.title}>Just 2 minutes{'\n'}a day with Nori.</Text>

        <Text style={styles.sectionTitle}>When should Nori check in with you?</Text>
        <View style={styles.timeGrid}>
          {TIMES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.timeChip, checkInTime === t && styles.timeChipSelected]}
              onPress={() => { setCheckInTime(t); Haptics.selectionAsync(); }}
              activeOpacity={0.75}
            >
              <Text style={[styles.timeText, checkInTime === t && styles.timeTextSelected]}>{TIME_LABELS[t]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Which GLP-1 medication are you on?</Text>
        <View style={styles.medList}>
          {MEDICATIONS.map((m) => (
            <TouchableOpacity
              key={m.value}
              style={[styles.medCard, medication === m.value && styles.medCardSelected]}
              onPress={() => { setMedication(m.value); Haptics.selectionAsync(); }}
              activeOpacity={0.75}
            >
              <Text style={[styles.medLabel, medication === m.value && styles.medLabelSelected]}>{m.label}</Text>
              {m.sub ? <Text style={styles.medSub}>{m.sub}</Text> : null}
            </TouchableOpacity>
          ))}
        </View>

        {medication && medication !== 'other' && (
          <>
            <Text style={styles.sectionTitle}>Which day do you inject?</Text>
            <View style={styles.dayRow}>
              {DAYS.map((day, idx) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, injectionDay === idx && styles.dayChipSelected]}
                  onPress={() => { setInjectionDay(idx); Haptics.selectionAsync(); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dayText, injectionDay === idx && styles.dayTextSelected]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: Spacing.xl }} />
        <Button label="Continue" onPress={handleNext} disabled={!medication} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing['3xl'], paddingBottom: Spacing['3xl'] },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 38, marginBottom: Spacing['2xl'] },
  sectionTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
  timeChip: { paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card },
  timeChipSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(232,157,53,0.12)' },
  timeText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: Colors.foreground },
  timeTextSelected: { color: Colors.primary },
  medList: { gap: Spacing.sm, marginBottom: Spacing['2xl'] },
  medCard: { padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card },
  medCardSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(232,157,53,0.08)' },
  medLabel: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-SemiBold', color: Colors.foreground },
  medLabelSelected: { color: Colors.primary },
  medSub: { fontSize: FontSize.sm, color: Colors.mutedForeground, marginTop: 2 },
  dayRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing['2xl'] },
  dayChip: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card },
  dayChipSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(232,157,53,0.12)' },
  dayText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', color: Colors.mutedForeground },
  dayTextSelected: { color: Colors.primary },
});
