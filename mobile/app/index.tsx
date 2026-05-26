import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useThemeColors } from '@/context/ThemeContext';

export default function Index() {
  const router = useRouter();
  const colors = useThemeColors();

  // DEV ONLY — reset auth session and local flags on every launch
  useEffect(() => {
    if (__DEV__) {
      supabase.auth.signOut();               // clears Supabase session from AsyncStorage
      AsyncStorage.multiRemove([
        'review_prompt_shown',               // progress.tsx review gate
        '@fw_theme',                         // ThemeContext preference
      ]);
    }
  }, []);

  useEffect(() => {
    console.log('[index] mounted');
    checkSession();
  }, []);

  async function checkSession() {
    console.log('[index] checkSession start');
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      );
      console.log('[index] calling getSession');
      const sessionPromise = supabase.auth.getSession();
      const { data: { session } } = await Promise.race([sessionPromise, timeout]) as any;
      console.log('[index] session:', session ? `uid=${session.user.id.slice(0, 8)}` : 'null');

      if (!session) {
        console.log('[index] → welcome (no session)');
        router.replace('/(onboarding)/01-welcome');
        return;
      }

      console.log('[index] fetching profile');
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_step')
        .eq('id', session.user.id)
        .single();

      console.log('[index] profile:', JSON.stringify(profile), 'err:', profileErr?.message);

      if (profile?.onboarding_completed) {
        console.log('[index] → home');
        router.replace('/(app)/home');
      } else {
        const step = profile?.onboarding_step ?? 0;
        const screens = [
          '01-welcome','02-problem','03-solution','04-aha',
          '05-question1','06-mirror1','07-question2','08-mirror2',
          '09-try-intro','10-restrictions','11-budget','12-appetite',
          '13-generating','14-meal-reveal','15-review','16-summary',
          '17-habit','18-commitment','19-pricing-intro','20-comparison',
          '21-notification','22-paywall',
        ];
        const screen = screens[Math.min(step, screens.length - 1)] ?? '01-welcome';
        console.log('[index] → onboarding step', step, screen);
        router.replace(`/(onboarding)/${screen}` as any);
      }
    } catch (e: unknown) {
      console.error('[index] error/timeout:', e instanceof Error ? e.message : e);
      router.replace('/(onboarding)/01-welcome');
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
