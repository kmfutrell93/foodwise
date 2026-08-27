import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { FontSize, Spacing, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import * as Notifications from 'expo-notifications';
import { logError } from '@/lib/utils';

function resolveEasProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined
  );
}

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
        console.log('[push] unsupported platform — skipping token');
        await proceed(false, null);
        return;
      }
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('[push] permission:', status);
      if (status !== 'granted') {
        await proceed(false, null);
        return;
      }

      const projectId = resolveEasProjectId();
      console.log('[push] projectId available:', Boolean(projectId));
      if (!projectId) {
        console.error('[push] missing EAS projectId — cannot request Expo push token');
        await proceed(true, null);
        return;
      }

      let token: string | null = null;
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        token = tokenData?.data ?? null;
        console.log('[push] token received:', Boolean(token), token ? token.slice(0, 20) : '');
      } catch (tokenErr) {
        logError('push:getExpoPushTokenAsync', tokenErr);
        console.error('[push] token request failed');
      }

      // Only mark notifications_enabled when permission was granted.
      // Token may still be null (simulator / APNs failure) — do not invent success.
      await proceed(true, token);
    } finally {
      setLoading(false);
    }
  }

  async function skip() {
    await proceed(false, null);
  }

  async function proceed(enabled: boolean, token: string | null) {
    setField('notifications_enabled', enabled);
    if (token) {
      setField('push_token', token);
    }
    // Pass overrides explicitly — push_token is the field email/push targeting
    // depends on, so it can't be left to catch up on a later render.
    await saveStep(24, { notifications_enabled: enabled, ...(token ? { push_token: token } : {}) }); // screens[24] = '21b-disclosure'
    router.push('/(onboarding)/21b-disclosure');
  }

  return (
    <OnboardingShell step={21} screenKey="21-notification">
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.noriWrap}>
          <Image source={require('@/assets/images/nori_character.png')} style={s.noriImg} resizeMode="contain" />
          <View style={s.bellBadge}>
            <Text style={s.bellBadgeIcon}>🔔</Text>
          </View>
        </View>
        <Text style={s.label}>Stay on track</Text>
        <Text style={s.title}>Don&apos;t let a missed{'\n'}meal break your{'\n'}streak.</Text>
        <Text style={s.sub}>Turn on notifications so we can remind you at the right moment — especially on injection day.</Text>

        <View style={s.nudges}>
          {NUDGES.map(n => (
            <View key={n.text} style={s.nudgeRow}>
              <Text style={s.nudgeIcon}>{n.icon}</Text>
              <Text style={s.nudgeText}>{n.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={s.footer}>
        <Button label="Turn on notifications" onPress={requestPermission} loading={loading} style={s.primaryBtn} />
        <Button label="Maybe later" variant="ghost" onPress={skip} style={s.skipBtn} />
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
  content: { paddingTop: Spacing.md, paddingBottom: Spacing.md },
  footer: { paddingTop: Spacing.md, paddingBottom: Spacing.xl },
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
  primaryBtn: { marginBottom: Spacing.sm },
  skipBtn: {},
});
}
