import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import { requestHealthPermissions } from '@/lib/health-sync';
import { trackHealthConnectPrompted, trackHealthConnectAccepted, trackHealthConnectSkipped } from '@/lib/analytics';
import { useEffect } from 'react';

const BENEFITS = [
  { icon: '⚖️', text: 'Auto-sync your weight — no manual logging' },
  { icon: '👣', text: 'Steps count toward your daily activity goal' },
  { icon: '🥩', text: 'Protein logged to Health for your other apps' },
];

export default function AppleHealth() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    trackHealthConnectPrompted();
  }, []);

  // iOS only — skip entirely on Android
  if (Platform.OS !== 'ios') {
    router.replace('/(onboarding)/09-try-intro');
    return null;
  }

  async function handleConnect() {
    setConnecting(true);
    const granted = await requestHealthPermissions();
    setConnecting(false);
    trackHealthConnectAccepted({ granted });
    router.push('/(onboarding)/09-try-intro');
  }

  function handleSkip() {
    trackHealthConnectSkipped();
    router.push('/(onboarding)/09-try-intro');
  }

  return (
    <OnboardingShell step={8} skipRoute="/(onboarding)/09-try-intro" onSkip={handleSkip}>
      <View style={s.content}>
        {/* Header */}
        <View style={s.header}>
          <Image
            source={require('@/assets/images/nori_character.png')}
            style={s.nori}
            resizeMode="contain"
          />
          <Text style={s.title}>Connect Apple Health</Text>
          <Text style={s.subtitle}>
            Let FoodWise read your weight and steps — and write your daily protein — all without leaving the app.
          </Text>
        </View>

        {/* Benefits */}
        <View style={s.benefits}>
          {BENEFITS.map(b => (
            <View key={b.text} style={s.benefitRow}>
              <View style={s.benefitIconWrap}>
                <Text style={s.benefitIcon}>{b.icon}</Text>
              </View>
              <Text style={s.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* Privacy note */}
        <View style={s.privacyNote}>
          <Text style={s.privacyIcon}>🔒</Text>
          <Text style={s.privacyText}>Your health data never leaves your device and is never sold.</Text>
        </View>

        {/* CTA */}
        {connecting ? (
          <View style={s.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={s.loadingText}>Requesting permissions…</Text>
          </View>
        ) : (
          <Button label="Connect Apple Health" onPress={handleConnect} />
        )}

        {/* Skip */}
        <Text style={s.skipText} onPress={handleSkip}>
          Skip for now
        </Text>
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    content: { paddingTop: Spacing.md, paddingBottom: Spacing['2xl'] },

    header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
    nori: { width: 56, height: 56, marginBottom: Spacing.lg },
    title: {
      fontSize: FontSize['2xl'],
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.foreground,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: FontSize.sm,
      color: c.mutedForeground,
      textAlign: 'center',
      lineHeight: 22,
    },

    benefits: { gap: Spacing.lg, marginBottom: Spacing['2xl'] },
    benefitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
    benefitIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(29,158,117,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    benefitIcon: { fontSize: 20 },
    benefitText: { flex: 1, fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Medium', color: c.foreground, lineHeight: 20 },

    privacyNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.card,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: Spacing.lg,
      marginBottom: Spacing['2xl'],
    },
    privacyIcon: { fontSize: 16 },
    privacyText: { flex: 1, fontSize: FontSize.xs, color: c.mutedForeground, lineHeight: 18 },

    loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingVertical: 16 },
    loadingText: { fontSize: FontSize.sm, color: c.mutedForeground, fontFamily: 'PlusJakartaSans-Medium' },

    skipText: {
      textAlign: 'center',
      marginTop: Spacing.lg,
      fontSize: FontSize.sm,
      color: c.mutedForeground,
      textDecorationLine: 'underline',
      fontFamily: 'PlusJakartaSans-Medium',
    },
  });
}
