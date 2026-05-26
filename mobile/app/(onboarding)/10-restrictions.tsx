import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';

const RESTRICTIONS = [
  'gluten-free','dairy-free','egg-free','nut-free','shellfish-free','soy-free',
  'vegetarian','vegan','pescatarian','low-fodmap','halal','kosher',
];
const LABELS: Record<string, string> = {
  'gluten-free':   '🌾 Gluten-Free',
  'dairy-free':    '🥛 Dairy-Free',
  'egg-free':      '🥚 Egg-Free',
  'nut-free':      '🥜 Nut-Free',
  'shellfish-free':'🦐 Shellfish-Free',
  'soy-free':      '🫘 Soy-Free',
  'vegetarian':    '🌱 Vegetarian',
  'vegan':         '🌿 Vegan',
  'pescatarian':   '🐟 Pescatarian',
  'low-fodmap':    '🫙 Low FODMAP',
  'halal':         '☪️ Halal',
  'kosher':        '✡️ Kosher',
};
const DESCRIPTIONS: Partial<Record<string, string>> = {
  'halal':  'No pork / alcohol',
  'kosher': 'No pork / shellfish',
};

export default function Restrictions() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const { setField, saveStep } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);
  const [noneSelected, setNoneSelected] = useState(false);

  function toggle(key: string) {
    Haptics.selectionAsync();
    setNoneSelected(false);
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  async function handleNext() {
    setField('dietary_restrictions', selected);
    await saveStep(10);
    router.push('/(onboarding)/10b-aversions');
  }

  return (
    <OnboardingShell step={10}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <Text style={s.label}>Step 1 of 3</Text>
        <Text style={s.title}>Any dietary{'\n'}<Text style={s.titleHighlight}>needs or restrictions?</Text></Text>
        <Text style={s.sub}>Select all that apply. Your plan will be built around these.</Text>
        <View style={s.tags}>
          {RESTRICTIONS.map(r => {
            const desc = DESCRIPTIONS[r];
            const sel = selected.includes(r);
            return (
              <TouchableOpacity
                key={r}
                style={[s.tag, desc && s.tagWithDesc, sel && s.tagSelected]}
                onPress={() => toggle(r)}
                activeOpacity={0.75}
              >
                <Text style={[s.tagText, sel && s.tagTextSelected]}>{LABELS[r]}</Text>
                {desc && (
                  <Text style={[s.tagDesc, sel && s.tagDescSelected]}>{desc}</Text>
                )}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[s.tag, s.tagNone, noneSelected && s.tagSelected]}
            onPress={() => { setSelected([]); setNoneSelected(true); Haptics.selectionAsync(); }}
            activeOpacity={0.75}
          >
            <Text style={[s.tagText, noneSelected && s.tagTextSelected]}>✅ No restrictions — surprise me!</Text>
          </TouchableOpacity>
        </View>

        {/* GLP-1 note */}
        <View style={s.note}>
          <Text style={s.noteIcon}>💉</Text>
          <Text style={s.noteText}>
            All meals are automatically optimized for GLP-1 users — small portions, high nutrient density, injection-day aware.
          </Text>
        </View>

        <Button label="Next: Set my budget" onPress={handleNext} />
      </ScrollView>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
  content: { paddingTop: Spacing.lg, paddingBottom: Spacing['3xl'] },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: c.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, lineHeight: 32, marginBottom: Spacing.sm },
  titleHighlight: { color: c.primary },
  sub: { fontSize: FontSize.sm, color: c.mutedForeground, marginBottom: Spacing['2xl'] },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
  tag: { paddingHorizontal: Spacing.lg, paddingVertical: 12, borderRadius: Radius.full, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.card },
  tagWithDesc: { borderRadius: Radius.lg, paddingVertical: 8 },
  tagNone: { borderStyle: 'dashed' },
  tagSelected: { borderColor: c.primary, backgroundColor: 'rgba(232,157,53,0.12)' },
  tagText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: c.foreground },
  tagTextSelected: { color: c.primary },
  tagDesc: { fontSize: 10, color: c.mutedForeground, marginTop: 1 },
  tagDescSelected: { color: c.primary + 'CC' },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: c.muted,
    marginBottom: Spacing['2xl'],
  },
  noteIcon: { fontSize: 16, marginTop: 1 },
  noteText: { flex: 1, fontSize: FontSize.xs, color: c.mutedForeground, lineHeight: 18 },
});
}
