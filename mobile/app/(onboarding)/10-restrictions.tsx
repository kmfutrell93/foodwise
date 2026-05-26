import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';
import { useOnboarding } from '@/context/OnboardingContext';
import * as Haptics from 'expo-haptics';

const restrictions = [
  { key: 'gluten-free', label: '🌾 Gluten-Free' },
  { key: 'dairy-free', label: '🥛 Dairy-Free' },
  { key: 'high-protein', label: '🥩 High Protein' },
  { key: 'vegetarian', label: '🌱 Vegetarian' },
  { key: 'vegan', label: '🌿 Vegan' },
  { key: 'nut-free', label: '🥜 Nut-Free' },
  { key: 'pescatarian', label: '🐟 Pescatarian' },
  { key: 'low-fodmap', label: '🔥 Low FODMAP' },
  { key: 'keto', label: '🥑 Keto' },
  { key: 'paleo', label: '🦴 Paleo' },
];

export default function Restrictions() {
  const router = useRouter();
  const { setField, saveStep } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);
  const [noneSelected, setNoneSelected] = useState(false);

  function toggle(key: string) {
    Haptics.selectionAsync();
    setNoneSelected(false);
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  function selectNone() {
    Haptics.selectionAsync();
    setSelected([]);
    setNoneSelected(true);
  }

  async function handleNext() {
    setField('dietary_restrictions', selected);
    await saveStep(10);
    router.push('/(onboarding)/11-budget');
  }

  return (
    <OnboardingShell step={10}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Dietary needs</Text>
        <Text style={styles.title}>Any dietary{'\n'}restrictions?</Text>
        <Text style={styles.sub}>Select all that apply. We'll exclude these from every meal.</Text>

        <View style={styles.tags}>
          {restrictions.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[styles.tag, selected.includes(r.key) && styles.tagSelected]}
              onPress={() => toggle(r.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tagText, selected.includes(r.key) && styles.tagTextSelected]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.tag, styles.tagNone, noneSelected && styles.tagSelected]}
            onPress={selectNone}
            activeOpacity={0.75}
          >
            <Text style={[styles.tagText, noneSelected && styles.tagTextSelected]}>✓ No restrictions</Text>
          </TouchableOpacity>
        </View>

        <Button label="Continue" onPress={handleNext} />
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: Spacing.lg, paddingBottom: Spacing['3xl'], gap: 0 },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 38, marginBottom: Spacing.sm },
  sub: { fontSize: FontSize.sm, color: Colors.mutedForeground, marginBottom: Spacing['2xl'] },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
  tag: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tagNone: { borderStyle: 'dashed' },
  tagSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(232,157,53,0.12)' },
  tagText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: Colors.foreground },
  tagTextSelected: { color: Colors.primary },
});
