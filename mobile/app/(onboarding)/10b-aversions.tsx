import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';

const AVERSIONS: { key: string; label: string }[] = [
  { key: 'greasy/fried foods', label: '🍟 Fried / Greasy' },
  { key: 'red meat', label: '🥩 Red Meat' },
  { key: 'eggs', label: '🍳 Eggs' },
  { key: 'dairy', label: '🧀 Dairy' },
  { key: 'fish/seafood', label: '🐟 Fish & Seafood' },
  { key: 'cruciferous veggies', label: '🥦 Cruciferous Veggies' },
  { key: 'spicy foods', label: '🌶️ Spicy Foods' },
  { key: 'beans/legumes', label: '🫘 Beans & Legumes' },
  { key: 'strong smells', label: '🧄 Strong Smells' },
  { key: 'sweet foods', label: '🍬 Sweet Foods' },
  { key: 'carbonated drinks', label: '🫧 Carbonated Drinks' },
  { key: 'raw foods', label: '🥗 Raw / Cold Foods' },
];

export default function Aversions() {
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
    setField('food_aversions', selected);
    await saveStep(12, { food_aversions: selected }); // → 11-budget
    router.push('/(onboarding)/11-budget');
  }

  return (
    <OnboardingShell step={10} screenKey="10b-aversions">
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>Food aversions</Text>
        <Text style={s.title}>Anything that makes{'\n'}your stomach turn?</Text>
        <Text style={s.sub}>GLP-1 medications can intensify food reactions. We&apos;ll avoid these in your plan.</Text>

        <View style={s.tags}>
          {AVERSIONS.map(a => (
            <TouchableOpacity
              key={a.key}
              style={[s.tag, selected.includes(a.key) && s.tagSelected]}
              onPress={() => toggle(a.key)}
              activeOpacity={0.75}
            >
              <Text style={[s.tagText, selected.includes(a.key) && s.tagTextSelected]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[s.tag, s.tagNone, noneSelected && s.tagSelected]}
            onPress={() => { setSelected([]); setNoneSelected(true); Haptics.selectionAsync(); }}
            activeOpacity={0.75}
          >
            <Text style={[s.tagText, noneSelected && s.tagTextSelected]}>✓ Nothing bothers me</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <View style={s.footer}>
        <Button label="Continue" onPress={handleNext} />
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    content: { paddingTop: Spacing.lg, paddingBottom: Spacing.md },
    footer: { paddingTop: Spacing.md, paddingBottom: Spacing.xl },
    label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: c.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
    title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, lineHeight: 38, marginBottom: Spacing.sm },
    sub: { fontSize: FontSize.sm, color: c.mutedForeground, marginBottom: Spacing['2xl'], lineHeight: 20 },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
    tag: { paddingHorizontal: Spacing.lg, paddingVertical: 12, borderRadius: Radius.full, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.card },
    tagNone: { borderStyle: 'dashed' },
    tagSelected: { borderColor: c.primary, backgroundColor: 'rgba(29,158,117,0.12)' },
    tagText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: c.foreground },
    tagTextSelected: { color: c.primary },
  });
}
