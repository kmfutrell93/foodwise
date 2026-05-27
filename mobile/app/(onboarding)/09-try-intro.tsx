import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

const STEPS = [
  { num: '1', label: 'Diet needs' },
  { num: '2', label: 'Budget' },
  { num: '3', label: 'Appetite' },
];

export default function TryIntro() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();

  return (
    <OnboardingShell step={9}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Big Nori centered */}
        <View style={s.noriWrap}>
          <Image
            source={require('@/assets/images/nori_character.png')}
            style={s.nori}
            resizeMode="contain"
          />
        </View>

        <Text style={s.label}>Time to try it</Text>
        <Text style={s.title}>
          Let's build your{'\n'}<Text style={s.titleHighlight}>first meal plan</Text>{'\n'}together!
        </Text>
        <Text style={s.sub}>
          I'll ask you 3 quick questions, then show you a real personalized plan. Takes about 60 seconds.
        </Text>

        {/* Horizontal step connector */}
        <View style={s.stepsRow}>
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.num}>
              <View style={s.stepItem}>
                <View style={[s.stepCircle, idx === 0 && s.stepCircleActive]}>
                  <Text style={[s.stepNum, idx === 0 && s.stepNumActive]}>{step.num}</Text>
                </View>
                <Text style={[s.stepLabel, idx === 0 && s.stepLabelActive]}>{step.label}</Text>
              </View>
              {idx < STEPS.length - 1 && <View style={s.connector} />}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
      <View style={s.footer}>
        <Button label="Let's go!" onPress={() => router.push('/(onboarding)/10-restrictions')} />
        <Text style={s.note}>You can always update your preferences later</Text>
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    content: { paddingTop: Spacing.md, paddingBottom: Spacing.md },
    footer: { paddingTop: Spacing.md, paddingBottom: Spacing.xl },

    noriWrap: { alignItems: 'center', marginBottom: Spacing['2xl'] },
    nori: { width: 160, height: 160 },

    label: {
      fontSize: FontSize.sm,
      fontFamily: 'PlusJakartaSans-Bold',
      color: c.primary,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: Spacing.md,
      textAlign: 'center',
    },
    title: {
      fontSize: FontSize['3xl'],
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.foreground,
      lineHeight: 38,
      marginBottom: Spacing.md,
      textAlign: 'center',
    },
    titleHighlight: { color: c.primary },
    sub: {
      fontSize: FontSize.base,
      color: c.mutedForeground,
      lineHeight: 24,
      textAlign: 'center',
      marginBottom: Spacing['2xl'],
    },

    stepsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'center',
      marginBottom: Spacing['2xl'],
    },
    stepItem: { alignItems: 'center', gap: 8 },
    stepCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepCircleActive: { backgroundColor: c.primary },
    stepNum: {
      fontSize: FontSize.lg,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.mutedForeground,
    },
    stepNumActive: { color: c.primaryForeground },
    stepLabel: {
      fontSize: FontSize.xs,
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: c.mutedForeground,
      textAlign: 'center',
    },
    stepLabelActive: { color: c.foreground },
    connector: {
      flex: 1,
      height: 2,
      backgroundColor: c.border,
      marginTop: 23,
      marginHorizontal: 4,
    },

    note: {
      fontSize: FontSize.xs,
      color: c.mutedForeground,
      textAlign: 'center',
      marginTop: Spacing.md,
    },
  });
}
