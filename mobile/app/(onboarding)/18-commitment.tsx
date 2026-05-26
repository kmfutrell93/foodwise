import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

const COMMITMENTS = [
  { icon: '🥩', text: 'Log my meals daily — even on rough injection days' },
  { icon: '💪', text: 'Hit my protein target to protect my muscle' },
  { icon: '📅', text: 'Follow my injection-day plan' },
  { icon: '📈', text: 'Track symptoms to find what works for me' },
];

export default function Commitment() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const { saveStep } = useOnboarding();
  const scale = useRef(new Animated.Value(1)).current;

  async function handleCommit() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    await saveStep(18);
    router.push('/(onboarding)/19-pricing-intro');
  }

  return (
    <OnboardingShell step={18}>
      <View style={s.container}>
        <View style={s.noriWrap}>
          <Image source={require('@/assets/images/nori_character.png')} style={s.noriImg} resizeMode="contain" />
        </View>
        <Text style={s.label}>Your commitment</Text>
        <Text style={s.title}>Make it{'\n'}official.</Text>
        <Text style={s.sub}>Small daily actions build the habit. Here's what you're committing to:</Text>

        <View style={s.list}>
          {COMMITMENTS.map(c => (
            <View key={c.text} style={s.row}>
              <Text style={s.icon}>{c.icon}</Text>
              <Text style={s.text}>{c.text}</Text>
            </View>
          ))}
        </View>

        <View style={s.pledge}>
          <Text style={s.pledgeTitle}>The FoodWise Pledge</Text>
          <Text style={s.pledgeText}>
            "I'll show up for myself — not perfectly, but consistently. I'll use food as a tool to protect my health while on GLP-1 medication."
          </Text>
        </View>

        <View style={s.spacer} />
        <Animated.View style={{ transform: [{ scale }] }}>
          <Button label="I'm in — let's go" onPress={handleCommit} />
        </Animated.View>
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, paddingTop: Spacing.md, paddingBottom: Spacing.xl },
  noriWrap: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  noriImg: { width: 144, height: 144 },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: c.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, lineHeight: 38, marginBottom: Spacing.sm },
  sub: { fontSize: FontSize.sm, color: c.mutedForeground, lineHeight: 20, marginBottom: Spacing['2xl'] },
  list: { gap: Spacing.md, marginBottom: Spacing['2xl'] },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  icon: { fontSize: 22, lineHeight: 28 },
  text: { flex: 1, fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-SemiBold', color: c.foreground, lineHeight: 24 },
  pledge: { backgroundColor: c.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(232,157,53,0.3)', padding: Spacing.xl },
  pledgeTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: c.primary, marginBottom: Spacing.sm, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  pledgeText: { fontSize: FontSize.base, color: c.foreground, fontFamily: 'PlusJakartaSans-SemiBold', lineHeight: 26, textAlign: 'center', fontStyle: 'italic' },
  spacer: { flex: 1 },
});
}
