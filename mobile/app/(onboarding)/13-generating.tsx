import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withTiming, withRepeat, withSequence, withDelay,
  cancelAnimation, FadeIn, Easing, interpolate,
} from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { useOnboarding } from '@/context/OnboardingContext';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import { trackFirstMealGenerated } from '@/lib/analytics';

const STEPS = [
  'Analyzing your GLP-1 medication schedule…',
  'Calculating your protein floor…',
  'Matching meals to your budget…',
  'Scheduling injection-day adjustments…',
  'Finalizing your 7-day plan…',
];

export default function Generating() {
  const router = useRouter();
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const { saveStep } = useOnboarding();
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const doneRef = useRef(false);

  const pulse = useSharedValue(0.8);
  const barProgress = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, false,
    );

    let i = 0;
    const iv = setInterval(() => {
      i++;
      if (i < STEPS.length) setStepIdx(i);
    }, 1200);

    generate(iv);

    return () => {
      clearInterval(iv);
      cancelAnimation(pulse);
      cancelAnimation(barProgress);
    };
  }, []);

  useEffect(() => {
    const target = stepIdx / (STEPS.length - 1);
    barProgress.value = withTiming(target, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [stepIdx]);

  async function generate(iv?: ReturnType<typeof setInterval>) {
    setError(null);
    doneRef.current = false;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not signed in');

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/meal-plans-generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({}),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error ${res.status}`);
      }

      if (iv) clearInterval(iv);
      setStepIdx(STEPS.length - 1);
      doneRef.current = true;

      await new Promise(r => setTimeout(r, 600));
      trackFirstMealGenerated();
      await saveStep(13);
      router.push('/(onboarding)/14-meal-reveal');
    } catch (e: unknown) {
      if (iv) clearInterval(iv);
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }

  const noriStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: pulse.value }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${barProgress.value * 100}%`,
  }));

  if (error) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.container}>
          <Text style={s.errorEmoji}>😔</Text>
          <Text style={s.errorTitle}>Couldn't build your plan</Text>
          <Text style={s.errorSub}>{error}</Text>
          <TouchableOpacity style={[s.retryBtn, { backgroundColor: colors.primary }]} onPress={() => generate()} activeOpacity={0.85}>
            <Text style={[s.retryText, { color: colors.primaryForeground }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Animated.View style={[{ marginBottom: Spacing['2xl'] }, noriStyle]}>
          <Image source={require('@/assets/images/nori_character.png')} style={s.noriImage} resizeMode="contain" />
        </Animated.View>
        <Text style={s.title}>Nori is cooking up{'\n'}your plan...</Text>

        {/* Step text — remounts on each step change to trigger FadeIn */}
        <Animated.View key={stepIdx} entering={FadeIn.duration(300)} style={s.stepWrap}>
          <Text style={s.stepCurrent}>{STEPS[stepIdx]}</Text>
        </Animated.View>

        {/* Progress bar */}
        <View style={s.barBg}>
          <Animated.View style={[s.barFill, barStyle]} />
        </View>

        {/* Fact card */}
        <View style={s.factCard}>
          <Text style={s.factLabel}>💡 Did you know?</Text>
          <Text style={s.factText}>GLP-1 users need 1.2–1.6g of protein per kg of body weight to prevent muscle loss during weight reduction.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
    noriImage: { width: 112, height: 112 },
    title: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, textAlign: 'center', lineHeight: 32, marginBottom: Spacing.md },
    stepWrap: { marginBottom: Spacing['2xl'] },
    stepCurrent: { fontSize: FontSize.sm, color: c.mutedForeground, textAlign: 'center' },
    barBg: { width: 256, height: 8, borderRadius: 4, backgroundColor: c.muted, overflow: 'hidden', marginBottom: Spacing.xl },
    barFill: { height: '100%', borderRadius: 4, backgroundColor: c.primary },
    factCard: { width: '100%', padding: Spacing.lg, borderRadius: Radius.xl, backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
    factLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', color: c.primary, marginBottom: 4 },
    factText: { fontSize: FontSize.xs, color: c.mutedForeground, lineHeight: 18 },
    errorEmoji: { fontSize: 64, marginBottom: Spacing.xl },
    errorTitle: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, marginBottom: Spacing.sm, textAlign: 'center' },
    errorSub: { fontSize: FontSize.sm, color: c.mutedForeground, textAlign: 'center', lineHeight: 20, marginBottom: Spacing['2xl'] },
    retryBtn: { borderRadius: Radius.full, paddingVertical: 16, paddingHorizontal: 40 },
    retryText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold' },
  });
}
