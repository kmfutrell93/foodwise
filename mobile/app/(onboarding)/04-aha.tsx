import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

const LOSSES = [
  { icon: '💪', label: 'Your strength & metabolism' },
  { icon: '⚡', label: 'Your energy and vitality' },
  { icon: '📉', label: 'The gains you worked for' },
];

export default function AhaStat() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();

  return (
    <OnboardingShell step={4} screenKey="04-aha" skipRoute="/(onboarding)/10-restrictions">
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Stat block */}
        <View style={s.statSection}>
          <Text style={s.label}>Surprising fact</Text>
          <Text style={s.statNum}>30%</Text>
          <Text style={s.statLine1}>of the weight you lose{'\n'}on GLP-1 medication</Text>
          <Text style={s.statLine2}>is muscle — not fat.</Text>
        </View>

        {/* What you lose card */}
        <View style={s.lossCard}>
          <Text style={s.lossTitle}>That means you&apos;re losing...</Text>
          {LOSSES.map(item => (
            <View key={item.label} style={s.lossRow}>
              <View style={s.lossCircle}>
                <Text style={s.lossIcon}>{item.icon}</Text>
              </View>
              <Text style={s.lossLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Nori green card */}
        <View style={s.noriCard}>
          <Image
            source={require('@/assets/images/nori_character.png')}
            style={s.noriImg}
            resizeMode="contain"
          />
          <Text style={s.noriQuote}>
            &quot;But with the right food plan? You can preserve{' '}
            <Text style={s.noriHighlight}>100% of that muscle</Text> while still losing fat.&quot;
          </Text>
        </View>

        <Text style={s.citation}>Source: NEJM GLP-1 muscle preservation study, 2024</Text>
      </ScrollView>
      <View style={s.footer}>
        <Button label="This can't happen to me" onPress={() => router.push('/(onboarding)/05-question1')} />
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    content: { paddingTop: Spacing.md, paddingBottom: Spacing.md, alignItems: 'center' },
    footer: { paddingTop: Spacing.md, paddingBottom: Spacing.xl },

    statSection: { alignItems: 'center', marginBottom: Spacing['2xl'], width: '100%' },
    label: {
      fontSize: FontSize.sm,
      fontFamily: 'PlusJakartaSans-Bold',
      color: c.mutedForeground,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: Spacing.lg,
    },
    statNum: {
      fontSize: 96,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.destructive,
      lineHeight: 96,
      marginBottom: Spacing.sm,
    },
    statLine1: {
      fontSize: FontSize.xl,
      fontFamily: 'PlusJakartaSans-Bold',
      color: c.foreground,
      textAlign: 'center',
      lineHeight: 28,
      marginBottom: 4,
    },
    statLine2: {
      fontSize: FontSize['2xl'],
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.accent,
    },

    lossCard: {
      width: '100%',
      padding: Spacing['2xl'],
      borderRadius: Radius.xl,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      gap: Spacing.md,
      marginBottom: Spacing['2xl'],
      alignSelf: 'stretch',
    },
    lossTitle: {
      fontSize: FontSize.sm,
      fontFamily: 'PlusJakartaSans-Bold',
      color: c.mutedForeground,
      marginBottom: 4,
    },
    lossRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    lossCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(29,158,117,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    lossIcon: { fontSize: 14 },
    lossLabel: {
      fontSize: FontSize.sm,
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: c.foreground,
    },

    noriCard: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
      padding: Spacing.lg,
      borderRadius: Radius.xl,
      backgroundColor: 'rgba(29,158,117,0.10)',
      borderWidth: 1,
      borderColor: 'rgba(29,158,117,0.25)',
      marginBottom: Spacing['2xl'],
      alignSelf: 'stretch',
    },
    noriImg: { width: 40, height: 40 },
    noriQuote: {
      flex: 1,
      fontSize: FontSize.sm,
      fontFamily: 'PlusJakartaSans-Medium',
      color: c.foreground,
      lineHeight: 20,
    },
    noriHighlight: { color: c.secondary, fontFamily: 'PlusJakartaSans-Bold' },

    citation: {
      fontSize: FontSize.xs,
      color: c.mutedForeground,
      textAlign: 'center',
      marginTop: Spacing.md,
    },
  });
}
