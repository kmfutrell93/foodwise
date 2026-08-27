import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

export default function Review() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.08, duration: 300, useNativeDriver: true, delay: 300 }),
      Animated.timing(scale, { toValue: 1.0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleReview() {
    await StoreReview.requestReview();
    router.push('/(onboarding)/16-summary');
  }

  return (
    <OnboardingShell step={15} screenKey="15-review">
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={s.center} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ transform: [{ scale }], marginBottom: Spacing.sm }}>
          <Image
            source={require('@/assets/images/nori_character.png')}
            style={s.nori}
            resizeMode="contain"
          />
        </Animated.View>

        <View style={s.confettiRow}>
          <Text style={s.confetti}>🎉</Text>
          <Text style={s.confetti}>🎉</Text>
          <Text style={s.confetti}>🎉</Text>
        </View>

        <Text style={s.title}>
          You just planned{'\n'}like a{' '}
          <Text style={{ color: colors.primary }}>nutrition expert!</Text>
        </Text>

        <Text style={s.sub}>
          That meal plan? It&apos;s real. That&apos;s exactly what FoodWise generates for you{' '}
          <Text style={{ color: colors.foreground, fontFamily: 'PlusJakartaSans-Bold' }}>every week</Text>
          , personalized to your preferences and budget.
        </Text>

        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={s.cardEmoji}>🌟</Text>
          <Text style={s.cardTitle}>Loving FoodWise so far?</Text>
          <Text style={s.cardSub}>Tell the App Store — it takes 10 seconds and helps other people find Nori.</Text>
        </View>
      </ScrollView>

      <View style={s.bottom}>
        <TouchableOpacity
          style={[s.reviewBtn, { backgroundColor: colors.primary }]}
          onPress={handleReview}
          activeOpacity={0.85}
        >
          <Text style={[s.reviewBtnText, { color: colors.primaryForeground }]}>Rate FoodWise</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(onboarding)/16-summary')}
          activeOpacity={0.7}
          style={s.notNow}
        >
          <Text style={[s.notNowText, { color: colors.mutedForeground }]}>Not now</Text>
        </TouchableOpacity>
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
    nori: { width: 96, height: 96 },
    confettiRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
    confetti: { fontSize: 24 },
    title: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, textAlign: 'center', lineHeight: 32, marginBottom: Spacing.md },
    sub: { fontSize: FontSize.sm, color: c.mutedForeground, textAlign: 'center', lineHeight: 22, marginBottom: Spacing['2xl'] },
    card: { width: '100%', borderRadius: 24, borderWidth: 1, padding: Spacing.xl, alignItems: 'center' },
    cardEmoji: { fontSize: 36, marginBottom: Spacing.sm },
    cardTitle: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold', color: c.foreground, textAlign: 'center', marginBottom: 4 },
    cardSub: { fontSize: FontSize.sm, color: c.mutedForeground, textAlign: 'center' },
    bottom: { paddingBottom: Spacing['3xl'], gap: Spacing.sm },
    reviewBtn: { borderRadius: Radius.full, paddingVertical: 18, alignItems: 'center' },
    reviewBtnText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold' },
    notNow: { paddingVertical: 14, alignItems: 'center' },
    notNowText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold' },
  });
}
