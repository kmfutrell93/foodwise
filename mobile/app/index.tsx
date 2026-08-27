import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useThemeColors } from '@/context/ThemeContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { getOnboardingScreenAtStep } from '@/constants/onboardingFlow';

export default function Index() {
  const router = useRouter();
  const colors = useThemeColors();
  const { hydrateFromProfile } = useOnboarding();

  // DEV ONLY — reset auth session and local flags on every launch
  useEffect(() => {
    if (__DEV__) {
      // To test sign-in flow: comment out the signOut() call below.
      supabase.auth.signOut();               // clears Supabase session from AsyncStorage
      AsyncStorage.multiRemove([
        'review_prompt_shown',               // progress.tsx review gate
        '@fw_theme',                         // ThemeContext preference
      ]);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      );
      const sessionPromise = supabase.auth.getSession();
      const { data: { session } } = await Promise.race([sessionPromise, timeout]) as any;

      if (!session) {
        router.replace('/(onboarding)/01-welcome');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_step')
        .eq('id', session.user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.replace('/(app)/home');
      } else {
        await hydrateFromProfile(session.user.id);
        const step = profile?.onboarding_step ?? 0;
        const screen = getOnboardingScreenAtStep(step);
        router.replace(`/(onboarding)/${screen}` as any);
      }
    } catch (e: unknown) {
      if (__DEV__) console.error('[index] error/timeout:', e instanceof Error ? e.message : e);
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
