import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import * as Notifications from 'expo-notifications';

const NUDGES = [
  { icon: '🌅', text: 'Morning protein reminder' },
  { icon: '💉', text: 'Injection-day meal alert' },
  { icon: '📋', text: 'Weekly plan ready notification' },
  { icon: '🔥', text: 'Streak protection reminders' },
];

export default function NotificationScreen() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const { setField, saveStep } = useOnboarding();
  const [loading, setLoading] = useState(false);

  async function requestPermission() {
    setLoading(true);
    try {
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        await proceed(false, null);
        return;
      }
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
        await proceed(true, tokenData?.data ?? null);
      } else {
        await proceed(false, null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function skip() {
    await proceed(false, null);
  }

  async function proceed(enabled: boolean, token: string | null) {
    setField('notifications_enabled', enabled);
    if (token) setField('push_token', token);
    await saveStep(21);
    router.push('/(onboarding)/21b-disclosure');
  }

  return (
    <OnboardingShell step={21}>
      <View style={s.container}>
        <View style={s.noriWrap}>
          <Image source={require('@/assets/images/nori_character.png')} style={s.noriImg} resizeMode="contain" />
          <View style={s.bellBadge}>
            <Text style={s.bellBadgeIcon}>🔔</Text>
          </View>
        </View>
        <Text style={s.label}>Stay on track</Text>
        <Text style={s.title}>Don't let a missed{'\n'}meal break your{'\n'}streak.</Text>
        <Text style={s.sub}>Turn on notifications so we can remind you at the right moment — especially on injection day.</Text>

        <View style={s.nudges}>
          {NUDGES.map(n => (
            <View key={n.text} style={s.nudgeRow}>
              <Text style={s.nudgeIcon}>{n.icon}</Text>
              <Text style={s.nudgeText}>{n.text}</Text>
            </View>
          ))}
        </View>

        <View style={s.spacer} />

        <Button label="Turn on notifications" onPress={requestPermission} loading={loading} style={s.primaryBtn} />
        <Button label="Maybe later" variant="ghost" onPress={skip} style={s.skipBtn} />
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, paddingTop: Spacing.md, paddingBottom: Spacing.xl },
  noriWrap: { position: 'relative', alignSelf: 'flex-start', marginBottom: Spacing.xl },
  noriImg: { width: 112, height: 112 },
  bellBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: c.background,
  },
  bellBadgeIcon: { fontSize: 18 },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: c.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, lineHeight: 38, marginBottom: Spacing.sm },
  sub: { fontSize: FontSize.sm, color: c.mutedForeground, lineHeight: 20, marginBottom: Spacing['2xl'] },
  nudges: { gap: Spacing.md },
  nudgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  nudgeIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  nudgeText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-SemiBold', color: c.foreground },
  spacer: { flex: 1 },
  primaryBtn: { marginBottom: Spacing.sm },
  skipBtn: {},
});
}
