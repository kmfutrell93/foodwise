import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';

type Struggle = 'protein' | 'nausea' | 'confusion' | 'muscle';

const OPTIONS: {
  value: Struggle;
  icon: string;
  iconBg: string;
  iconColor: 'primary' | 'accent' | 'secondary' | 'destructive';
  label: string;
  sub: string;
}[] = [
  {
    value: 'protein',
    icon: '🥩',
    iconBg: 'rgba(29,158,117,0.15)',
    iconColor: 'primary',
    label: 'Not eating enough protein',
    sub: 'Appetite is too low to hit my goals',
  },
  {
    value: 'nausea',
    icon: '🤢',
    iconBg: 'rgba(29,158,117,0.15)',
    iconColor: 'accent',
    label: 'Nausea & food aversions',
    sub: 'Many foods make me feel sick',
  },
  {
    value: 'confusion',
    icon: '🤷',
    iconBg: 'rgba(29,158,117,0.15)',
    iconColor: 'secondary',
    label: 'Not knowing what to eat',
    sub: 'No guidance for GLP-1 specific meals',
  },
  {
    value: 'muscle',
    icon: '💪',
    iconBg: 'rgba(29,158,117,0.15)',
    iconColor: 'destructive',
    label: 'Losing energy & strength',
    sub: 'I feel weaker than before',
  },
];

export default function Question1() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const { setField, saveStep } = useOnboarding();
  const [selected, setSelected] = useState<Struggle | null>(null);

  async function handleNext() {
    if (!selected) return;
    setField('primary_struggle', selected);
    await saveStep(5);
    router.push('/(onboarding)/06-mirror1');
  }

  const iconColors = {
    primary: colors.primary,
    accent: colors.accent,
    secondary: colors.secondary,
    destructive: colors.destructive,
  };

  return (
    <OnboardingShell
      step={5}
      centerLabel="Question 1 of 2"
      skipRoute="/(onboarding)/10-restrictions"
    >
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Nori speech bubble */}
        <View style={s.noriRow}>
          <Image
            source={require('@/assets/images/nori_character.png')}
            style={s.noriImg}
            resizeMode="contain"
          />
          <View style={s.bubble}>
            <Text style={s.bubbleText}>Tell me about your experience — I want to help you specifically.</Text>
          </View>
        </View>

        <Text style={s.title}>
          What's your biggest{'\n'}struggle since starting{'\n'}<Text style={s.titleHighlight}>GLP-1 medication?</Text>
        </Text>
        <Text style={s.hint}>Select the one that resonates most.</Text>

        <View style={s.options}>
          {OPTIONS.map(opt => {
            const isSelected = selected === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[s.card, isSelected && s.cardSelected]}
                onPress={() => { setSelected(opt.value); Haptics.selectionAsync(); }}
                activeOpacity={0.75}
              >
                <View style={[s.iconCircle, { backgroundColor: opt.iconBg }]}>
                  <Text style={{ fontSize: 20, color: iconColors[opt.iconColor] }}>{opt.icon}</Text>
                </View>
                <View style={s.cardText}>
                  <Text style={[s.cardLabel, isSelected && s.cardLabelSelected]}>{opt.label}</Text>
                  <Text style={s.cardSub}>{opt.sub}</Text>
                </View>
                <View style={[s.radio, isSelected && s.radioSelected]}>
                  {isSelected && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <View style={s.footer}>
        <Button label="Continue" onPress={handleNext} disabled={!selected} />
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    content: { paddingTop: Spacing.md, paddingBottom: Spacing.md },
    footer: { paddingTop: Spacing.md, paddingBottom: Spacing.xl },

    noriRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing['2xl'] },
    noriImg: { width: 48, height: 48 },
    bubble: {
      flex: 1,
      padding: Spacing.lg,
      borderRadius: Radius.xl,
      borderTopLeftRadius: 4,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    bubbleText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Medium', color: c.foreground },

    title: {
      fontSize: FontSize['2xl'],
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.foreground,
      lineHeight: 32,
      marginBottom: Spacing.sm,
    },
    titleHighlight: { color: c.primary },
    hint: { fontSize: FontSize.sm, color: c.mutedForeground, marginBottom: Spacing['2xl'] },

    options: { gap: Spacing.sm },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.lg,
      borderRadius: Radius.xl,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    cardSelected: { borderColor: c.primary, backgroundColor: 'rgba(29,158,117,0.08)' },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: Radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    cardText: { flex: 1 },
    cardLabel: {
      fontSize: FontSize.sm,
      fontFamily: 'PlusJakartaSans-Bold',
      color: c.foreground,
    },
    cardLabelSelected: { color: c.primary },
    cardSub: { fontSize: FontSize.xs, color: c.mutedForeground, marginTop: 2 },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: { backgroundColor: c.primary, borderColor: c.primary },
    radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.primaryForeground },
  });
}
