import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { supabase } from '@/lib/supabase';
import { FontSize, Spacing, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import { initAnalytics, trackOnboardingStarted } from '@/lib/analytics';

export default function Welcome() {
  const router = useRouter();
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const { data } = await supabase.auth.signInAnonymously();
      if (data.user) await initAnalytics(data.user.id);
    }
    trackOnboardingStarted();
    router.push('/(onboarding)/02-problem');
    setLoading(false);
  }

  return (
    <OnboardingShell step={1} screenKey="01-welcome" showBack={false} skipRoute="/(onboarding)/10-restrictions">
      {/* Nori + speech bubble */}
      <View style={s.heroArea}>
        <View style={s.noriWrap}>
          <Image
            source={require('@/assets/images/nori_character.png')}
            style={s.nori}
            resizeMode="contain"
          />
          <View style={s.bubble}>
            <Text style={s.bubbleText}>Hey there! 👋</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={s.title}>
          Meet <Text style={s.titleHighlight}>Nori</Text>,{'\n'}your GLP-1{'\n'}nutrition guide.
        </Text>

        {/* Subtitle */}
        <Text style={s.subtitle}>
          Built for Ozempic, Wegovy, Mounjaro & Zepbound users who want to eat smarter — not just less.
        </Text>

        {/* Trust badges */}
        <View style={s.badges}>
          <View style={s.badge}>
            <Text style={s.badgeStar}>★</Text>
            <Text style={s.badgeLabel}>4.9 Rating</Text>
          </View>
          <View style={s.divider} />
          <View style={s.badge}>
            <Text style={s.badgeIcon}>👥</Text>
            <Text style={s.badgeLabel}>50K+ Users</Text>
          </View>
          <View style={s.divider} />
          <View style={s.badge}>
            <Text style={s.badgeIcon}>🛡️</Text>
            <Text style={s.badgeLabel}>Science-based</Text>
          </View>
        </View>
      </View>

      {/* CTA pushed to bottom */}
      <View style={s.bottom}>
        <Button label="Let's get started" onPress={handleStart} loading={loading} />
        <Text style={s.disclaimer}>Free 7-day trial · No credit card required to start</Text>
        <TouchableOpacity onPress={() => router.push('/(onboarding)/sign-in')} activeOpacity={0.7} style={s.signInRow}>
          <Text style={s.signInText}>
            Already have an account? <Text style={[s.signInLink, { color: colors.primary }]}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    heroArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: Spacing.md,
    },

    noriWrap: { position: 'relative', marginBottom: Spacing['2xl'] },
    nori: { width: 160, height: 160 },
    bubble: {
      position: 'absolute',
      top: -8,
      right: -16,
      backgroundColor: c.primary,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    bubbleText: {
      fontSize: FontSize.xs,
      fontFamily: 'PlusJakartaSans-Bold',
      color: c.primaryForeground,
    },

    title: {
      fontSize: 36,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.foreground,
      textAlign: 'center',
      lineHeight: 44,
      marginBottom: Spacing.md,
    },
    titleHighlight: { color: c.primary },

    subtitle: {
      fontSize: FontSize.base,
      color: c.mutedForeground,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: Spacing['2xl'],
    },

    badges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    badgeStar: { fontSize: 12, color: c.primary },
    badgeIcon: { fontSize: 12 },
    badgeLabel: {
      fontSize: FontSize.xs,
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: c.mutedForeground,
    },
    divider: { width: 1, height: 12, backgroundColor: c.border },

    bottom: { gap: Spacing.md, paddingBottom: Spacing.md },
    disclaimer: { textAlign: 'center', color: c.mutedForeground, fontSize: FontSize.xs },
    signInRow: { alignItems: 'center', paddingTop: Spacing.xs, paddingVertical: 8 },
    signInText: { fontSize: FontSize.sm, color: c.mutedForeground },
    signInLink: { fontFamily: 'PlusJakartaSans-Bold' },
  });
}
