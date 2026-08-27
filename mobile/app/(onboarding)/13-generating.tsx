import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Animated as RNAnimated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withRepeat, withSequence,
  cancelAnimation, Easing,
} from 'react-native-reanimated';
import { useOnboarding } from '@/context/OnboardingContext';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import { trackFirstMealGenerated } from '@/lib/analytics';
import { getOnboardingProgressPct } from '@/constants/onboardingFlow';
import { generatePlanWithPolling } from '@/lib/generate-plan';
import { logError } from '@/lib/utils';

const PROGRESS_PCT = getOnboardingProgressPct('13-generating');

const MESSAGE_INTERVAL_MS = 3000;

export default function Generating() {
  const router = useRouter();
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const { data, saveStep } = useOnboarding();

  const medication = data.medication ?? 'GLP-1';
  const messages = [
    `Checking your ${medication} profile…`,
    `Planning your injection day meals…`,
    `Setting your 100–130g protein target…`,
    `Adjusting for your food preferences…`,
    `Building your Week 1 plan…`,
    `Adding your grocery list…`,
    `Almost ready…`,
  ];

  const [currentMessage, setCurrentMessage] = useState(messages[0]);
  const [error, setError] = useState<string | null>(null);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [planReady, setPlanReady] = useState(false);
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigatedRef = useRef(false);

  const pulse = useSharedValue(0.8);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, false,
    );

    generate();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (minTimeRef.current) clearTimeout(minTimeRef.current);
      cancelAnimation(pulse);
    };
  }, []);

  useEffect(() => {
    if (minTimePassed && planReady && !navigatedRef.current) {
      navigatedRef.current = true;
      (async () => {
        trackFirstMealGenerated();
        await saveStep(16); // → 13b-create-account
        router.push('/(onboarding)/13b-create-account');
      })();
    }
  }, [minTimePassed, planReady]);

  function advanceMessage(nextIndex: number) {
    RNAnimated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentMessage(messages[nextIndex % messages.length]);
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  }

  async function generate() {
    setError(null);
    setPlanReady(false);
    setMinTimePassed(false);
    setCurrentMessage(messages[0]);
    fadeAnim.setValue(1);

    if (minTimeRef.current) clearTimeout(minTimeRef.current);
    minTimeRef.current = setTimeout(() => setMinTimePassed(true), 3000);

    let messageIndex = 0;
    const interval = setInterval(() => {
      messageIndex += 1;
      advanceMessage(messageIndex);
    }, MESSAGE_INTERVAL_MS);
    intervalRef.current = interval;

    try {
      const result = await generatePlanWithPolling();
      clearInterval(interval);
      intervalRef.current = null;

      if (!result.success) {
        throw new Error(result.error);
      }

      advanceMessage(messages.length - 1);
      setPlanReady(true);
    } catch (e: unknown) {
      clearInterval(interval);
      intervalRef.current = null;
      logError('onboarding:13-generating', e);
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }

  const noriStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: pulse.value }],
  }));

  if (error) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${PROGRESS_PCT}%` }]} />
        </View>
        <View style={s.container}>
          <Text style={s.errorEmoji}>😔</Text>
          <Text style={s.errorTitle}>Couldn&apos;t build your plan</Text>
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
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${PROGRESS_PCT}%` }]} />
      </View>
      <View style={s.container}>
        <Animated.View style={[{ marginBottom: Spacing['2xl'] }, noriStyle]}>
          <Image source={require('@/assets/images/nori_character.png')} style={s.noriImage} resizeMode="contain" />
        </Animated.View>
        <Text style={s.title}>Nori is cooking up{'\n'}your plan...</Text>

        <ActivityIndicator size="large" color={colors.primary} style={s.spinner} />

        <RNAnimated.Text style={[s.statusText, { opacity: fadeAnim }]}>{currentMessage}</RNAnimated.Text>

        <Text style={s.subText}>Your first plan is personalized to your exact schedule</Text>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    progressTrack: { height: 4, backgroundColor: c.muted, overflow: 'hidden' },
    progressFill: { height: 4, backgroundColor: c.primary, borderRadius: 2 },
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
    noriImage: { width: 112, height: 112 },
    title: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, textAlign: 'center', lineHeight: 32, marginBottom: Spacing.xl },
    spinner: { marginBottom: Spacing.xl },
    statusText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, color: c.foreground, textAlign: 'center', marginBottom: Spacing.sm },
    subText: { fontSize: 13, color: c.mutedForeground, textAlign: 'center' },
    errorEmoji: { fontSize: 64, marginBottom: Spacing.xl },
    errorTitle: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, marginBottom: Spacing.sm, textAlign: 'center' },
    errorSub: { fontSize: FontSize.sm, color: c.mutedForeground, textAlign: 'center', lineHeight: 20, marginBottom: Spacing['2xl'] },
    retryBtn: { borderRadius: Radius.full, paddingVertical: 16, paddingHorizontal: 40 },
    retryText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold' },
  });
}
