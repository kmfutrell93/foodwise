import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

/**
 * Informational placeholder — Apple Health / HealthKit is not enabled in this
 * build. Kept in the onboarding flow so screen order stays stable; users can
 * continue without requesting any Health permissions.
 */
export default function AppleHealth() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();

  function continueNext() {
    router.push('/(onboarding)/09-try-intro');
  }

  return (
    <OnboardingShell step={8} screenKey="08b-apple-health" skipRoute="/(onboarding)/09-try-intro" onSkip={continueNext}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Image
            source={require('@/assets/images/nori_character.png')}
            style={s.nori}
            resizeMode="contain"
          />
          <Text style={s.title}>Apple Health</Text>
          <Text style={s.subtitle}>
            Apple Health sync is coming soon. For now, you can log weight and track progress right inside FoodWise.
          </Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardText}>
            When Health sync ships, you&apos;ll be able to optionally share weight and activity — always under your control.
          </Text>
        </View>
      </ScrollView>
      <View style={s.footer}>
        <Button label="Continue" onPress={continueNext} />
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    content: { paddingTop: Spacing.md, paddingBottom: Spacing.md },
    footer: { paddingTop: Spacing.md, paddingBottom: Spacing.xl },

    header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
    nori: { width: 56, height: 56, marginBottom: Spacing.lg },
    title: {
      fontSize: FontSize['2xl'],
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.foreground,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: FontSize.sm,
      color: c.mutedForeground,
      textAlign: 'center',
      lineHeight: 22,
    },

    card: {
      backgroundColor: c.card,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: Spacing.lg,
    },
    cardText: {
      fontSize: FontSize.sm,
      color: c.foreground,
      lineHeight: 22,
      fontFamily: 'PlusJakartaSans-Medium',
    },
  });
}
