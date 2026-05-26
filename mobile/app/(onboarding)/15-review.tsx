import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

export default function Review() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.08, duration: 300, useNativeDriver: true, delay: 300 }),
      Animated.timing(scale, { toValue: 1.0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <OnboardingShell step={15}>
      <View style={s.center}>
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
          That meal plan? It's real. That's exactly what FoodWise generates for you{' '}
          <Text style={{ color: colors.foreground, fontFamily: 'PlusJakartaSans-Bold' }}>every week</Text>
          , personalized to your preferences and budget.
        </Text>

        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={s.cardTitle}>How are you feeling about FoodWise?</Text>
          <Text style={s.cardSub}>Tap a star to rate your experience so far</Text>
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity key={n} onPress={() => setRating(n)} activeOpacity={0.7}>
                <Text style={[s.star, { opacity: n <= rating ? 1 : 0.3 }]}>⭐</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={s.bottom}>
        <TouchableOpacity
          style={[s.reviewBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(onboarding)/16-summary')}
          activeOpacity={0.85}
        >
          <Text style={[s.reviewBtnText, { color: colors.primaryForeground }]}>Leave a quick review  ★</Text>
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
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },
    nori: { width: 96, height: 96 },
    confettiRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
    confetti: { fontSize: 24 },
    title: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, textAlign: 'center', lineHeight: 32, marginBottom: Spacing.md },
    sub: { fontSize: FontSize.sm, color: c.mutedForeground, textAlign: 'center', lineHeight: 22, marginBottom: Spacing['2xl'] },
    card: { width: '100%', borderRadius: 24, borderWidth: 1, padding: Spacing.xl, alignItems: 'center' },
    cardTitle: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold', color: c.foreground, textAlign: 'center', marginBottom: 4 },
    cardSub: { fontSize: FontSize.sm, color: c.mutedForeground, textAlign: 'center', marginBottom: Spacing.xl },
    starsRow: { flexDirection: 'row', gap: Spacing.lg },
    star: { fontSize: 36 },
    bottom: { paddingBottom: Spacing['3xl'], gap: Spacing.sm },
    reviewBtn: { borderRadius: Radius.full, paddingVertical: 18, alignItems: 'center' },
    reviewBtnText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold' },
    notNow: { paddingVertical: 14, alignItems: 'center' },
    notNowText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold' },
  });
}
