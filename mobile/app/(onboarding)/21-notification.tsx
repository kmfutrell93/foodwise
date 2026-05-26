import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';
import { useOnboarding } from '@/context/OnboardingContext';
import { supabase } from '@/lib/supabase';

const notifBenefits = [
  { icon: '💉', text: 'Injection-day meal package at 7am' },
  { icon: '📊', text: 'Weekly progress report every Sunday' },
  { icon: '🔥', text: 'Streak reminders before they reset' },
  { icon: '🎉', text: 'Milestone celebrations' },
];

export default function Notification() {
  const router = useRouter();
  const { setField, saveStep } = useOnboarding();
  const [loading, setLoading] = useState(false);

  async function requestPermission() {
    setLoading(true);
    const { status } = await Notifications.requestPermissionsAsync();
    const enabled = status === 'granted';
    setField('notifications_enabled', enabled);

    if (enabled) {
      const token = await Notifications.getExpoPushTokenAsync().catch(() => null);
      if (token) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').update({ push_token: token.data }).eq('id', user.id);
        }
      }
    }

    await saveStep(21);
    router.push('/(onboarding)/22-paywall');
    setLoading(false);
  }

  async function skipNotifications() {
    setField('notifications_enabled', false);
    await saveStep(21);
    router.push('/(onboarding)/22-paywall');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>🔔</Text>
        <Text style={styles.label}>Stay on track</Text>
        <Text style={styles.title}>Let Nori nudge{'\n'}you at the right{'\n'}moments.</Text>

        <View style={styles.benefits}>
          {notifBenefits.map((b) => (
            <View key={b.text} style={styles.benefit}>
              <Text style={styles.benefitIcon}>{b.icon}</Text>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.spacer} />

        <Button label="Enable notifications" onPress={requestPermission} loading={loading} />
        <Text style={styles.skip} onPress={skipNotifications}>Skip for now</Text>
        <Text style={styles.fine}>You can change this anytime in Settings</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing['3xl'], paddingBottom: Spacing.xl },
  emoji: { fontSize: 48, marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.sm },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 38, marginBottom: Spacing['2xl'] },
  benefits: { gap: Spacing.lg },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  benefitIcon: { fontSize: 24, width: 32 },
  benefitText: { fontSize: FontSize.base, color: Colors.foreground, flex: 1, lineHeight: 22 },
  spacer: { flex: 1 },
  skip: { textAlign: 'center', color: Colors.mutedForeground, fontSize: FontSize.base, paddingVertical: Spacing.lg },
  fine: { textAlign: 'center', color: Colors.mutedForeground, fontSize: FontSize.xs },
});
