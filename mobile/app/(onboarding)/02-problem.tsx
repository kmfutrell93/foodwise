import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

const PROBLEMS = [
  {
    icon: '⚡',
    iconBg: 'rgba(232,157,53,0.15)',
    iconColor: 'primary' as const,
    title: 'Appetite is suppressed',
    sub: 'You eat less food than your body needs',
  },
  {
    icon: '🛡️',
    iconBg: 'rgba(216,127,99,0.15)',
    iconColor: 'accent' as const,
    title: 'Nutrients go missing',
    sub: 'Protein, fiber & micronutrients fall short',
  },
  {
    icon: '💪',
    iconBg: 'rgba(138,154,124,0.15)',
    iconColor: 'secondary' as const,
    title: 'Muscle starts to fade',
    sub: 'Your body breaks down lean mass for energy',
  },
];

export default function Problem() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();

  const iconColor = { primary: colors.primary, accent: colors.accent, secondary: colors.secondary };

  return (
    <OnboardingShell step={2} skipRoute="/(onboarding)/10-restrictions">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* Nori says card */}
        <View style={s.noriCard}>
          <Image
            source={require('@/assets/images/nori_character.png')}
            style={s.noriImg}
            resizeMode="contain"
          />
          <View style={s.noriText}>
            <Text style={s.noriLabel}>Nori says</Text>
            <Text style={s.noriQuote}>"There's something most GLP-1 users don't realize..."</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={s.title}>
          You're eating less.{'\n'}
          <Text style={s.titleHighlight}>But is your body{'\n'}getting what it needs?</Text>
        </Text>

        {/* Subtitle */}
        <Text style={s.sub}>
          GLP-1 medications suppress your appetite — but they can't tell the difference between{' '}
          <Text style={s.emphasisStrong}>healthy restriction</Text> and{' '}
          <Text style={s.emphasisAccent}>dangerous deficiency.</Text>
        </Text>

        {/* Problem cards */}
        <View style={s.cards}>
          {PROBLEMS.map(p => (
            <View key={p.title} style={s.card}>
              <View style={[s.iconCircle, { backgroundColor: p.iconBg }]}>
                <Text style={[s.iconEmoji, { color: iconColor[p.iconColor] }]}>{p.icon}</Text>
              </View>
              <View style={s.cardText}>
                <Text style={s.cardTitle}>{p.title}</Text>
                <Text style={s.cardSub}>{p.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <Button label="I want to know more" onPress={() => router.push('/(onboarding)/03-solution')} />
      </ScrollView>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    content: { paddingTop: Spacing.md, paddingBottom: Spacing['2xl'] },

    noriCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.lg,
      borderRadius: Radius.xl,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: Spacing['2xl'],
    },
    noriImg: { width: 48, height: 48 },
    noriText: { flex: 1 },
    noriLabel: {
      fontSize: FontSize.xs,
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: c.mutedForeground,
      marginBottom: 2,
    },
    noriQuote: {
      fontSize: FontSize.sm,
      fontFamily: 'PlusJakartaSans-Medium',
      color: c.foreground,
    },

    title: {
      fontSize: FontSize['3xl'],
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.foreground,
      lineHeight: 38,
      marginBottom: Spacing.md,
    },
    titleHighlight: { color: c.primary },

    sub: {
      fontSize: FontSize.base,
      color: c.mutedForeground,
      lineHeight: 24,
      marginBottom: Spacing['2xl'],
    },
    emphasisStrong: { color: c.foreground, fontFamily: 'PlusJakartaSans-SemiBold' },
    emphasisAccent: { color: c.accent, fontFamily: 'PlusJakartaSans-SemiBold' },

    cards: { gap: Spacing.sm, marginBottom: Spacing['2xl'] },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
      padding: Spacing.lg,
      borderRadius: Radius.xl,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: Radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    iconEmoji: { fontSize: 20 },
    cardText: { flex: 1 },
    cardTitle: {
      fontSize: FontSize.sm,
      fontFamily: 'PlusJakartaSans-Bold',
      color: c.foreground,
    },
    cardSub: { fontSize: FontSize.xs, color: c.mutedForeground, marginTop: 2 },
  });
}
