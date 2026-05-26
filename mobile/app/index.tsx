import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/(onboarding)/01-welcome');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
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
      const step = profile?.onboarding_step ?? 0;
      const screen = stepToScreen(step);
      router.replace(`/(onboarding)/${screen}` as any);
    }
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

function stepToScreen(step: number): string {
  const screens = [
    '01-welcome', '02-problem', '03-solution', '04-aha',
    '05-question1', '06-mirror1', '07-question2', '08-mirror2',
    '09-try-intro', '10-restrictions', '11-budget', '12-appetite',
    '13-generating', '14-meal-reveal', '15-review', '16-summary',
    '17-habit', '18-commitment', '19-pricing-intro', '20-comparison',
    '21-notification', '22-paywall',
  ];
  return screens[Math.min(step, screens.length - 1)] ?? '01-welcome';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
});
