import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { SourcesLink } from '@/components/ui/SourcesLink';
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
    headline: '"Not hitting my protein" is a top challenge for GLP-1 users.',
    pct: 78,
    statText: 'of GLP-1 users in our community say appetite suppression makes daily protein goals harder.',
    reassurance: "You're not failing. The medication itself makes protein goals harder. FoodWise was built to solve exactly this.",
  },
  nausea: {
    headline: 'Nausea on injection day affects your whole week — not just one meal.',
    pct: 65,
    statText: 'of GLP-1 users in our community say nausea disrupts eating for 1–3 days after each dose.',
    reassurance: "Nausea is a documented GLP-1 side effect — not a weakness. FoodWise schedules softer, easier-to-tolerate foods when it hits hardest.",
  },
  confusion: {
    headline: 'Most nutrition apps weren\'t built for GLP-1 users — and it shows.',
    pct: 71,
    statText: 'of GLP-1 users in our community feel that standard nutrition guidance doesn\'t match their appetite patterns.',
    reassurance: "Generic meal plans weren't designed around your injection schedule. FoodWise knows exactly how your hunger changes each week.",
  },
  muscle: {
    headline: 'Losing lean mass on GLP-1 is common — but nutrition can help.',
    pct: 60,
    statText: 'of GLP-1 users in our community worry about muscle loss when appetite is low.',
    reassurance: "Lean-mass loss during weight loss is well documented. Prioritizing protein on low-appetite days is one of the main ways FoodWise helps.",
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
    <OnboardingShell step={6} screenKey="06-mirror1" skipRoute="/(onboarding)/10-restrictions">
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
            <Text style={s.reassureStrong}>You&apos;re not failing. </Text>
            {copy.reassurance}
          </Text>
        </View>
        <SourcesLink prefix="Clinical sources for nausea, protein & lean mass" />
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
