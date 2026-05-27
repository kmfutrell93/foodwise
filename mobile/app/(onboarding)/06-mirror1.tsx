import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

type Struggle = 'protein' | 'nausea' | 'confusion' | 'muscle';

const COPY: Record<Struggle, {
  headline: string;
  pct: number;
  statText: string;
  reassurance: string;
}> = {
  protein: {
    headline: '"Not hitting my protein" is the #1 challenge for GLP-1 users.',
    pct: 78,
    statText: 'of GLP-1 users struggle to hit their daily protein goal due to appetite suppression.',
    reassurance: "You're not failing. The medication itself makes protein goals harder. FoodWise was built to solve exactly this.",
  },
  nausea: {
    headline: 'Nausea on injection day affects your whole week — not just one meal.',
    pct: 65,
    statText: 'of GLP-1 users report that nausea significantly disrupts their eating for 2–3 days after each dose.',
    reassurance: "Nausea on injection day is a real side effect — not a weakness. FoodWise schedules softer foods when it hits hardest.",
  },
  confusion: {
    headline: 'Most nutrition apps weren\'t built for GLP-1 users — and it shows.',
    pct: 71,
    statText: 'of GLP-1 users feel that standard nutrition guidance doesn\'t apply to their appetite patterns.',
    reassurance: "Generic meal plans weren't designed around your injection schedule. FoodWise knows exactly how your hunger changes each week.",
  },
  muscle: {
    headline: 'Losing muscle on GLP-1 is common — but it\'s not inevitable.',
    pct: 60,
    statText: 'of GLP-1 users lose more muscle than expected because they don\'t prioritize protein on low-appetite days.',
    reassurance: "Muscle loss isn't your fault. Without a plan, appetite suppression silently steals your protein — FoodWise prevents that.",
  },
};

export default function Mirror1() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const { data } = useOnboarding();
  const struggle = (data.primary_struggle ?? 'protein') as Struggle;
  const copy = COPY[struggle] ?? COPY.protein;

  return (
    <OnboardingShell step={6} skipRoute="/(onboarding)/10-restrictions">
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Nori + empathy header */}
        <View style={s.header}>
          <Image
            source={require('@/assets/images/nori_character.png')}
            style={s.nori}
            resizeMode="contain"
          />
          <Text style={s.weHear}>We hear you.</Text>
          <Text style={s.headline}>{copy.headline}</Text>
        </View>

        {/* Stat card with bar */}
        <View style={s.statCard}>
          <View style={s.statCardTop}>
            <View style={s.statCircle}>
              <Text style={s.statCircleIcon}>👥</Text>
            </View>
            <Text style={s.statCardLabel}>From our community</Text>
          </View>
          <View style={s.statRow}>
            <Text style={s.statPct}>{copy.pct}%</Text>
            <Text style={s.statOfText}>of GLP-1 users</Text>
          </View>
          <Text style={s.statText}>{copy.statText}</Text>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${copy.pct}%` as any }]} />
          </View>
          <View style={s.barLabels}>
            <Text style={s.barLeft}>Struggling</Text>
            <Text style={s.barRight}>{copy.pct}%</Text>
          </View>
        </View>

        {/* Reassurance card */}
        <View style={s.reassureCard}>
          <Text style={s.reassureCheck}>✓</Text>
          <Text style={s.reassureText}>
            <Text style={s.reassureStrong}>You're not failing. </Text>
            {copy.reassurance}
          </Text>
        </View>
      </ScrollView>
      <View style={s.footer}>
        <Button label="Good to know" onPress={() => router.push('/(onboarding)/07-question2')} />
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    content: { paddingTop: Spacing.md, paddingBottom: Spacing.md },
    footer: { paddingTop: Spacing.md, paddingBottom: Spacing.xl },

    header: { alignItems: 'center', textAlign: 'center', marginBottom: Spacing['2xl'] },
    nori: { width: 56, height: 56, marginBottom: Spacing.md },
    weHear: {
      fontSize: FontSize.lg,
      fontFamily: 'PlusJakartaSans-Bold',
      color: c.primary,
      marginBottom: Spacing.sm,
    },
    headline: {
      fontSize: FontSize['2xl'],
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.foreground,
      lineHeight: 32,
      textAlign: 'center',
    },

    statCard: {
      padding: Spacing['2xl'],
      borderRadius: Radius.xl,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: Spacing.lg,
    },
    statCardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
    statCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(29,158,117,0.10)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statCircleIcon: { fontSize: 16 },
    statCardLabel: {
      fontSize: FontSize.xs,
      fontFamily: 'PlusJakartaSans-Bold',
      color: c.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    statRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: Spacing.sm },
    statPct: { fontSize: 48, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.primary, lineHeight: 52 },
    statOfText: { fontSize: FontSize.sm, color: c.mutedForeground, paddingBottom: 8 },
    statText: { fontSize: FontSize.sm, color: c.foreground, lineHeight: 20, marginBottom: Spacing.lg },
    barBg: { height: 12, borderRadius: 6, backgroundColor: c.muted, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 6, backgroundColor: c.primary },
    barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    barLeft: { fontSize: FontSize.xs, color: c.mutedForeground },
    barRight: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', color: c.primary },

    reassureCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
      padding: Spacing.lg,
      borderRadius: Radius.xl,
      backgroundColor: 'rgba(29,158,117,0.10)',
      borderWidth: 1,
      borderColor: 'rgba(29,158,117,0.20)',
      marginBottom: Spacing['2xl'],
    },
    reassureCheck: { fontSize: 20, color: c.secondary, marginTop: 2 },
    reassureText: { flex: 1, fontSize: FontSize.sm, color: c.foreground, lineHeight: 20 },
    reassureStrong: { color: c.secondary, fontFamily: 'PlusJakartaSans-Bold' },
  });
}
